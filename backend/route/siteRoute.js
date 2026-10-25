const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticate");
const requireSiteAccess = require("../middleware/siteAccess");
const { listMySites, getSite } = require("../controller/siteController");
const { listSiteRefunds } = require("../controller/refundController");

router.get("/", authenticateToken, listMySites);
router.get("/:siteId", authenticateToken, requireSiteAccess, getSite);
router.get("/:siteId/refunds", authenticateToken, requireSiteAccess, listSiteRefunds);

module.exports = router;