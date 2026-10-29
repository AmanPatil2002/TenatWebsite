const express = require("express");
const authenticateToken = require("../middleware/authenticate");
const { requirePlatformAdmin } = require("../middleware/siteAccess");
const {
  quotePayment,
  createPayment,
  getMyPayments,
  getPayment,
  getAllPayments,
  getInvoices,
  getInvoice,
} = require("../controller/paymentController");

const router = express.Router();

router.post("/quote", authenticateToken, quotePayment);
router.get("/my", authenticateToken, getMyPayments);
router.get("/invoices/my", authenticateToken, getInvoices);
router.get("/invoices/:id", authenticateToken, getInvoice);
router.get("/admin/all", authenticateToken, requirePlatformAdmin, getAllPayments);
router.post("/", authenticateToken, createPayment);
router.get("/:id", authenticateToken, getPayment);

module.exports = router;