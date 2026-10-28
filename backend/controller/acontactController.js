const db = require("../config/db");

const isAdmin = (req) => req.user?.role === "admin";
const validId = (id) =>
  typeof id === "string" &&
  /^[1-9]\d*$/.test(id) &&
  BigInt(id) <= 18446744073709551615n;

const getAcontact = (req, res) => {
  db.query(
    `SELECT contactId, contact, email, address, createdBy, createdAt, updatedAt
       FROM acontact ORDER BY createdAt DESC`,
    (err, rows) => {
      if (err) {
        console.error("getAcontact error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      res.json(rows);
    },
  );
};

const postAcontact = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

  const contact =
    typeof req.body.contact === "string" ? req.body.contact.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
  const address =
    typeof req.body.address === "string" ? req.body.address.trim() : "";

  if (!/^\d{10}$/.test(contact)) {
    return res.status(400).json({ message: "Contact must be 10 digits" });
  }
  if (email.length > 190 || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid email" });
  }
  if (!address || address.length > 100) {
    return res
      .status(400)
      .json({
        message: "Address is required and must be 100 characters or fewer",
      });
  }

  db.query(
    "INSERT INTO acontact (contact, email, address, createdBy) VALUES (?, ?, ?, ?)",
    [contact, email, address, req.user.userId],
    (err, result) => {
      if (err) {
        console.error("postAcontact error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      res
        .status(201)
        .json({ message: "Contact saved", contactId: result.insertId });
    },
  );
};

const updateAcontact = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
  const { acontactId } = req.params;

  const contact =
    typeof req.body.contact === "string" ? req.body.contact.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
  const address =
    typeof req.body.address === "string" ? req.body.address.trim() : "";
  if (!validId(acontactId)) {
    return res.status(400).json({ message: "Invalid contact ID" });
  }
  if (!/^\d{10}$/.test(contact)) {
    return res.status(400).json({ message: "Contact must be 10 digits" });
  }
  if (email.length > 190 || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid email" });
  }
  if (!address || address.length > 100) {
    return res
      .status(400)
      .json({
        message: "Address is required and must be 100 characters or fewer",
      });
  }

  db.query(
    "UPDATE acontact SET contact = ?, email = ?, address = ?, createdBy = ? WHERE contactId = ?",
    [contact, email, address, req.user.userId, acontactId],
    (err, result) => {
      if (err) {
        console.error("updateAcontact error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      res
        .status(201)
        .json({ message: "Contact Updated", acontactId: result.insertId });
    },
  );
};

const deleteAcontact = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
  const { acontactId } = req.params;
  if (!validId(acontactId)) {
    return res.status(400).json({ message: "Invalid contact ID" });
  }

  db.query(
    "DELETE FROM acontact WHERE contactId = ?",
    [acontactId],
    (err, result) => {
      if (err) {
        console.error("deleteAcontact error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!result.affectedRows)
        return res.status(404).json({ message: "Contact not found" });
      res.json({ message: "Contact deleted" });
    },
  );
};

module.exports = { getAcontact, postAcontact, updateAcontact, deleteAcontact };
