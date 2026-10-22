const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticate");
const requireSiteAccess = require("../middleware/siteAccess");
const { listPages, createPage, updatePage, deletePage } = require("../controller/pageController");

router.get("/:siteId/pages", authenticateToken, requireSiteAccess, listPages);
router.post("/:siteId/pages", authenticateToken, requireSiteAccess, createPage);
router.put("/:siteId/pages/:pageId", authenticateToken, requireSiteAccess, updatePage);
router.delete("/:siteId/pages/:pageId", authenticateToken, requireSiteAccess, deletePage);

module.exports = router;