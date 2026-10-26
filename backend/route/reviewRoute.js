const express = require("express");
const router = express.Router();

const {
  getReviews,
  getMyReviews,
  addReview,
  updateReview,
  deleteReview,
} = require("../controller/reviewController");
const authenticateToken = require("../middleware/authenticate");

router.get("/", getReviews);
router.get("/myreview", authenticateToken, getMyReviews);
router.post("/", authenticateToken, addReview);
router.put("/:reviewId", authenticateToken, updateReview);
router.delete("/:reviewId", authenticateToken, deleteReview);

module.exports = router;