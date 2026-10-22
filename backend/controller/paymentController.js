const crypto = require("crypto");
const db = require("../config/db");
const { provisionSite } = require("../utils/provision");

const checkout = (req, res) => {
  const { templateId, siteName, subdomain } = req.body;
  if (!templateId || !siteName || !subdomain) {
    return res.status(400).json({ message: "templateId, siteName, subdomain required" });
  }
  if (!/^[a-z0-9-]{3,63}$/.test(subdomain)) {
    return res.status(400).json({
      message: "Invalid subdomain (lowercase a-z0-9- only, 3-63 chars)",
    });
  }

  db.query(
    "SELECT templateId, price, currency, status FROM template WHERE templateId = ?",
    [templateId],
    (err, tplRows) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!tplRows.length || tplRows[0].status !== "published") {
        return res.status(400).json({ message: "Template not available" });
      }
      const tpl = tplRows[0];

      db.query(
        "SELECT id FROM sites WHERE subdomain = ?",
        [subdomain],
        (err2, taken) => {
          if (err2) return res.status(500).json({ message: err2.message });
          if (taken.length) return res.status(400).json({ message: "Subdomain already taken" });

          const transactionId = "MOCK-" + crypto.randomBytes(8).toString("hex");

          // 1. Payment
          db.query(
            `INSERT INTO payments
               (transactionId, userId, templateId, amount, currency, method, status, paidAt)
             VALUES (?,?,?,?,?, 'mock', 'captured', NOW())`,
            [transactionId, req.user.userId, templateId, tpl.price, tpl.currency],
            (err3, payRes) => {
              if (err3) return res.status(500).json({ message: err3.message });
              const paymentId = payRes.insertId;

              // 2. Invoice
              db.query(
                "SELECT name FROM users WHERE userId = ?",
                [req.user.userId],
                (err4, userRows) => {
                  if (err4) return res.status(500).json({ message: err4.message });
                  const billingName = userRows[0].name;
                  const invoiceNumber = "INV-" + Date.now();

                  db.query(
                    `INSERT INTO invoices
                       (invoiceNumber, paymentId, userId, billingName, totalAmount)
                     VALUES (?,?,?,?,?)`,
                    [invoiceNumber, paymentId, req.user.userId, billingName, tpl.price],
                    (err5, invRes) => {
                      if (err5) return res.status(500).json({ message: err5.message });
                      const invoiceId = invRes.insertId;

                      // 3. Provision site
                      provisionSite(
                        {
                          userId: req.user.userId,
                          templateId,
                          paymentId,
                          invoiceId,
                          siteName,
                          subdomain,
                        },
                        (err6, result) => {
                          if (err6) {
                            console.error("Provision failed:", err6);
                            return res.status(500).json({
                              message: "Site provisioning failed",
                              detail: err6.message,
                            });
                          }
                          res.status(201).json({
                            message: "Purchase successful",
                            siteId: result.siteId,
                            paymentId,
                            invoiceId,
                            transactionId,
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
};


const PAYMENT_SELECT = `
  SELECT p.*,
         t.name           AS templateName,
         i.invoiceNumber  AS invoiceNumber,
         i.billingName    AS billingName
    FROM payments p
    LEFT JOIN template t ON t.templateId = p.templateId
    LEFT JOIN invoices i ON i.paymentId  = p.paymentId
`;

// GET /payments/my  — payments of the logged-in user
const getMyPayments = (req, res) => {
  db.query(
    `${PAYMENT_SELECT}
      WHERE p.userId = ?
      ORDER BY p.paidAt DESC`,
    [req.user.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

// GET /payments  — all payments (admin panel)
const getAllPayments = (req, res) => {
  db.query(
    `SELECT p.*,
            t.name          AS templateName,
            i.invoiceNumber AS invoiceNumber,
            u.name          AS userName,
            u.email         AS userEmail
       FROM payments p
       LEFT JOIN template t ON t.templateId = p.templateId
       LEFT JOIN invoices i ON i.paymentId  = p.paymentId
       LEFT JOIN users    u ON u.userId     = p.userId
      ORDER BY p.paidAt DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

module.exports = { checkout, getMyPayments, getAllPayments };
