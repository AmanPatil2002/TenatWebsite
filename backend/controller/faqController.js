const db = require("../config/db");

const isAdmin = (req) => req.user?.role === "admin";

// Public read (the FAQ page is shown to visitors)
const getFaq = (req, res) => {
  db.query("SELECT faqId, question, answer FROM faq ORDER BY faqId ASC", (err, result) => {
    if (err) {
      console.error("getFaq:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
    res.json(result);
  });
};

const validate = (question, answer) => {
  if (typeof question !== "string" || typeof answer !== "string") {
    return "Question and answer are required";
  }
  return null;
};

const postFaq = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

  const { question, answer } = req.body;
  const error = validate(question, answer);
  if (error) return res.status(400).json({ message: error });

  db.query(
    "INSERT INTO faq (question, answer) VALUES (?, ?)",
    [question.trim(), answer.trim()],
    (err, result) => {
      if (err) {
        console.error("postFaq:", err);
        if (err.code === "ER_DUP_ENTRY")
          return res.status(409).json({ message: "Question already exists" });
        return res.status(500).json({ message: "Internal server error" });
      }
      res.status(201).json({ message: "FAQ created successfully", faqId: result.insertId });
    }
  );
};

const updateFaq = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

  const { question, answer } = req.body;
  const { faqId } = req.params;
  const error = validate(question, answer);
  if (error) return res.status(400).json({ message: error });

  db.query(
    "UPDATE faq SET question = ?, answer = ? WHERE faqId = ?",
    [question.trim(), answer.trim(), faqId],
    (err, result) => {
      if (err) {
        console.error("updateFaq:", err);
        if (err.code === "ER_DUP_ENTRY")
          return res.status(409).json({ message: "Question already exists" });
        return res.status(500).json({ message: "Internal server error" });
      }
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "FAQ not found" });
      res.json({ message: "FAQ updated successfully", faqId });
    }
  );
};

const deleteFaq = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

  const { faqId } = req.params;
  db.query("DELETE FROM faq WHERE faqId = ?", [faqId], (err, result) => {
    if (err) {
      console.error("deleteFaq:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "FAQ not found" });
    res.json({ message: "FAQ deleted successfully" });
  });
};

module.exports = { getFaq, postFaq, updateFaq, deleteFaq };