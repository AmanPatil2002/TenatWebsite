
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not set. Check your backend .env configuration.");
}

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({
      message: "Missing or invalid Authorization header. Please log in again.",
    });
  }

  const token = match[1];

  if (token === "null" || token === "undefined") {
    return res.status(401).json({
      message: "No valid login token found. Please log in again.",
    });
  }

  jwt.verify(
    token,
    SECRET_KEY,
    { algorithms: ["HS256"] },
    (err, decoded) => {
      if (err) {
        console.warn("JWT verification failed:", err.name);
        return res.status(401).json({
          message:
            err.name === "TokenExpiredError"
              ? "Your session has expired. Please log in again."
              : "Invalid login token. Please log in again.",
        });
      }

      if (!decoded || !decoded.userId) {
        return res.status(401).json({
          message: "Invalid token payload. Please log in again.",
        });
      }

      db.query(
        "SELECT userId, name, role, status FROM users WHERE userId = ?",
        [decoded.userId],
        (error, rows) => {
          if (error) {
            console.error("Authentication database error:", error);
            return res.status(500).json({
              message: "Server error",
            });
          }

          if (!rows.length || rows[0].status !== "active") {
            return res.status(401).json({
              message: "Account unavailable. Please contact an administrator.",
            });
          }

          req.user = rows[0];
          next();
        }
      );
    }
  );
}

module.exports = authenticateToken;
