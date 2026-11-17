const router = require("express").Router();
const authenticateToken = require("../../middleware/authenticate");
const authenticateSiteAdmin = require("../../middleware/authenticateSiteAdmin");
const { requirePlatformAdmin } = require("../../middleware/siteAccess");
const {
  listSitesForAdmin,
  createSiteAdmin,
  loginSiteAdmin,
  getSiteAdminProfile,
  updateSiteAdminProfile,
  changeSiteAdminPassword,
} = require("../../controller/siteAdminController");

router.post("/admin/login", loginSiteAdmin);
router.get("/admin/sites", authenticateToken, requirePlatformAdmin, listSitesForAdmin);
router.post("/admin/sites/:siteId/credentials", authenticateToken, requirePlatformAdmin, createSiteAdmin);
router.get("/client-admin/:siteId/profile", authenticateSiteAdmin, getSiteAdminProfile);
router.put("/client-admin/:siteId/profile", authenticateSiteAdmin, updateSiteAdminProfile);
router.put("/client-admin/:siteId/profile/password", authenticateSiteAdmin, changeSiteAdminPassword);

module.exports = router;
