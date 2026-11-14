const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db").promise();
const { HttpError, sendError } = require("../utils/tx");
const { sendSiteAdminCredentials } = require("../utils/mailer");

const SECRET_KEY = process.env.SECRET_KEY;
const ID_PATTERN = /^[1-9]\d{0,19}$/;

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Reusable profile-field validator (mirrors authControler.buildProfileUpdate).
// Returns { error } or { fields, values }. Only fields present in body are used.
const buildSiteAdminProfileUpdate = (body) => {
  const fields = [];
  const values = [];

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return { error: "Name cannot be empty" };
    if (name.length > 120)
      return { error: "Name must be 120 characters or fewer" };
    fields.push("name=?");
    values.push(name);
  }

  if (body.email !== undefined) {
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email.length > 190 || !EMAIL_RE.test(email)) {
      return { error: "Enter a valid email" };
    }
    fields.push("email=?");
    values.push(email);
  }

  if (body.phone !== undefined) {
    const phone =
      typeof body.phone === "string" && body.phone.trim()
        ? body.phone.trim()
        : null;
    if (phone && phone.length > 20)
      return { error: "Phone must be 20 characters or fewer" };
    fields.push("phone=?");
    values.push(phone);
  }

  return { fields, values };
};

// Site admin views their own profile (joined from users via the admin row).
const getSiteAdminProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.userId, u.name, u.email, u.phone, u.address, u.role, u.status
         FROM \`admin\` a
         JOIN users u ON u.userId = a.userId
        WHERE a.id = ?`,
      [req.siteAdmin.siteAdminId],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Site admin not found" });
    res.json(rows[0]);
  } catch (error) {
    return sendError(res, error);
  }
};

// Site admin updates their own profile (name, email, phone).
const updateSiteAdminProfile = async (req, res) => {
  const { error, fields, values } = buildSiteAdminProfileUpdate(req.body);
  if (error) return res.status(400).json({ message: error });
  if (fields.length === 0)
    return res.status(400).json({ message: "Nothing to update" });

  try {
    const [result] = await db
      .promise()
      .execute(
        `UPDATE users SET ${fields.join(",")} WHERE userId=?`,
        [...values, req.siteAdmin.userId],
      );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: "Profile updated" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Email already exists" });
    }
    return sendError(res, error);
  }
};

// Site admin changes their own password.
const changeSiteAdminPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current and new password are required" });
  }
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    const [rows] = await db
      .promise()
      .execute(
        `SELECT a.passwordHash
           FROM \`admin\` a
          WHERE a.id = ?`,
        [req.siteAdmin.siteAdminId],
      );
    if (rows.length === 0)
      return res.status(404).json({ message: "Site admin not found" });

    const same = await bcrypt.compare(
      String(currentPassword),
      rows[0].passwordHash,
    );
    if (!same) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db
      .promise()
      .execute("UPDATE \`admin\` SET passwordHash=? WHERE id=?", [
        hashed,
        req.siteAdmin.siteAdminId,
      ]);
    res.json({ message: "Password changed" });
  } catch (error) {
    return sendError(res, error);
  }
};

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

module.exports = {
  listSitesForAdmin,
  createSiteAdmin,
  loginSiteAdmin,
  getSiteAdminProfile,
  updateSiteAdminProfile,
  changeSiteAdminPassword
};
