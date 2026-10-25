const db = require("../config/db");

const isAdmin = (req) => req.user?.role === "admin";

const validId = (id) => /^[1-9]\d*$/.test(id) && BigInt(id) <= 18446744073709551615n;

// Public: all reviews with the reviewer's name, newest first
const getReviews = (req, res) => {
  db.query(
    `SELECT r.reviewId, r.reviewBy, u.name AS reviewerName, r.description, r.rating, r.createdAt
     FROM review r
     JOIN users u ON u.userId = r.reviewBy
     ORDER BY r.createdAt DESC`,
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(result);
    }
  );
};

// Logged-in user adds a review
const addReview = (req, res) => {
  const description =
    typeof req.body.description === "string" ? req.body.description.trim() : "";
  const rating = Number(req.body.rating);

  if (!description) {
    return res.status(400).json({ message: "Description is required" });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be a whole number from 1 to 5" });
  }

  db.query(
    "INSERT INTO review(reviewBy,description,rating) VALUES(?,?,?)",
    [req.user.userId, description, rating],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({
        message: "Review added",
        reviewId: result.insertId,
      });
    }
  );
};

// Owner (or admin) edits a review
const updateReview = (req, res) => {
  const reviewId = req.params.reviewId;
  if (!validId(reviewId)) {
    return res.status(400).json({ message: "Invalid review ID" });
  }

  const fields = [];
  const values = [];

  if (req.body.description !== undefined) {
    const description =
      typeof req.body.description === "string" ? req.body.description.trim() : "";
    if (!description) {
      return res.status(400).json({ message: "Description cannot be empty" });
    }
    fields.push("description=?");
    values.push(description);
  }

  if (req.body.rating !== undefined) {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a whole number from 1 to 5" });
    }
    fields.push("rating=?");
    values.push(rating);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  // non-admins can only touch their own review
  let sql = `UPDATE review SET ${fields.join(",")} WHERE reviewId=?`;
  values.push(reviewId);
  if (!isAdmin(req)) {
    sql += " AND reviewBy=?";
    values.push(req.user.userId);
  }

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json({ message: "Review updated", reviewId });
  });
};

// Owner (or admin) deletes a review
const deleteReview = (req, res) => {
  const reviewId = req.params.reviewId;
  if (!validId(reviewId)) {
    return res.status(400).json({ message: "Invalid review ID" });
  }

  let sql = "DELETE FROM review WHERE reviewId=?";
  const values = [reviewId];
  if (!isAdmin(req)) {
    sql += " AND reviewBy=?";
    values.push(req.user.userId);
  }

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json({ message: "Review deleted", reviewId });
  });
};

module.exports = { getReviews, addReview, updateReview, deleteReview };