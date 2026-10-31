const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db").promise();
const { HttpError, sendError } = require("../utils/tx");
const { sendSiteAdminCredentials } = require("../utils/mailer");

const SECRET_KEY = process.env.SECRET_KEY;
const ID_PATTERN = /^[1-9]\d{0,19}$/;

const isId = (value) =>
  ID_PATTERN.test(String(value ?? "")) &&
  BigInt(value) <= 18446744073709551615n;

const listSitesForAdmin = async (req, res) => {
  try {
    const [sites] = await db.query(
      `SELECT s.id AS siteId, s.userId, s.name AS siteName,
              CASE
                WHEN s.expiresAt <= CURRENT_TIMESTAMP THEN 'expired'
                ELSE s.status
              END AS currentStatus,
              s.expiresAt, u.name AS ownerName,
              u.email AS ownerEmail, t.name AS templateName,
              a.email AS siteAdminEmail
         FROM sites s
         JOIN users u ON u.userId = s.userId
         JOIN template t ON t.templateId = s.templateId
         JOIN payments p ON p.id = s.paymentId AND p.status = 'captured'
         LEFT JOIN \`admin\` a ON a.siteId = s.id
        ORDER BY s.createdAt DESC`,
    );
    return res.json(sites);
  } catch (error) {
    return sendError(res, error);
  }
};

const createSiteAdmin = async (req, res) => {
  const { siteId } = req.params;
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });
  if (email.length > 190 || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  const temporaryPassword = crypto.randomBytes(18).toString("hex");
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [[site]] = await connection.query(
      `SELECT s.id, s.userId, s.name AS siteName, s.expiresAt,
              t.name AS templateName, u.name AS ownerName
         FROM sites s
         JOIN payments p ON p.id = s.paymentId AND p.status = 'captured'
         JOIN template t ON t.templateId = s.templateId
         JOIN users u ON u.userId = s.userId
        WHERE s.id = ? AND s.status = 'active'
          AND s.expiresAt > CURRENT_TIMESTAMP
        FOR UPDATE`,
      [siteId],
    );
    if (!site) throw new HttpError(404, "Active purchased site not found");

    await connection.query(
      `INSERT INTO \`admin\` (siteId, userId, email, passwordHash)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         userId = VALUES(userId),
         email = VALUES(email),
         passwordHash = VALUES(passwordHash)`,
      [site.id, site.userId, email, passwordHash],
    );

    try {
      await sendSiteAdminCredentials({
        to: email,
        siteId: site.id,
        siteName: site.siteName,
        templateName: site.templateName,
        ownerName: site.ownerName,
        password: temporaryPassword,
      });
    } catch (mailError) {
      console.error("Site-admin credentials email failed:", mailError);
      throw new HttpError(502, "Credentials could not be emailed; no login was created.");
    }

    await connection.commit();
    return res.json({ message: `Site-admin login sent to ${email}.` });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error("Site-admin transaction rollback failed:", rollbackError);
    }
    return sendError(res, error);
  } finally {
    connection.release();
  }
};

const loginSiteAdmin = async (req, res) => {
  const { siteId, email, password } = req.body ?? {};
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (
    !isId(siteId) ||
    !normalizedEmail ||
    typeof password !== "string" ||
    !password
  ) {
    return res.status(400).json({
      message: "Site id, email and password are required.",
    });
  }

  try {
    const [[siteAdmin]] = await db.query(
      `SELECT a.id, a.siteId, a.userId, a.email, a.passwordHash,
              s.name AS siteName
         FROM \`admin\` a
         JOIN sites s ON s.id = a.siteId
         JOIN payments p ON p.id = s.paymentId
        WHERE a.siteId = ? AND a.email = ?
          AND s.status = 'active'
          AND s.expiresAt > CURRENT_TIMESTAMP
          AND p.status = 'captured'`,
      [siteId, normalizedEmail],
    );
    if (!siteAdmin || !(await bcrypt.compare(password, siteAdmin.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      {
        role: "siteAdmin",
        siteAdminId: siteAdmin.id,
        siteId: siteAdmin.siteId,
      },
      SECRET_KEY,
      { expiresIn: "8h" },
    );
    return res.json({
      token,
      siteId: siteAdmin.siteId,
      siteName: siteAdmin.siteName,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { listSitesForAdmin, createSiteAdmin, loginSiteAdmin };
