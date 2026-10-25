
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticate");
const { requirePlatformAdmin } = require("../middleware/siteAccess");
const { checkout, getMyPayments, getAllPayments } = require("../controller/paymentController");

router.post("/checkout", authenticateToken, checkout);
router.get("/my", authenticateToken, getMyPayments);               
router.get("/", authenticateToken, requirePlatformAdmin, getAllPayments);

module.exports = router;