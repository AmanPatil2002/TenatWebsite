const db = require("../config/db");

const pool = db.promise();

const getStats = async (req, res) => {
  try {
    const [[counts]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM template) AS templates,
        (SELECT COUNT(*) FROM theme)    AS themes,
        (SELECT COUNT(*) FROM pages)    AS pages,
        (SELECT COUNT(*) FROM sites)    AS sites,
        (SELECT COUNT(*) FROM payments WHERE status = 'captured') AS purchases,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'captured') AS revenue
    `);

    const [monthlyRows] = await pool.query(`
      SELECT DATE_FORMAT(paidAt, '%Y-%m') AS month,
             COUNT(*)                     AS purchases,
             COALESCE(SUM(amount), 0)     AS revenue
        FROM payments
       WHERE status = 'captured'
         AND paidAt >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 5 MONTH)
       GROUP BY month
       ORDER BY month
    `);

    // Always return the last 6 months, including months with no sales.
    const monthly = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const row = monthlyRows.find((r) => r.month === key);
      monthly.push({
        month: key,
        label: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }),
        purchases: row ? Number(row.purchases) : 0,
        revenue: row ? Number(row.revenue) : 0,
      });
    }

    const [purchasesByTemplate] = await pool.query(`
      SELECT t.templateId, t.name, COUNT(*) AS purchases
        FROM payments p
        JOIN template t ON t.templateId = p.templateId
       WHERE p.status = 'captured'
       GROUP BY t.templateId, t.name
       ORDER BY purchases DESC
    `);

    const [revenueByTemplate] = await pool.query(`
      SELECT t.templateId, t.name, COALESCE(SUM(p.amount), 0) AS revenue
        FROM payments p
        JOIN template t ON t.templateId = p.templateId
       WHERE p.status = 'captured'
       GROUP BY t.templateId, t.name
       ORDER BY revenue DESC
       LIMIT 5
    `);

    const [paymentsByStatus] = await pool.query(`
      SELECT status, COUNT(*) AS count FROM payments GROUP BY status
    `);

    const [recentPayments] = await pool.query(`
      SELECT p.id, p.transactionId, t.name AS templateName,
             p.amount, p.currency, p.status, p.createdAt
        FROM payments p
        LEFT JOIN template t ON t.templateId = p.templateId
       ORDER BY p.createdAt DESC
       LIMIT 6
    `);

    return res.status(200).json({
      ...counts,
      revenue: Number(counts.revenue),
      monthly,
      purchasesByTemplate,
      revenueByTemplate,
      paymentsByStatus,
      recentPayments,
    });
  } catch (error) {
    console.error("Stats failed:", error);
    return res.status(500).json({ message: "Failed to load stats" });
  }
};

module.exports = { getStats };