const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticate");
const requireSiteAccess = require("../middleware/siteAccess");
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
router.post("/:siteId/pages", authenticateToken, requireSiteAccess, createPage);
router.put("/:siteId/pages/:pageId", authenticateToken, requireSiteAccess, updatePage);
router.delete("/:siteId/pages/:pageId", authenticateToken, requireSiteAccess, deletePage);
router.post("/:siteId/sub-pages", authenticateToken, requireSiteAccess, createSubPage);
router.put("/:siteId/sub-pages/:pageId", authenticateToken, requireSiteAccess, updateSubPage);
router.delete("/:siteId/sub-pages/:pageId", authenticateToken, requireSiteAccess, deleteSubPage);

module.exports = router;