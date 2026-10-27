const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticate");
const { requirePlatformAdmin } = require("../middleware/siteAccess");
const { getStats } = require("../controller/statsController");

router.get("/", authenticateToken, requirePlatformAdmin, getStats);

module.exports = router;