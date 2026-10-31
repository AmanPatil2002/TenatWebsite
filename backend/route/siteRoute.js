const express = require("express");
const authenticateToken = require("../middleware/authenticate");
const authenticateSiteAdmin = require("../middleware/authenticateSiteAdmin");
const { requirePlatformAdmin } = require("../middleware/siteAccess");
const {
  listSitesForAdmin,
  createSiteAdmin,
  loginSiteAdmin,
} = require("../controller/siteAdminController");
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
} = require("../controller/siteContentController");
const {
  getMySites,
  getSitePages,
  getSitePageOptions,
  createSitePage,
  updateSitePage,
  reorderSitePages,
} = require("../controller/siteController");

const router = express.Router();

router.post("/admin/login", loginSiteAdmin);
router.get(
  "/admin/sites",
  authenticateToken,
  requirePlatformAdmin,
  listSitesForAdmin,
);
router.post(
  "/admin/sites/:siteId/credentials",
  authenticateToken,
  requirePlatformAdmin,
  createSiteAdmin,
);
router.get("/my", authenticateToken, getMySites);
router.post("/:siteId/pages", authenticateToken, createSitePage);
router.put("/:siteId/pages/:pageId", authenticateToken, updateSitePage);
router.get("/:siteId/pages", authenticateToken, getSitePages);
router.get(
  "/client-admin/:siteId/pages",
  authenticateSiteAdmin,
  getSitePages,
);
router.post(
  "/client-admin/:siteId/pages",
  authenticateSiteAdmin,
  createSitePage,
);
router.put(
  "/client-admin/:siteId/pages/order",
  authenticateSiteAdmin,
  reorderSitePages,
);
router.put(
  "/client-admin/:siteId/pages/:pageId",
  authenticateSiteAdmin,
  updateSitePage,
);
router.get(
  "/client-admin/:siteId/page-options",
  authenticateSiteAdmin,
  getSitePageOptions,
);
router.get("/client-admin/:siteId/employees", authenticateSiteAdmin, getEmployees);
router.post("/client-admin/:siteId/employees", authenticateSiteAdmin, createEmployee);
router.put(
  "/client-admin/:siteId/employees/:employeeId",
  authenticateSiteAdmin,
  updateEmployee,
);
router.delete(
  "/client-admin/:siteId/employees/:employeeId",
  authenticateSiteAdmin,
  deleteEmployee,
);
router.get("/client-admin/:siteId/entries", authenticateSiteAdmin, getEntries);
router.post("/client-admin/:siteId/entries", authenticateSiteAdmin, createEntry);
router.put(
  "/client-admin/:siteId/entries/:entryId",
  authenticateSiteAdmin,
  updateEntry,
);
router.delete(
  "/client-admin/:siteId/entries/:entryId",
  authenticateSiteAdmin,
  deleteEntry,
);

module.exports = router;
