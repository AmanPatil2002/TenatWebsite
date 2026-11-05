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
  getSiteHeader,
  updateSiteHeader,
  getSitePageOptions,
  createSitePage,
  updateSitePage,
  reorderSitePages,
} = require("../controller/siteController");
const siteMedia = require("../controller/siteMediaController");

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
router.get("/:siteId/header", authenticateToken, getSiteHeader);
router.put("/:siteId/header", authenticateToken, updateSiteHeader);
router.get("/client-admin/:siteId/header", authenticateSiteAdmin, getSiteHeader);
router.put("/client-admin/:siteId/header", authenticateSiteAdmin, updateSiteHeader);
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

// Category-specific routes
// router.get("/client-admin/:siteId/students", authenticateSiteAdmin, require("../controller/siteStudentController").getStudents);
// router.post("/client-admin/:siteId/students", authenticateSiteAdmin, require("../controller/siteStudentController").createStudent);
// router.put("/client-admin/:siteId/students/:studentId", authenticateSiteAdmin, require("../controller/siteStudentController").updateStudent);
// router.delete("/client-admin/:siteId/students/:studentId", authenticateSiteAdmin, require("../controller/siteStudentController").deleteStudent);

// router.get("/client-admin/:siteId/restaurants", authenticateSiteAdmin, require("../controller/siteRestaurantController").getRestaurants);
// router.post("/client-admin/:siteId/restaurants", authenticateSiteAdmin, require("../controller/siteRestaurantController").createRestaurant);
// router.put("/client-admin/:siteId/restaurants/:restaurantId", authenticateSiteAdmin, require("../controller/siteRestaurantController").updateRestaurant);
// router.delete("/client-admin/:siteId/restaurants/:restaurantId", authenticateSiteAdmin, require("../controller/siteRestaurantController").deleteRestaurant);

// router.get("/client-admin/:siteId/products", authenticateSiteAdmin, require("../controller/siteProductController").getProducts);
// router.post("/client-admin/:siteId/products", authenticateSiteAdmin, require("../controller/siteProductController").createProduct);
// router.put("/client-admin/:siteId/products/:productId", authenticateSiteAdmin, require("../controller/siteProductController").updateProduct);
// router.delete("/client-admin/:siteId/products/:productId", authenticateSiteAdmin, require("../controller/siteProductController").deleteProduct);

// router.get("/client-admin/:siteId/menus", authenticateSiteAdmin, require("../controller/siteMenuController").getMenus);
// router.post("/client-admin/:siteId/menus", authenticateSiteAdmin, require("../controller/siteMenuController").createMenu);
// router.put("/client-admin/:siteId/menus/:menuId", authenticateSiteAdmin, require("../controller/siteMenuController").updateMenu);
// router.delete("/client-admin/:siteId/menus/:menuId", authenticateSiteAdmin, require("../controller/siteMenuController").deleteMenu);
router.get(
  "/client-admin/:siteId/media",
  authenticateSiteAdmin,
  siteMedia.listPublishedMedia,
);
router.get("/:siteId/media", authenticateToken, siteMedia.listPublishedMedia);
router.post(
  "/client-admin/:siteId/media/upload",
  authenticateSiteAdmin,
  ...siteMedia.uploadImage,
);
for (const contentType of ["news", "galleries", "slider"]) {
  const handlers = siteMedia[contentType];
  router.get(`/client-admin/:siteId/${contentType}`, authenticateSiteAdmin, handlers.list);
  router.post(`/client-admin/:siteId/${contentType}`, authenticateSiteAdmin, handlers.create);
  router.put(
    `/client-admin/:siteId/${contentType}/:itemId`,
    authenticateSiteAdmin,
    handlers.update,
  );
  router.delete(
    `/client-admin/:siteId/${contentType}/:itemId`,
    authenticateSiteAdmin,
    handlers.remove,
  );
}

module.exports = router;
