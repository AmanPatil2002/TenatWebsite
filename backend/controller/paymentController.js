const crypto = require("crypto");
const db = require("../config/db").promise();
const { withTx, HttpError, sendError } = require("../utils/tx");
const { buildQuote, buildPagesSnapshot, fromMinor } = require("../utils/pricing");
const { provisionSite } = require("../utils/provision");
const { sendPaymentEmail } = require("../utils/mailer");

const ID_PATTERN = /^[1-9]\d{0,19}$/;
// must match the payments.status ENUM
const STATUSES = new Set(["created", "authorized", "captured", "failed", "refunded"]);

const isId = (value) => {
  if (typeof value === "number" && !Number.isSafeInteger(value)) return false;
  if (!ID_PATTERN.test(String(value ?? ""))) return false;
  return BigInt(value) <= 18446744073709551615n;
};

const isAdmin = (req) => ["admin", "superadmin"].includes(req.user?.role);

// mysql2 already parses JSON columns into objects; handle the string case too.
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

// pages comes straight from the payments.pages JSON snapshot (no joins needed)
const PAYMENT_COLUMNS = `
  p.id, p.transactionId, p.userId, p.templateId, t.name AS templateName,
  p.themeId, th.name AS themeName,
  p.templatePriceSnapshot, p.baseAmount, p.pagesAmount, p.amount,
  p.currency, p.method, p.status, p.pages, p.paidAt, p.createdAt,
  (SELECT i.invoiceNumber FROM invoices i WHERE i.paymentId = p.id LIMIT 1) AS invoiceNumber
`;

const getUserId = (req) => req.user?.userId;

const readOrderInput = (req) => {
  const { templateId, themeId } = req.body ?? {};
  const rawPageIds = req.body?.additionalPageIds ?? [];
  if (!isId(templateId)) return { error: "A valid templateId is required" };
  if (!isId(themeId)) return { error: "Select exactly one theme" };
  if (!Array.isArray(rawPageIds) || rawPageIds.some((id) => !isId(id))) {
    return { error: "additionalPageIds must be an array of valid ids" };
  }
  return { templateId, themeId, additionalPageIds: [...new Set(rawPageIds.map(String))] };
};

// POST /payments/quote
const quotePayment = async (req, res) => {
  const input = readOrderInput(req);
  if (input.error) return res.status(400).json({ message: input.error });

  try {
    const result = await withTx(async (connection) => {
      const { template, pages, baseMinor, pagesMinor, totalMinor } = await buildQuote(
        connection,
        input,
      );
      return {
        templateId: template.templateId,
        templateName: template.name,
        templatePrice: fromMinor(baseMinor),
        baseAmount: fromMinor(baseMinor),
        pagesAmount: fromMinor(pagesMinor),
        currency: template.currency,
        pages: pages.map((p) => ({
          pagesId: p.pagesId,
          title: p.title,
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

// POST /payments -> saves payment (with pages snapshot) + paymentpages, then invoice + site,
// then emails the client a payment confirmation (after commit)
const createPayment = async (req, res) => {
  const userId = getUserId(req);
  const input = readOrderInput(req);
  if (input.error) return res.status(400).json({ message: input.error });

  const method =
    typeof req.body?.method === "string" && req.body.method.trim()
      ? req.body.method.trim().slice(0, 30) // payments.method is VARCHAR(30)
      : "manual";

  try {
    const result = await withTx(async (connection) => {
      const { template, pages, baseMinor, pagesMinor, totalMinor } = await buildQuote(
        connection,
        input,
      );

      const [[user]] = await connection.query(
        "SELECT userId, name, email FROM users WHERE userId = ? AND status = 'active'",
        [userId],
      );
      if (!user) throw new HttpError(403, "User account is not active");

      // TXN-<13 digit ms>-<16 hex> = 34 chars, fits VARCHAR(64)
      const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
      const baseAmount = fromMinor(baseMinor);
      const pagesAmount = fromMinor(pagesMinor);
      const amount = fromMinor(totalMinor);
      const pagesSnapshot = JSON.stringify(buildPagesSnapshot(pages));

      const [paymentRow] = await connection.query(
        `INSERT INTO payments
           (transactionId, userId, templateId, themeId,
            templatePriceSnapshot, pages, baseAmount, pagesAmount, amount,
            currency, method, status, paidAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'captured', CURRENT_TIMESTAMP)`,
        [
          transactionId,
          userId,
          input.templateId,
          input.themeId,
          baseAmount, // templatePriceSnapshot: template price at purchase time
          pagesSnapshot,
          baseAmount,
          pagesAmount,
          amount,
          template.currency,
          method,
        ],
      );
      const paymentId = paymentRow.insertId;

      for (const page of pages) {
        await connection.query(
          `INSERT INTO paymentpages (paymentId, pagesId, templateId, isDefault, price)
           VALUES (?, ?, ?, ?, ?)`,
          [paymentId, page.pagesId, input.templateId, page.isDefault ? 1 : 0, fromMinor(page.minor)],
        );
      }

      const provisioned = await provisionSite(connection, {
        id: paymentId,
        userId,
        templateId: input.templateId,
        themeId: input.themeId,
        amount,
        userName: user.name,
        templateName: template.name,
        validityDays: template.validityDays,
      });

      return {
        id: paymentId,
        transactionId,
        templatePriceSnapshot: baseAmount,
        baseAmount,
        pagesAmount,
        totalAmount: amount,
        currency: template.currency,
        status: "captured",
        ...provisioned,
        // internal only: used for the email, stripped before responding
        _mail: {
          to: user.email,
          name: user.name,
          templateName: template.name,
          invoiceNumber: provisioned.invoiceNumber,
          baseAmount,
          method,
          paidAt: new Date().toISOString(),
          pages: pages.map((p) => ({ title: p.title, price: fromMinor(p.minor) })),
        },
      };
    });

    const { _mail, ...payload } = result;

    // fire-and-forget: an email failure must not fail an already committed payment
    if (_mail?.to) {
      sendPaymentEmail({
        ..._mail,
        transactionId: payload.transactionId,
        amount: payload.totalAmount,
        currency: payload.currency,
      }).catch((err) => console.error("Payment email failed:", err));
    }

    return res.status(201).json({ message: "Payment saved", ...payload });
  } catch (error) {
    return sendError(res, error);
  }
};

const getMyPayments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ${PAYMENT_COLUMNS}
         FROM payments p
         JOIN template t ON t.templateId = p.templateId
         LEFT JOIN theme th ON th.themeId = p.themeId
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
         LEFT JOIN theme th ON th.themeId = p.themeId
        WHERE p.id = ?`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ message: "Payment not found" });
    if (String(rows[0].userId) !== String(getUserId(req)) && !isAdmin(req)) {
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
         LEFT JOIN theme th ON th.themeId = p.themeId
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
      `SELECT i.*, p.transactionId, p.method, p.currency, p.paidAt, p.pages,
              p.templatePriceSnapshot, p.baseAmount, p.pagesAmount,
              t.name AS templateName
         FROM invoices i
         JOIN payments p ON p.id = i.paymentId
         JOIN template t ON t.templateId = p.templateId
        WHERE i.id = ?`,
      [req.params.id],
    );
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (String(invoice.userId) !== String(getUserId(req)) && !isAdmin(req)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    // invoice lines come from the payment's pages snapshot
    return res.json(parsePages(invoice));
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  quotePayment,
  createPayment,
  getMyPayments,
  getPayment,
  getAllPayments,
  getInvoices,
  getInvoice,
};