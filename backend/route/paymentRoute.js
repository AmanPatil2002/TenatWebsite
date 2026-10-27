const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authenticate");
const { requirePlatformAdmin } = require("../middleware/siteAccess");

const {
  createPayment,
  confirmPayment,
  getMyPayments,
  getPayment,
  getAllPayments,
  refundPayment,
} = require("../controller/paymentController");

// Admin routes first so they are not swallowed by /:id.
router.get("/admin/all", authenticateToken, requirePlatformAdmin, getAllPayments);
router.patch(
  "/admin/:id/refund",
  authenticateToken,
  requirePlatformAdmin,
  refundPayment,
);

// Client routes.
router.get("/my", authenticateToken, getMyPayments);
router.post("/", authenticateToken, createPayment);
router.post("/:transactionId/confirm", authenticateToken, confirmPayment);
router.get("/:id", authenticateToken, getPayment);

module.exports = router;