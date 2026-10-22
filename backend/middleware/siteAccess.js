const db = require("../config/db");

function requireSiteAccess(req, res, next) {
  const siteId = req.params.siteId || req.body.siteId;
  if (!siteId || !/^[1-9]\d*$/.test(String(siteId))) {
    return res.status(400).json({ message: "siteId required" });
  }

  db.query(
    `SELECT a.id AS adminId, a.role AS adminRole, s.id AS siteId, s.status
       FROM admin a
       JOIN sites s ON s.id = a.siteId
       JOIN users u ON u.userId = a.userId
      WHERE a.siteId = ? AND a.userId = ?
        AND s.status = 'active' AND u.status = 'active'`,
    [siteId, req.user.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!rows.length) return res.status(403).json({ message: "No access to this site" });
      req.siteAdmin = rows[0]; // { adminId, adminRole, siteId, status }
      next();
    }
  );
}

module.exports = requireSiteAccess;