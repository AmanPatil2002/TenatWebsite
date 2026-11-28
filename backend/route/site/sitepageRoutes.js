const router = require("express").Router();
const authenticateToken = require("../../middleware/authenticate");
const authenticateSiteAdmin = require("../../middleware/authenticateSiteAdmin");
const {
  getSitePages, getPublicSitePages, getSitePageOptions, createSitePage,
  updateSitePage, deleteSitePage, reorderSitePages,
} = require("../../controller/site/sitepageController");

router.get("/:siteId/public/pages", getPublicSitePages);
// Owner routes
router.get("/:siteId/pages", authenticateToken, getSitePages);
router.post("/:siteId/pages", authenticateToken, createSitePage);
router.put("/:siteId/pages/:pageId", authenticateToken, updateSitePage);

// Client-admin routes
router.get("/client-admin/:siteId/pages", authenticateSiteAdmin, getSitePages);
router.post("/client-admin/:siteId/pages", authenticateSiteAdmin, createSitePage);
router.put("/client-admin/:siteId/pages/order", authenticateSiteAdmin, reorderSitePages);
router.put("/client-admin/:siteId/pages/:pageId", authenticateSiteAdmin, updateSitePage);
router.delete("/client-admin/:siteId/pages/:pageId", authenticateSiteAdmin, deleteSitePage);
router.get("/client-admin/:siteId/page-options", authenticateSiteAdmin, getSitePageOptions);
module.exports = router;
