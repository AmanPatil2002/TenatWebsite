const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticate");
const requireSiteAccess = require("../middleware/siteAccess");
const { requirePlatformAdmin } = require("../middleware/siteAccess");
const {
  listPages,
  createPage,
  createSubPage,
  updatePage,
  updateSubPage,
  deletePage,
  deleteSubPage,
} = require("../controller/pageController");

router.get("/:siteId/pages", authenticateToken, requireSiteAccess, listPages);
router.post("/:siteId/pages", authenticateToken, requireSiteAccess, requirePlatformAdmin, createPage);
router.put("/:siteId/pages/:pageId", authenticateToken, requireSiteAccess, requirePlatformAdmin, updatePage);
router.delete("/:siteId/pages/:pageId", authenticateToken, requireSiteAccess, requirePlatformAdmin, deletePage);
router.post("/:siteId/sub-pages", authenticateToken, requireSiteAccess, requirePlatformAdmin, createSubPage);
router.put("/:siteId/sub-pages/:pageId", authenticateToken, requireSiteAccess, requirePlatformAdmin, updateSubPage);
router.delete("/:siteId/sub-pages/:pageId", authenticateToken, requireSiteAccess, requirePlatformAdmin, deleteSubPage);

module.exports = router;