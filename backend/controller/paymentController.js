const db = require("../config/db");
const { provisionSite } = require("../utils/provision");
const { buildQuote } = require("../utils/pricing");

const MAX_PAGES_PER_ORDER = 50;

const validId = (id) => {
  const value = String(id);
  return /^[1-9]\d*$/.test(value) && BigInt(value) <= 18446744073709551615n;
};

// Normalises pageIds: must be a non-empty array of valid ids, duplicates removed
const parsePageIds = (raw) => {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_PAGES_PER_ORDER) return null;
  if (!raw.every(validId)) return null;
  return [...new Set(raw.map(String))];
};

// Maps known service errors to HTTP responses
const sendServiceError = (res, error, fallbackMessage) => {
  const map = {
    "Template is no longer available": [404, error.message],
    "Theme not allowed for this template": [400, error.message],
    "One or more pages are invalid": [400, error.message],
    "Template already purchased": [409, "This template has already been purchased by your account."],
    "User is unavailable": [403, "Account is not active"],
  };
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "Subdomain is already in use" });
  }
  if (map[error.message]) {
    const [status, message] = map[error.message];
    return res.status(status).json({ message });
  }
  console.error(`${fallbackMessage}:`, error);
  return res.status(500).json({ message: fallbackMessage });
};

// POST /api/payments/quote  -> price preview for the UI (nothing is saved)
const getQuote = async (req, res) => {
  const { templateId, themeId } = req.body;
  const pageIds = parsePageIds(req.body.pageIds);

  if (!validId(templateId) || !validId(themeId) || !pageIds) {
    return res
      .status(400)
      .json({ message: "templateId, one themeId and at least one page are required" });
  }

  try {
    const q = await buildQuote(db.promise(), { templateId, themeId, pageIds });
    res.json({
      templateId: q.template.templateId,
      templateName: q.template.name,
      themeId,
      pages: q.pages,
      currency: q.currency,
      baseAmount: q.baseAmount,
      pagesAmount: q.pagesAmount,
      amount: q.amount,
    });
  } catch (error) {
    sendServiceError(res, error, "Could not calculate price");
  }
};

// POST /api/payments/checkout
const checkout = async (req, res) => {
  const { templateId, themeId, siteName } = req.body;
  const pageIds = parsePageIds(req.body.pageIds);
  const subdomain =
    typeof req.body.subdomain === "string" && req.body.subdomain.trim()
      ? req.body.subdomain.trim().toLowerCase()
      : null;

  if (!validId(templateId) || typeof siteName !== "string" || !siteName.trim()) {
    return res.status(400).json({ message: "A valid templateId and siteName are required" });
  }
  if (!validId(themeId)) {
    return res.status(400).json({ message: "Select exactly one theme" });
  }
  if (!pageIds) {
    return res.status(400).json({
      message: `Select between 1 and ${MAX_PAGES_PER_ORDER} valid pages`,
    });
  }
  if (siteName.trim().length > 150) {
    return res.status(400).json({ message: "Site name must be 150 characters or fewer" });
  }
  if (subdomain && !/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(subdomain)) {
    return res.status(400).json({ message: "Invalid subdomain" });
  }

  try {
    const result = await provisionSite({
      userId: req.user.userId,
      templateId,
      themeId,
      pageIds,
      siteName: siteName.trim(),
      subdomain,
    });
    res.status(201).json({ message: "Purchase successful", ...result });
  } catch (error) {
    sendServiceError(res, error, "Checkout failed");
  }
};

// ---------- listing ----------
const PAYMENT_SELECT = `
  SELECT p.id AS paymentId, p.transactionId, p.userId, p.templateId,
         p.themeId, p.baseAmount, p.pagesAmount, p.amount,
         p.currency, p.method, p.status, p.paidAt, p.createdAt,
         t.name AS templateName,
         th.name AS themeName,
         i.invoiceNumber, i.billingName,
         (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                   'pagesId', pp.pagesId,
                   'title', pg.title,
                   'price', pp.price))
            FROM payment_pages pp
            LEFT JOIN pages pg ON pg.pagesId = pp.pagesId
           WHERE pp.paymentId = p.id) AS pages
    FROM payments p
    LEFT JOIN template t  ON t.templateId = p.templateId
    LEFT JOIN theme th    ON th.themeId = p.themeId
    LEFT JOIN invoices i  ON i.paymentId = p.id`;

const getMyPayments = (req, res) => {
  db.query(
    `${PAYMENT_SELECT} WHERE p.userId = ? ORDER BY p.createdAt DESC`,
    [req.user.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

const getAllPayments = (req, res) => {
  db.query(
    `SELECT x.*, u.name AS userName, u.email AS userEmail
       FROM (${PAYMENT_SELECT}) x
       LEFT JOIN users u ON u.userId = x.userId
      ORDER BY x.createdAt DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

module.exports = { getQuote, checkout, getMyPayments, getAllPayments };