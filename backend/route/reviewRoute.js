const express = require("express");
const review = express.Router();

const { getReview, postReview, myReview } = require("../controller/reviewController");
const authenticateToken = require("../middleware/authenticate");

review.get("/getreview", authenticateToken, getReview);     
review.post("/postreview", authenticateToken, postReview);    
review.get("/myreview", authenticateToken, myReview);     

module.exports = review;