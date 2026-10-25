const db = require("../config/db");

const listMySites = (req, res) => {
  db.query(
    `SELECT DISTINCT s.id, s.name, s.subdomain, s.customDomain,
            CASE WHEN s.status = 'active' AND s.expiresAt <= NOW()
                 THEN 'expired' ELSE s.status END AS status,
            s.startsAt,
            s.expiresAt, s.templateId, t.name AS templateName,
            t.thumbnailUrl, s.createdAt
       FROM sites s
       JOIN template t ON t.templateId = s.templateId
       JOIN admin a ON a.siteId = s.id
      WHERE a.userId = ?
      ORDER BY s.createdAt DESC`,
    [req.user.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

const getSite = (req, res) => {
  db.query(
    `SELECT s.id, s.userId, s.templateId, s.paymentId, s.name, s.subdomain,
            s.customDomain, s.status, s.startsAt, s.expiresAt, s.createdAt,
            s.updatedAt, t.name AS templateName, t.thumbnailUrl
       FROM sites s
       JOIN template t ON t.templateId = s.templateId
      WHERE s.id = ?`,
    [req.params.siteId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!rows.length) return res.status(404).json({ message: "Site not found" });
      res.json(rows[0]);
    }
  );
};

module.exports = { listMySites, getSite };
