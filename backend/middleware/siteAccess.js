const db = require("../config/db");

const requireSiteAccess = (req, res, next) => {
  const { siteId } = req.params;
  if (!/^[1-9]\d*$/.test(siteId)) {
    return res.status(400).json({ message: "Invalid site ID" });
  }

  db.query(
    `SELECT a.id AS adminId, a.email
       FROM admin a
       JOIN sites s ON s.id = a.siteId
       JOIN users u ON u.userId = a.userId
      WHERE a.siteId = ? AND a.userId = ? AND u.status = 'active'
        AND s.status = 'active' AND s.expiresAt > NOW()`,
    [siteId, req.user.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!rows.length) return res.status(403).json({ message: "Site access denied" });
      req.siteAdmin = rows[0];
      next();
    }
  );
};

const requirePlatformAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

module.exports = requireSiteAccess;
module.exports.requirePlatformAdmin = requirePlatformAdmin;
