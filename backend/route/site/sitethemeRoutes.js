const router = require("express").Router();
const authenticateToken = require("../../middleware/authenticate");
const authenticateSiteAdmin = require("../../middleware/authenticateSiteAdmin");
const {
  getTheme,
  updateCustomTheme,
  setActiveTheme,
  resetToDefault
} = require("../../controller/site/sitethemeController");

// Client-admin routes (MUST come before generic /:siteId/theme to avoid route capture)
router.get("/client-admin/:siteId/theme", authenticateSiteAdmin, getTheme);
router.put("/client-admin/:siteId/theme/custom", authenticateSiteAdmin, updateCustomTheme);
router.patch("/client-admin/:siteId/theme/active", authenticateSiteAdmin, setActiveTheme);
router.delete("/client-admin/:siteId/theme/custom", authenticateSiteAdmin, resetToDefault);

// Owner routes
router.get("/:siteId/theme", authenticateToken, getTheme);

module.exports = router;
