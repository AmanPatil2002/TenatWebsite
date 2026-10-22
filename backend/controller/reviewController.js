const db = require("../config/db");

// Admin only: get all reviews
const getReview = (req, res) => {
  if (!["admin", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  db.query(
    `SELECT review.reviewId, review.reviewBy, users.name, users.email,
            review.templateId, review.siteId, review.description,
            review.rating, review.createdAt
     FROM review
     INNER JOIN users ON users.userId = review.reviewBy
     ORDER BY review.createdAt DESC`,
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(result);
    }
  );
};

// Logged-in user: post a review
const postReview = (req, res) => {
  try {
    const reviewBy = req.user.userId;
    const { description, rating, templateId, siteId } = req.body;

    if (typeof description !== "string" || rating === undefined || rating === null) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (description.trim().length < 20) {
      return res
        .status(400)
        .json({ message: "Description must be at least 20 characters" });
    }
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }
    const hasTemplate = templateId !== undefined && templateId !== null && templateId !== "";
    const hasSite = siteId !== undefined && siteId !== null && siteId !== "";
    if (hasTemplate === hasSite) {
      return res.status(400).json({ message: "Select exactly one template or site to review" });
    }
    const targetId = hasTemplate ? templateId : siteId;
    const targetIdIsSafeNumber =
      typeof targetId !== "number" || Number.isSafeInteger(targetId);
    if (
      (typeof targetId !== "string" && typeof targetId !== "number") ||
      !targetIdIsSafeNumber ||
      !/^[1-9]\d*$/.test(String(targetId))
      || BigInt(String(targetId)) > 18446744073709551615n
    ) {
      return res.status(400).json({ message: "Target ID must be a positive integer" });
    }

    db.query(
      `INSERT INTO review (reviewBy, templateId, siteId, description, rating)
       VALUES (?, ?, ?, ?, ?)`,
      [
        reviewBy,
        hasTemplate ? String(templateId) : null,
        hasSite ? String(siteId) : null,
        description.trim(),
        numRating,
      ],
      (err, result) => {
        if (err?.code === "ER_NO_REFERENCED_ROW_2") {
          return res.status(400).json({ message: "The selected template or site does not exist" });
        }
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({
          message: "Review submitted successfully",
          reviewId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logged-in user: view own reviews
const myReview = (req, res) => {
  db.query(
    `SELECT reviewId, reviewBy, templateId, siteId, description, rating, createdAt
     FROM review WHERE reviewBy = ? ORDER BY createdAt DESC`,
    [req.user.userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(result); 
    }
  );
};

module.exports = { getReview, postReview, myReview };