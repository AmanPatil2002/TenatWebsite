const express = require("express");
const router = express.Router();

const {
  getReviews,
  addReview,
  updateReview,
  deleteReview,
} = require("../controller/reviewController");
const authenticateToken = require("../middleware/authenticate");

router.get("/", getReviews);
router.post("/", authenticateToken, addReview);
router.put("/:reviewId", authenticateToken, updateReview);
router.delete("/:reviewId", authenticateToken, deleteReview);

module.exports = router;