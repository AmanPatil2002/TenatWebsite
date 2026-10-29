const crypto = require("crypto");
const db = require("../config/db").promise();
const { withTx, HttpError, sendError } = require("../utils/tx");
const { buildQuote, fromMinor } = require("../utils/pricing");
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

// sortOrder comes from templatepages (paymentpages has no sortOrder column)
const PAYMENT_COLUMNS = `
  p.id, p.transactionId, p.userId, p.templateId, t.name AS templateName,
  p.themeId, th.name AS themeName, p.amount, p.currency, p.method,
  p.status, p.paidAt, p.createdAt,
  (SELECT i.invoiceNumber FROM invoices i WHERE i.paymentId = p.id LIMIT 1) AS invoiceNumber,
  (SELECT JSON_ARRAYAGG(JSON_OBJECT(
     'pagesId', pp.pagesId, 'title', pg.title, 'isDefault', pp.isDefault,
     'price', pp.price, 'sortOrder', tp.sortOrder
   ))
   FROM paymentpages pp
   JOIN pages pg ON pg.pagesId = pp.pagesId
   JOIN templatepages tp ON tp.templateId = pp.templateId AND tp.pagesId = pp.pagesId
   WHERE pp.paymentId = p.id) AS pages
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
      const { template, pages, totalMinor } = await buildQuote(connection, input);
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

// POST /payments  -> saves payment + paymentpages, then invoice + site
const createPayment = async (req, res) => {
  const userId = getUserId(req);
  const input = readOrderInput(req);
  if (input.error) return res.status(400).json({ message: input.error });

  const method =
    typeof req.body?.method === "string" && req.body.method.trim()
      ? req.body.method.trim().slice(0, 30)
      : "manual";

  try {
    const result = await withTx(async (connection) => {
      const { template, pages, totalMinor } = await buildQuote(connection, input);

      const [[user]] = await connection.query(
        "SELECT userId, name FROM users WHERE userId = ? AND status = 'active'",
        [userId],
      );
      if (!user) throw new HttpError(403, "User account is not active");

      const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
      const amount = fromMinor(totalMinor);

      const [paymentRow] = await connection.query(
        `INSERT INTO payments
           (transactionId, userId, templateId, themeId, amount, currency,
            method, status, paidAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'captured', CURRENT_TIMESTAMP)`,
        [transactionId, userId, input.templateId, input.themeId, amount, template.currency, method],
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
        totalAmount: amount,
        currency: template.currency,
        status: "captured",
        ...provisioned,
      };
    });

    return res.status(201).json({ message: "Payment saved", ...result });
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
         FROM paymentpages pp
         JOIN pages pg ON pg.pagesId = pp.pagesId
         JOIN templatepages tp ON tp.templateId = pp.templateId AND tp.pagesId = pp.pagesId
        WHERE pp.paymentId = ? ORDER BY tp.sortOrder, pg.title`,
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
  getMyPayments,
  getPayment,
  getAllPayments,
  getInvoices,
  getInvoice,
};