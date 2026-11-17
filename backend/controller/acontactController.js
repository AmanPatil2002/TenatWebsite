const db = require("../config/db");

const isAdmin = (req) => req.user?.role === "admin";
const validId = (id) =>
  typeof id === "string" &&
  /^[1-9]\d*$/.test(id) &&
  BigInt(id) <= 18446744073709551615n;

// Reusable validation helper — returns an error message or null
const validateContactPayload = (body) => {
  const contact = typeof body.contact === "string" ? body.contact.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";

  if (!/^\d{10}$/.test(contact)) {
    return { error: "Contact must be 10 digits" };
  }
  // Email: length + shape check. Stricter than \S+@\S+\.\S+
  if (email.length > 190 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { error: "Enter a valid email" };
  }
  if (!address || address.length > 100) {
    return { error: "Address is required and must be 100 characters or fewer" };
  }
  return { value: { contact, email, address } };
};

const getAcontact = (req, res) => {
  db.query(
    `SELECT contactId, contact, email, address, createdBy, createdAt, updatedAt
       FROM acontact ORDER BY createdAt DESC`,
    (err, rows) => {
      if (err) {
        console.error("getAcontact error:", err.message);
        return res.status(500).json({ message: "Internal server error" });
      }
      res.json(rows);
    },
  );
};

const postAcontact = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
  if (!req.user?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { error, value } = validateContactPayload(req.body || {});
  if (error) return res.status(400).json({ message: error });

  db.query(
    "INSERT INTO acontact (contact, email, address, createdBy) VALUES (?, ?, ?, ?)",
    [value.contact, value.email, value.address, req.user.userId],
    (err, result) => {
      if (err) {
        console.error("postAcontact error:", err.message);
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
  if (!req.user?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { acontactId } = req.params;
  if (!validId(acontactId)) {
    return res.status(400).json({ message: "Invalid contact ID" });
  }

  const { error, value } = validateContactPayload(req.body || {});
  if (error) return res.status(400).json({ message: error });

  db.query(
    "UPDATE acontact SET contact = ?, email = ?, address = ? WHERE contactId = ?",
    [value.contact, value.email, value.address, acontactId],
    (err, result) => {
      if (err) {
        console.error("updateAcontact error:", err.message);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!result.affectedRows) {
        return res.status(404).json({ message: "Contact not found" });
      }
      // 200 OK — the resource was updated, not created.
      // Return the actual ID we updated, not insertId (which is 0 on UPDATE).
      res.status(200).json({
        message: "Contact updated",
        contactId: acontactId,
      });
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
        console.error("deleteAcontact error:", err.message);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!result.affectedRows) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json({ message: "Contact deleted" });
    },
  );
};

module.exports = { getAcontact, postAcontact, updateAcontact, deleteAcontact };
