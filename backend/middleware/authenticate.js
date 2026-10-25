const jwt = require("jsonwebtoken");
const db = require("../config/db");

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) throw new Error("SECRET_KEY is not set");

function authenticateToken(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");

  if (scheme !== "Bearer" || !token || token === "null" || token === "undefined") {
    return res.status(401).json({ message: "Please log in again" });
  }

  jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] }, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid or expired token" });

    db.query(
      "SELECT userId,name,role,status FROM users WHERE userId=?",
      [decoded.userId],
      (e, rows) => {
        if (e) return res.status(500).json({ message: "Server error" });
        if (!rows.length || rows[0].status !== "active") {
          return res.status(401).json({ message: "Account unavailable" });
        }
        req.user = rows[0];
        next();
      }
    );
  });
}

module.exports = authenticateToken;