const crypto = require("crypto");
const db = require("../config/db").promise();
const { withTx, HttpError, sendError } = require("../utils/tx");
const razorpay = require("../utils/razorpay");
const { buildQuote, toMinor, fromMinor } = require("../utils/pricing");
const { provisionSite } = require("../utils/provision");

const ID_PATTERN = /^[1-9]\d{0,19}$/;
const STATUSES = new Set(["created", "authorized", "captured", "failed", "refunded"]);

const isId = (value) => {
  if (typeof value === "number" && !Number.isSafeInteger(value)) return false;
  if (!ID_PATTERN.test(String(value ?? ""))) return false;
  return BigInt(value) <= 18446744073709551615n;
};

const parsePages = (row) => {
  if (typeof row.pages === "string") {
    try {
      row.pages = JSON.parse(row.pages);
    } catch (error) {
      console.error("Invalid payment page JSON:", error);
      throw new Error("Invalid stored payment page data");
    }
  }
  row.pages ??= [];
  return row;
};

const PAYMENT_COLUMNS = `
  p.id, p.transactionId, p.userId, p.templateId, t.name AS templateName,
  p.themeId, th.name AS themeName, p.amount, p.currency, p.method,
  p.status, p.paidAt, p.createdAt,
  (SELECT JSON_ARRAYAGG(JSON_OBJECT(
     'pagesId', pp.pagesId, 'title', pg.title, 'isDefault', pp.isDefault,
     'price', pp.price, 'sortOrder', pp.sortOrder
   ))
   FROM paymentpages pp JOIN pages pg ON pg.pagesId = pp.pagesId
   WHERE pp.paymentId = p.id) AS pages
`;

const getUserId = (req) => req.user?.userId;

// POST /payments/quote
const quotePayment = async (req, res) => {
  const { templateId, themeId } = req.body ?? {};
  const rawPageIds = req.body?.additionalPageIds ?? [];

  if (!isId(templateId)) return res.status(400).json({ message: "A valid templateId is required" });
  if (!isId(themeId)) return res.status(400).json({ message: "Select exactly one theme" });
  if (!Array.isArray(rawPageIds) || rawPageIds.some((id) => !isId(id))) {
    return res.status(400).json({ message: "additionalPageIds must be an array of valid ids" });
  }
  const additionalPageIds = [...new Set(rawPageIds.map(String))];

  try {
    const result = await withTx(async (connection) => {
      const { template, pages, totalMinor } = await buildQuote(connection, {
        templateId,
        themeId,
        additionalPageIds,
      });
      return {
        templateId: template.templateId,
        templateName: template.name,
        templatePrice: template.price,
        currency: template.currency,
        pages: pages.map((p) => ({
          pagesId: p.pagesId,
          isDefault: p.isDefault,
          price: fromMinor(p.minor),
          sortOrder: p.sortOrder,
        })),
        total: fromMinor(totalMinor),
        totalMinor: Number(totalMinor),
      };
    });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
};

// POST /payments
const createPayment = async (req, res) => {
  const userId = getUserId(req);
  const { templateId, themeId } = req.body ?? {};
  const rawPageIds = req.body?.additionalPageIds ?? [];
  if (!isId(templateId)) return res.status(400).json({ message: "A valid templateId is required" });
  if (!isId(themeId)) return res.status(400).json({ message: "Select exactly one theme" });
  if (!Array.isArray(rawPageIds) || rawPageIds.some((id) => !isId(id))) {
    return res.status(400).json({ message: "additionalPageIds must be an array of valid ids" });
  }
  const additionalPageIds = [...new Set(rawPageIds.map(String))];

  try {
    const orderInfo = await withTx(async (connection) => {
      const { template, pages, totalMinor } = await buildQuote(connection, {
        templateId,
        themeId,
        additionalPageIds,
      });

      const order = await razorpay.createOrder({
        amount: Number(totalMinor),
        currency: template.currency,
        receipt: `t${templateId}-${crypto.randomBytes(8).toString("hex")}`.slice(0, 40),
        notes: { userId: String(userId), templateId: String(templateId) },
      });
      if (
        typeof order.id !== "string" ||
        !order.id ||
        order.amount !== Number(totalMinor) ||
        order.currency !== template.currency
      ) {
        throw new HttpError(502, "Payment provider returned an invalid order");
      }

      const [result] = await connection.query(
        `INSERT INTO payments
           (transactionId, userId, templateId, themeId, templatePriceSnapshot,
            amount, currency, method, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'razorpay', 'created')`,
        [
          order.id,
          userId,
          templateId,
          themeId,
          template.price,
          fromMinor(totalMinor),
          template.currency,
        ],
      );

      for (const page of pages) {
        await connection.query(
          `INSERT INTO paymentpages
             (paymentId, pagesId, templateId, isDefault, price, sortOrder)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            result.insertId,
            page.pagesId,
            templateId,
            page.isDefault ? 1 : 0,
            fromMinor(page.minor),
            page.sortOrder ?? 0,
          ],
        );
      }

      return {
        id: result.insertId,
        orderId: order.id,
        amountMinor: Number(totalMinor),
        totalAmount: fromMinor(totalMinor),
        currency: template.currency,
      };
    });

    const { keyId } = razorpay.credentials();
    return res.status(201).json({
      message: "Razorpay order created",
      ...orderInfo,
      keyId,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const capturePayment = async ({ orderId, paymentEntity, userId }) =>
  withTx(async (connection) => {
    const [[payment]] = await connection.query(
      `SELECT p.id, p.userId, p.templateId, p.themeId, p.amount, p.currency,
              p.status, t.name AS templateName, t.validityDays, u.name AS userName
         FROM payments p
         JOIN template t ON t.templateId = p.templateId
         JOIN users u ON u.userId = p.userId
        WHERE p.transactionId = ? FOR UPDATE`,
      [orderId],
    );
    if (!payment) throw new HttpError(404, "Payment order not found");
    if (userId && String(payment.userId) !== String(userId)) {
      throw new HttpError(403, "Payment order does not belong to this user");
    }
    if (String(paymentEntity.order_id) !== String(orderId)) {
      throw new HttpError(400, "Payment order does not match");
    }
    if (
      Number(paymentEntity.amount) !== Number(toMinor(payment.amount)) ||
      paymentEntity.currency !== payment.currency
    ) {
      throw new HttpError(400, "Payment amount does not match the order");
    }
    if (payment.status === "refunded") throw new HttpError(409, "Payment has been refunded");

    if (payment.status === "captured") {
      const [[site]] = await connection.query(
        "SELECT id FROM sites WHERE paymentId = ?",
        [payment.id],
      );
      const [[invoice]] = await connection.query(
        "SELECT invoiceNumber FROM invoices WHERE paymentId = ?",
        [payment.id],
      );
      return {
        siteId: site?.id ?? null,
        invoiceNumber: invoice?.invoiceNumber ?? null,
        alreadyProcessed: true,
      };
    }

    await connection.query(
      `UPDATE payments SET status = 'captured', method = ?, paidAt = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [
        typeof paymentEntity.method === "string"
          ? paymentEntity.method.slice(0, 30)
          : "razorpay",
        payment.id,
      ],
    );

    const provisioned = await provisionSite(connection, payment);
    return { ...provisioned, alreadyProcessed: false };
  });

const verifyPayment = async (req, res) => {
  const orderId = req.body?.razorpay_order_id;
  const paymentId = req.body?.razorpay_payment_id;
  const signature = req.body?.razorpay_signature;
  if (
    typeof orderId !== "string" ||
    !orderId ||
    typeof paymentId !== "string" ||
    !paymentId ||
    typeof signature !== "string"
  ) {
    return res.status(400).json({ message: "Razorpay order, payment and signature are required" });
  }

  try {
    if (!razorpay.verifyCheckoutSignature(orderId, paymentId, signature)) {
      throw new HttpError(400, "Invalid payment signature");
    }
    const [[order]] = await db.query(
      "SELECT amount, currency FROM payments WHERE transactionId = ? AND userId = ?",
      [orderId, getUserId(req)],
    );
    if (!order) throw new HttpError(404, "Payment order not found");

    const providerPayment = await razorpay.fetchPayment(paymentId);
    if (
      providerPayment.order_id !== orderId ||
      providerPayment.status !== "captured" ||
      Number(providerPayment.amount) !== Number(toMinor(order.amount)) ||
      providerPayment.currency !== order.currency
    ) {
      throw new HttpError(409, "Payment is not captured or does not match this order");
    }
    const result = await capturePayment({
      orderId,
      paymentEntity: providerPayment,
      userId: getUserId(req),
    });
    return res.json({ message: "Payment verified", ...result });
  } catch (error) {
    return sendError(res, error);
  }
};

const razorpayWebhook = async (req, res) => {
  const signature = req.get("x-razorpay-signature");
  try {
    if (!Buffer.isBuffer(req.rawBody) || !razorpay.verifyWebhookSignature(req.rawBody, signature)) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }
    const event = req.body;
    if (event?.event === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      if (!paymentEntity?.order_id) throw new HttpError(400, "Webhook payment is missing its order");
      await capturePayment({ orderId: paymentEntity.order_id, paymentEntity });
    } else if (event?.event === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      if (paymentEntity?.order_id) {
        await db.query(
          `UPDATE payments SET status = 'failed'
            WHERE transactionId = ? AND status IN ('created', 'authorized')`,
          [paymentEntity.order_id],
        );
      }
    } else if (event?.event === "refund.processed") {
      const refund = event.payload?.refund?.entity;
      if (refund?.payment_id) {
        const providerPayment = await razorpay.fetchPayment(refund.payment_id);
        if (
          providerPayment.order_id &&
          Number(refund.amount) === Number(providerPayment.amount)
        ) {
          await db.query(
            `UPDATE payments SET status = 'refunded'
              WHERE transactionId = ? AND status = 'captured'`,
            [providerPayment.order_id],
          );
        }
      }
    }
    return res.json({ received: true });
  } catch (error) {
    if (error instanceof HttpError && error.status < 500) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Razorpay webhook processing failed:", error);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ${PAYMENT_COLUMNS}
         FROM payments p
         JOIN template t ON t.templateId = p.templateId
         JOIN theme th ON th.themeId = p.themeId
        WHERE p.userId = ? ORDER BY p.createdAt DESC`,
      [getUserId(req)],
    );
    return res.json(rows.map(parsePages));
  } catch (error) {
    return sendError(res, error);
  }
};

const getPayment = async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid payment id" });
  try {
    const [rows] = await db.query(
      `SELECT ${PAYMENT_COLUMNS}
         FROM payments p
         JOIN template t ON t.templateId = p.templateId
         JOIN theme th ON th.themeId = p.themeId
        WHERE p.id = ?`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ message: "Payment not found" });
    if (String(rows[0].userId) !== String(getUserId(req)) && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    return res.json(parsePages(rows[0]));
  } catch (error) {
    return sendError(res, error);
  }
};

const getAllPayments = async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.status !== undefined) {
    if (!STATUSES.has(req.query.status)) return res.status(400).json({ message: "Invalid payment status" });
    where.push("p.status = ?");
    params.push(req.query.status);
  }
  if (req.query.templateId !== undefined) {
    if (!isId(req.query.templateId)) return res.status(400).json({ message: "Invalid templateId" });
    where.push("p.templateId = ?");
    params.push(req.query.templateId);
  }
  try {
    const [rows] = await db.query(
      `SELECT ${PAYMENT_COLUMNS}, u.name AS userName, u.email
         FROM payments p
         JOIN template t ON t.templateId = p.templateId
         JOIN theme th ON th.themeId = p.themeId
         JOIN users u ON u.userId = p.userId
         ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY p.createdAt DESC`,
      params,
    );
    return res.json(rows.map(parsePages));
  } catch (error) {
    return sendError(res, error);
  }
};

const getInvoices = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, invoiceNumber, paymentId, billingName, totalAmount, issuedAt
         FROM invoices WHERE userId = ? ORDER BY issuedAt DESC`,
      [getUserId(req)],
    );
    return res.json(rows);
  } catch (error) {
    return sendError(res, error);
  }
};

const getInvoice = async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid invoice id" });
  try {
    const [[invoice]] = await db.query(
      `SELECT i.*, p.transactionId, p.method, p.currency, p.paidAt,
              t.name AS templateName
         FROM invoices i
         JOIN payments p ON p.id = i.paymentId
         JOIN template t ON t.templateId = p.templateId
        WHERE i.id = ?`,
      [req.params.id],
    );
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (String(invoice.userId) !== String(getUserId(req)) && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const [lines] = await db.query(
      `SELECT pg.title, pp.isDefault, pp.price
         FROM paymentpages pp JOIN pages pg ON pg.pagesId = pp.pagesId
        WHERE pp.paymentId = ? ORDER BY pp.sortOrder, pg.title`,
      [invoice.paymentId],
    );
    return res.json({ ...invoice, pages: lines });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  quotePayment,
  createPayment,
  verifyPayment,
  razorpayWebhook,
  getMyPayments,
  getPayment,
  getAllPayments,
  getInvoices,
  getInvoice,
};