const path = require("path");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const SECRET_KEY = process.env.SECRET_KEY;

const signToken = (u) =>
  jwt.sign({ userId: u.userId, name: u.name, role: u.role }, SECRET_KEY, {
    expiresIn: "1d",
  });

const publicUser = (u) => ({
  id: u.userId,
  userId: u.userId,
  name: u.name,
  email: u.email,
  role: u.role,
});

const getAuth = (req, res) => {
  if (!["admin", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  db.query(
    "SELECT userId,name,email,phone,address,role,status,createdAt,updatedAt FROM users ORDER BY createdAt DESC",
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(result);
    }
  );
};

const postAuth = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const password = req.body.password ?? req.body.passwordHash;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim() : "";
    const normalizedPhone =
      typeof phone === "string" && phone.trim() ? phone.trim() : null;
    const normalizedAddress =
      typeof address === "string" && address.trim() ? address.trim() : null;

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (normalizedName.length > 120) {
      return res.status(400).json({ message: "Name must be 120 characters or fewer" });
    }
    if (normalizedEmail.length > 190 || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email" });
    }
    if (normalizedPhone && normalizedPhone.length > 10) {
      return res.status(400).json({ message: "Phone must be 10 characters or fewer" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    db.query("SELECT userId FROM users WHERE email=?", [normalizedEmail], async (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }

      try {
        const hashed = await bcrypt.hash(password, 10);
        db.query(
          "INSERT INTO users(name,email,phone,passwordHash,address,role) VALUES(?,?,?,?,?,?)",
          [normalizedName, normalizedEmail, normalizedPhone, hashed, normalizedAddress, "client"],
          (insertErr, insertResult) => {
            if (insertErr?.code === "ER_DUP_ENTRY") {
              return res.status(400).json({ message: "Email already exists" });
            }
            if (insertErr) return res.status(500).json({ message: insertErr.message });
            const user = {
              userId: insertResult.insertId,
              name: normalizedName,
              email: normalizedEmail,
              role: "client",
            };
            res.status(201).json({
              message: "User Registered Successfully",
              token: signToken(user),
              user: publicUser(user),
            });
          }
        );
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    });
  } catch (error) {
    console.error(error);
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
    }
  );
};

const getMe = (req, res) => {
  db.query(
    "SELECT userId,name,email,phone,address,role,status,createdAt,updatedAt FROM users WHERE userId=?",
    [req.user.userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.length === 0) return res.status(404).json({ message: "User not found" });
      res.json(result[0]);
    }
  );
};

const updateUserStatus = (req, res) => {
  if (!["admin", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const userId = req.params.userId;
  const { status } = req.body;
  if (!/^[1-9]\d*$/.test(userId) || BigInt(userId) > 18446744073709551615n) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ message: "Status must be active or inactive" });
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
    }
  );
};

module.exports = { getAuth, postAuth, checkLogin, getMe, updateUserStatus };