const db = require("../config/db");
const { provisionSite } = require("../utils/provision");

const validId = (id) => {
  const value = String(id);
  return /^[1-9]\d*$/.test(value) && BigInt(value) <= 18446744073709551615n;
};

const checkout = async (req, res) => {
  const { templateId, siteName } = req.body;
  const subdomain =
    typeof req.body.subdomain === "string" && req.body.subdomain.trim()
      ? req.body.subdomain.trim().toLowerCase()
      : null;

  if (!validId(templateId) || typeof siteName !== "string" || !siteName.trim()) {
    return res.status(400).json({ message: "A valid templateId and siteName are required" });
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
      siteName: siteName.trim(),
      subdomain,
    });
    res.status(201).json({ message: "Purchase successful", ...result });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Subdomain is already in use" });
    }
    if (error.message === "Template is no longer available") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "Template already purchased") {
      return res.status(409).json({ message: "This template has already been purchased by your account." });
    }
    if (error.message === "User is unavailable") {
      return res.status(403).json({ message: "Account is not active" });
    }
    console.error("Checkout failed:", error);
    res.status(500).json({ message: "Checkout failed" });
  }
};

const PAYMENT_SELECT = `
  SELECT p.id AS paymentId, p.transactionId, p.userId, p.templateId, p.amount,
         p.currency, p.method, p.status, p.paidAt, p.createdAt,
         t.name AS templateName, i.invoiceNumber, i.billingName
    FROM payments p
    LEFT JOIN template t ON t.templateId = p.templateId
    LEFT JOIN invoices i ON i.paymentId = p.id`;

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
    `SELECT p.id AS paymentId, p.transactionId, p.userId, p.templateId, p.amount,
            p.currency, p.method, p.status, p.paidAt, p.createdAt,
            t.name AS templateName, i.invoiceNumber, u.name AS userName,
            u.email AS userEmail
       FROM payments p
       LEFT JOIN template t ON t.templateId = p.templateId
       LEFT JOIN invoices i ON i.paymentId = p.id
       LEFT JOIN users u ON u.userId = p.userId
      ORDER BY p.createdAt DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

module.exports = { checkout, getMyPayments, getAllPayments };
