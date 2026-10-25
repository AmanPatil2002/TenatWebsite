const express = require("express");
const authenticateToken = require("../middleware/authenticate");
const { requirePlatformAdmin } = require("../middleware/siteAccess");
const {
  requestRefund,
  listAllRefunds,
  updateRefundStatus,
} = require("../controller/refundController");

const router = express.Router();

router.get("/", authenticateToken, requirePlatformAdmin, listAllRefunds);
router.patch("/:refundId", authenticateToken, requirePlatformAdmin, updateRefundStatus);
router.post("/site/:siteId", authenticateToken, requestRefund);

module.exports = router;
