const jwt = require("jsonwebtoken");
const db = require("../config/db").promise();

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not set. Check your backend .env configuration.");
}

const authenticateSiteAdmin = async (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    return res.status(401).json({ message: "Please log in to manage this site." });
  }

  try {
    const decoded = jwt.verify(match[1], SECRET_KEY, { algorithms: ["HS256"] });
    if (
      decoded.role !== "siteAdmin" ||
      !decoded.siteAdminId ||
      !decoded.siteId
    ) {
      return res.status(401).json({ message: "Invalid site-admin login." });
    }

    const [[siteAdmin]] = await db.query(
      `SELECT a.id, a.siteId, a.userId, a.email
         FROM \`admin\` a
         JOIN sites s ON s.id = a.siteId
         JOIN payments p ON p.id = s.paymentId
        WHERE a.id = ? AND a.siteId = ?
          AND s.status = 'active'
          AND s.expiresAt > CURRENT_TIMESTAMP
          AND p.status = 'captured'`,
      [decoded.siteAdminId, decoded.siteId],
    );

    if (!siteAdmin) {
      return res.status(403).json({ message: "Site access is unavailable or expired." });
    }

    req.siteAdmin = siteAdmin;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Your site-admin login is invalid or expired." });
    }
    console.error("Site-admin authentication failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = authenticateSiteAdmin;
