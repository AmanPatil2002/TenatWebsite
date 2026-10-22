const db = require("../config/db");

const getAcontact = (req, res) => {
  db.query(`SELECT * FROM adminContact`, (err, result) => {
    if (err) {
      console.error("get contact:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
    res.json(result);
  });
};

const postAcontact = (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const contact = String(req.body.contact ?? "").trim();
  const email = String(req.body.email ?? "").trim();
  const address = String(req.body.address ?? "").trim();

  if (!contact || !email || !address) {
    return res
      .status(400)
      .json({ message: "Contact, email and address are required" });
  }
  if (!/^\d{10}$/.test(contact)) {
    return res.status(400).json({ message: "Contact must be 10 digits" });
  }
  if (email.length > 190 || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid email" });
  }
  if (address.length > 100) {
    return res
      .status(400)
      .json({ message: "Address must be 100 characters or fewer" });
  }

  db.query(
    `INSERT INTO adminContact (contact, email, address) VALUES (?, ?, ?)`,
    [contact, email, address],
    (err, result) => {
      if (err) {
        console.error("post contact:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      res.status(201).json({
        message: "Contact submitted successfully",
        contactId: result.insertId,
      });
    },
  );
};

const deleteAcontact = (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  const { acontactId } = req.params;

  db.query(
    "DELETE FROM adminContact WHERE contactId = ?",
    [acontactId],
    (err, result) => {
      if (err) {
        console.error("delete contact:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json({ message: "Contact deleted successfully" });
    },
  );
};

module.exports = { getAcontact, postAcontact, deleteAcontact };