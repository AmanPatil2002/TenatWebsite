const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const crypto = require("crypto");

const { sendPasswordResetEmail } = require("../utils/mailer");

const SECRET_KEY = process.env.SECRET_KEY;

const EMAIL_RE = /^\S+@\S+\.\S+$/;

const signToken = (u) =>
  jwt.sign(
    { userId: u.userId, name: u.name, role: u.role },
    SECRET_KEY,
    { expiresIn: "7d" }
  );

const publicUser = (u) => ({
  id: u.userId,
  userId: u.userId,
  name: u.name,
  email: u.email,
  role: u.role,
});

const isAdmin = (req) => ["admin"].includes(req.user.role);

const validId = (id) =>
  /^[1-9]\d*$/.test(id) && BigInt(id) <= 18446744073709551615n;

// Validates the profile fields that were sent and turns them into SET parts.
// Returns { error } or { fields, values }. Only fields present in body are used.
const buildProfileUpdate = (body) => {
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

  if (body.address !== undefined) {
    const address =
      typeof body.address === "string" && body.address.trim()
        ? body.address.trim()
        : null;
    fields.push("address=?");
    values.push(address);
  }

  return { fields, values };
};

const getAuth = (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  db.query(
    "SELECT userId,name,email,phone,address,role,status,createdAt,updatedAt FROM users ORDER BY createdAt DESC",
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(result);
    },
  );
};

const postAuth = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const password = req.body.password ?? req.body.passwordHash;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPhone =
      typeof phone === "string" && phone.trim() ? phone.trim() : null;
    const normalizedAddress =
      typeof address === "string" && address.trim() ? address.trim() : null;

    if (!normalizedName || !normalizedEmail || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }
    if (normalizedName.length > 120) {
      return res
        .status(400)
        .json({ message: "Name must be 120 characters or fewer" });
    }
    if (normalizedEmail.length > 190 || !EMAIL_RE.test(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email" });
    }
    if (normalizedPhone && normalizedPhone.length > 20) {
      return res
        .status(400)
        .json({ message: "Phone must be 20 characters or fewer" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const hashed = await bcrypt.hash(password, 10);

    let userId;
    try {
      const [insertResult] = await db
        .promise()
        .execute(
          "INSERT INTO users(name,email,phone,passwordHash,address,role) VALUES(?,?,?,?,?,?)",
          [
            normalizedName,
            normalizedEmail,
            normalizedPhone,
            hashed,
            normalizedAddress,
            "client",
          ],
        );
      userId = insertResult.insertId;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Email already exists" });
      }
      throw error;
    }

    const user = {
      userId,
      name: normalizedName,
      email: normalizedEmail,
      role: "client",
    };
    res.status(201).json({
      message: "User Registered Successfully",
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

const checkLogin = (req, res) => {
  const { email } = req.body;
  const password = req.body.password ?? req.body.passwordHash;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  db.query(
    "SELECT userId,name,email,phone,passwordHash,address,role,status,createdAt,updatedAt FROM users WHERE email=?",
    [email],
    async (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const user = result[0];
      if (user.status !== "active") {
        return res.status(403).json({ message: "Account is not active" });
      }
      let ok;
      try {
        ok = await bcrypt.compare(password, user.passwordHash);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
      }
      if (!ok) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.json({
        message: "Login Successful",
        token: signToken(user),
        user: publicUser(user),
      });
    },
  );
};

const getMe = (req, res) => {
  db.query(
    "SELECT userId,name,email,phone,address,role,status,createdAt,updatedAt FROM users WHERE userId=?",
    [req.user.userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.length === 0)
        return res.status(404).json({ message: "User not found" });
      res.json(result[0]);
    },
  );
};

// Admin: one user by ID
const getUser = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

  const userId = req.params.userId;
  if (!validId(userId))
    return res.status(400).json({ message: "Invalid user ID" });

  db.query(
    "SELECT userId,name,email,phone,address,role,status,createdAt,updatedAt FROM users WHERE userId=?",
    [userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.length === 0)
        return res.status(404).json({ message: "User not found" });
      res.json(result[0]);
    },
  );
};

// Logged-in user edits their own profile (name, email, phone, address)
const updateMe = (req, res) => {
  const { error, fields, values } = buildProfileUpdate(req.body);
  if (error) return res.status(400).json({ message: error });
  if (fields.length === 0)
    return res.status(400).json({ message: "Nothing to update" });

  db.query(
    `UPDATE users SET ${fields.join(",")} WHERE userId=?`,
    [...values, req.user.userId],
    (err, result) => {
      if (err?.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (err) return res.status(500).json({ message: err.message });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "User not found" });
      res.json({ message: "Profile updated" });
    },
  );
};

// Logged-in user changes their own password
const changePassword = (req, res) => {
  const { currentPassword, newPassword } = req.body;
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

  db.query(
    "SELECT passwordHash FROM users WHERE userId=?",
    [req.user.userId],
    async (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.length === 0)
        return res.status(404).json({ message: "User not found" });

      try {
        const same = await bcrypt.compare(
          String(currentPassword),
          result[0].passwordHash,
        );
        if (!same) {
          return res
            .status(401)
            .json({ message: "Current password is incorrect" });
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        db.query(
          "UPDATE users SET passwordHash=? WHERE userId=?",
          [hashed, req.user.userId],
          (updateErr) => {
            if (updateErr)
              return res.status(500).json({ message: updateErr.message });
            res.json({ message: "Password changed" });
          },
        );
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    },
  );
};

// Step 1 of forgot password: email a 6-digit code.
// Same response whether or not the email exists.
const forgotPassword = async (req, res) => {
  const email =
    typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email || email.length > 190 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "Enter a valid email" });
  }

  const generic = {
    message: "If that email is registered, a verification code has been sent.",
  };

  try {
    const [rows] = await db
      .promise()
      .execute("SELECT userId,name,status FROM users WHERE email=?", [email]);
    if (rows.length === 0 || rows[0].status !== "active") {
      return res.json(generic);
    }
    const user = rows[0];

    // 60-second cooldown between codes
    const [recent] = await db
      .promise()
      .execute(
        "SELECT id FROM passwordResets WHERE userId=? AND createdAt > (NOW() - INTERVAL 60 SECOND)",
        [user.userId],
      );
    if (recent.length > 0) return res.json(generic);

    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    const codeHash = await bcrypt.hash(code, 10);

    await db
      .promise()
      .execute("DELETE FROM passwordResets WHERE userId=?", [user.userId]);
    await db
      .promise()
      .execute(
        "INSERT INTO passwordResets(userId,codeHash,expiresAt) VALUES(?,?,DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
        [user.userId, codeHash],
      );

    try {
      await sendPasswordResetEmail({
        to: email,
        name: user.name,
        code,
        expiresInMinutes: 10,
      });
    } catch (mailErr) {
      // Logged only, so the response can't reveal whether the email exists
      console.error("Reset email failed:", mailErr.message);
    }

    res.json(generic);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPasswordStatus = async (req, res) => {
  const email =
    typeof req.query.email === "string"
      ? req.query.email.trim().toLowerCase()
      : "";
  if (!email || email.length > 190 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "Invalid or expired reset link" });
  }

  try {
    const [rows] = await db.promise().execute(
      `SELECT u.userId
         FROM users u
        WHERE u.email=? AND u.status='active'
          AND EXISTS (
            SELECT 1
              FROM passwordResets r
             WHERE r.userId=u.userId AND r.usedAt IS NULL AND r.expiresAt > NOW()
          )
        LIMIT 1`,
      [email],
    );
    if (rows.length === 0) {
      return res
        .status(410)
        .json({ message: "This reset link has expired. Request a new one from the login page." });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not verify the reset link" });
  }
};

// Step 2 of forgot password: verify the code and set the new password
const resetPassword = async (req, res) => {
  const email =
    typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const code = String(req.body.code ?? "").trim();
  const newPassword = req.body.newPassword;

  if (!email || !EMAIL_RE.test(email) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    const [rows] = await db.promise().execute(
      `SELECT u.userId, u.status, r.id AS resetId, r.codeHash, r.attempts
         FROM users u
         JOIN passwordResets r ON r.userId = u.userId
        WHERE u.email=? AND r.usedAt IS NULL AND r.expiresAt > NOW()
        ORDER BY r.id DESC LIMIT 1`,
      [email],
    );
    if (rows.length === 0 || rows[0].status !== "active") {
      return res.status(400).json({ message: "Invalid or expired code" });
    }
    const r = rows[0];

    if (r.attempts >= 5) {
      return res
        .status(400)
        .json({ message: "Too many attempts. Please request a new code." });
    }

    const ok = await bcrypt.compare(code, r.codeHash);
    if (!ok) {
      await db
        .promise()
        .execute("UPDATE passwordResets SET attempts=attempts+1 WHERE id=?", [
          r.resetId,
        ]);
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    // Claim the code so it can only be used once
    const [claim] = await db
      .promise()
      .execute(
        "UPDATE passwordResets SET usedAt=NOW() WHERE id=? AND usedAt IS NULL",
        [r.resetId],
      );
    if (claim.affectedRows === 0) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db
      .promise()
      .execute("UPDATE users SET passwordHash=? WHERE userId=?", [
        hashed,
        r.userId,
      ]);
    await db
      .promise()
      .execute("DELETE FROM passwordResets WHERE userId=?", [r.userId]);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin edits any user: profile fields plus role (admin/client) and status
const updateUser = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

  const userId = req.params.userId;
  if (!validId(userId))
    return res.status(400).json({ message: "Invalid user ID" });

  const { error, fields, values } = buildProfileUpdate(req.body);
  if (error) return res.status(400).json({ message: error });

  const { role, status } = req.body;
  if (role !== undefined || status !== undefined) {
    if (String(userId) === String(req.user.userId)) {
      return res
        .status(400)
        .json({ message: "You cannot change your own role or status" });
    }
  }
  if (role !== undefined) {
    if (!["admin", "client"].includes(role)) {
      return res.status(400).json({ message: "Role must be admin or client" });
    }
    fields.push("role=?");
    values.push(role);
  }
  if (status !== undefined) {
    if (!["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be active or inactive" });
    }
    fields.push("status=?");
    values.push(status);
  }
  if (fields.length === 0)
    return res.status(400).json({ message: "Nothing to update" });

  db.query(
    `UPDATE users SET ${fields.join(",")} WHERE userId=?`,
    [...values, userId],
    (err, result) => {
      if (err?.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (err) return res.status(500).json({ message: err.message });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "User not found" });
      res.json({ message: "User updated", userId });
    },
  );
};

const updateUserStatus = (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const userId = req.params.userId;
  const { status } = req.body;
  if (!validId(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  if (!["active", "inactive"].includes(status)) {
    return res
      .status(400)
      .json({ message: "Status must be active or inactive" });
  }

  db.query(
    "UPDATE users SET status=? WHERE userId=?",
    [status, userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User status updated", userId, status });
    },
  );
};

module.exports = {
  getAuth,
  postAuth,
  checkLogin,
  getMe,
  getUser,
  updateMe,
  changePassword,
  forgotPassword,
  resetPasswordStatus,
  resetPassword,
  updateUser,
  updateUserStatus,
};