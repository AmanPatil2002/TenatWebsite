const db = require("../config/db");

// GET /site — list sites the current user has access to
const listMySites = (req, res) => {
  db.query(
    `SELECT s.id, s.siteName, s.subdomain, s.status, s.isPublished,
            s.validFrom, s.validUntil, s.templateId, t.name AS templateName,
            a.role AS adminRole
       FROM sites s
       JOIN template t ON t.templateId = s.templateId
       JOIN admin a ON a.siteId = s.id AND a.userId = ?
      ORDER BY s.createdAt DESC`,
    [req.user.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

// GET /site/:siteId — detail (route already verified access via middleware)
const getSite = (req, res) => {
  db.query(
    "SELECT * FROM sites WHERE id = ?",
    [req.params.siteId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!rows.length) return res.status(404).json({ message: "Not found" });
      res.json(rows[0]);
    }
  );
};

// PATCH /site/:siteId/publish
const publishSite = (req, res) => {
  const { isPublished } = req.body;
  db.query(
    "UPDATE sites SET isPublished = ? WHERE id = ?",
    [isPublished ? 1 : 0, req.params.siteId],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ ok: true, isPublished: !!isPublished });
    }
  );
};

module.exports = { listMySites, getSite, publishSite };