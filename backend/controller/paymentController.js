const crypto = require("crypto");
const db = require("../config/db");

const pool = db.promise();

const PAYMENT_STATUSES = ["created", "authorized", "captured", "failed", "refunded"];

const toId = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const round2 = (n) => Math.round(n * 100) / 100;

const getUserId = (req) => req.user?.id ?? req.user?.userId ?? null;

const isAdmin = (req) =>
  ["admin", "platform_admin", "superadmin"].includes(req.user?.role);
// ^ adjust to however requirePlatformAdmin identifies an admin

const parsePages = (row) => {
  if (row && typeof row.pages === "string") {
    try {
      row.pages = JSON.parse(row.pages);
    } catch {
      row.pages = null;
    }
  }
  return row;
};

const PAYMENT_COLUMNS = `
  p.id, p.transactionId, p.userId, p.templateId, t.name AS templateName,
  p.themeId, p.pages, p.baseAmount, p.pagesAmount, p.amount,
  p.currency, p.method, p.status, p.paidAt, p.createdAt
`;

// POST /payments
// body: { templateId, themeId, additionalPageIds: [] }
const createPayment = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const templateId = toId(req.body?.templateId);
  const themeId = toId(req.body?.themeId);

  if (!templateId) {
    return res.status(400).json({ message: "A valid templateId is required" });
  }
  if (!themeId) {
    return res.status(400).json({ message: "Select exactly one theme" });
  }

  const rawIds = req.body?.additionalPageIds ?? [];
  if (!Array.isArray(rawIds)) {
    return res
      .status(400)
      .json({ message: "additionalPageIds must be an array" });
  }

  const pageIds = [...new Set(rawIds.map(toId))];
  if (pageIds.includes(null)) {
    return res
      .status(400)
      .json({ message: "additionalPageIds must contain valid ids" });
  }

  try {
    // Template must exist and be published
    const [templates] = await pool.query(
      `SELECT templateId, price, currency
         FROM templates
        WHERE templateId = ? AND status = 'published'
        LIMIT 1`,
      [templateId]
    );
    if (!templates.length) {
      return res.status(404).json({ message: "Template not found" });
    }
    const template = templates[0];

    // Theme must belong to this template
    const [themes] = await pool.query(
      "SELECT themeId FROM theme WHERE themeId = ? AND templateId = ? LIMIT 1",
      [themeId, templateId]
    );
    if (!themes.length) {
      return res
        .status(400)
        .json({ message: "Theme does not belong to this template" });
    }

    // Default pages (included in the base price)
    const [defaultPages] = await pool.query(
      `SELECT pageId, name, 0 AS price
         FROM pages
        WHERE templateId = ? AND isDefault = 1`,
      [templateId]
    );

    // Additional pages chosen by the client (priced from the DB, never the client)
    let additionalPages = [];
    if (pageIds.length) {
      const [rows] = await pool.query(
        `SELECT pageId, name, price
           FROM pages
          WHERE templateId = ? AND isDefault = 0 AND pageId IN (?)`,
        [templateId, pageIds]
      );
      if (rows.length !== pageIds.length) {
        return res
          .status(400)
          .json({ message: "One or more selected pages are invalid" });
      }
      additionalPages = rows.map((r) => ({
        pageId: r.pageId,
        name: r.name,
        price: Number(r.price),
      }));
    }

    const baseAmount = round2(Number(template.price));
    const pagesAmount = round2(
      additionalPages.reduce((sum, p) => sum + p.price, 0)
    );
    const amount = round2(baseAmount + pagesAmount);

    const transactionId = `TXN-${crypto.randomUUID().replace(/-/g, "")}`;

    const pagesSnapshot = JSON.stringify({
      default: defaultPages.map((p) => ({
        pageId: p.pageId,
        name: p.name,
        price: 0,
      })),
      additional: additionalPages,
    });

    const [result] = await pool.query(
      `INSERT INTO payments
         (transactionId, userId, templateId, themeId, pages,
          baseAmount, pagesAmount, amount, currency, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'created')`,
      [
        transactionId,
        userId,
        templateId,
        themeId,
        pagesSnapshot,
        baseAmount,
        pagesAmount,
        amount,
        template.currency,
      ]
    );

    return res.status(201).json({
      message: "Payment created",
      id: result.insertId,
      transactionId,
      baseAmount,
      pagesAmount,
      amount,
      currency: template.currency,
    });
  } catch (error) {
    console.error("Create payment error:", error);
    return res.status(500).json({ message: "Failed to create payment" });
  }
};

// POST /payments/:transactionId/confirm
// body: { status: "captured" | "failed" | "authorized", method }
// TODO: in production, call this from your gateway webhook / verify the
// gateway signature instead of trusting the client.
const confirmPayment = async (req, res) => {
  const userId = getUserId(req);
  const { transactionId } = req.params;
  const status = req.body?.status;
  const method =
    typeof req.body?.method === "string" ? req.body.method.trim().slice(0, 30) : null;

  if (!["authorized", "captured", "failed"].includes(status)) {
    return res
      .status(400)
      .json({ message: "Status must be authorized, captured or failed" });
  }

  try {
    const [result] = await pool.query(
      `UPDATE payments
          SET status = ?,
              method = COALESCE(?, method),
              paidAt = CASE WHEN ? = 'captured' THEN CURRENT_TIMESTAMP ELSE paidAt END
        WHERE transactionId = ?
          AND userId = ?
          AND status IN ('created', 'authorized')`,
      [status, method, status, transactionId, userId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Payment not found or already finalized",
      });
    }

    return res.status(200).json({
      message: "Payment updated",
      transactionId,
      status,
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return res.status(500).json({ message: "Failed to update payment" });
  }
};

// GET /payments/my
const getMyPayments = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const [rows] = await pool.query(
      `SELECT ${PAYMENT_COLUMNS}
         FROM payments p
         LEFT JOIN templates t ON t.templateId = p.templateId
        WHERE p.userId = ?
        ORDER BY p.createdAt DESC`,
      [userId]
    );
    return res.status(200).json(rows.map(parsePages));
  } catch (error) {
    console.error("Get my payments error:", error);
    return res.status(500).json({ message: "Failed to fetch payments" });
  }
};

// GET /payments/:id   (owner or admin)
const getPayment = async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid payment id" });

  try {
    const [rows] = await pool.query(
      `SELECT ${PAYMENT_COLUMNS}
         FROM payments p
         LEFT JOIN templates t ON t.templateId = p.templateId
        WHERE p.id = ?
        LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const payment = rows[0];
    if (String(payment.userId) !== String(getUserId(req)) && !isAdmin(req)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json(parsePages(payment));
  } catch (error) {
    console.error("Get payment error:", error);
    return res.status(500).json({ message: "Failed to fetch payment" });
  }
};

// GET /payments/admin/all?status=captured&templateId=1
const getAllPayments = async (req, res) => {
  const where = [];
  const params = [];

  if (req.query.status) {
    if (!PAYMENT_STATUSES.includes(req.query.status)) {
      return res.status(400).json({ message: "Invalid status filter" });
    }
    where.push("p.status = ?");
    params.push(req.query.status);
  }

  if (req.query.templateId) {
    const templateId = toId(req.query.templateId);
    if (!templateId) {
      return res.status(400).json({ message: "Invalid templateId filter" });
    }
    where.push("p.templateId = ?");
    params.push(templateId);
  }

  try {
    const [rows] = await pool.query(
      `SELECT ${PAYMENT_COLUMNS}
         FROM payments p
         LEFT JOIN templates t ON t.templateId = p.templateId
         ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY p.createdAt DESC`,
      params
    );
    return res.status(200).json(rows.map(parsePages));
  } catch (error) {
    console.error("Get all payments error:", error);
    return res.status(500).json({ message: "Failed to fetch payments" });
  }
};

// PATCH /payments/admin/:id/refund
const refundPayment = async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid payment id" });

  try {
    const [result] = await pool.query(
      "UPDATE payments SET status = 'refunded' WHERE id = ? AND status = 'captured'",
      [id]
    );

    if (!result.affectedRows) {
      return res
        .status(404)
        .json({ message: "Payment not found or not refundable" });
    }

    return res.status(200).json({ message: "Payment marked as refunded" });
  } catch (error) {
    console.error("Refund payment error:", error);
    return res.status(500).json({ message: "Failed to refund payment" });
  }
};

module.exports = {
  createPayment,
  confirmPayment,
  getMyPayments,
  getPayment,
  getAllPayments,
  refundPayment,
};