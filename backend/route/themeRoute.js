const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticate");
const requireSiteAccess = require("../middleware/siteAccess");
const {
  listThemes,
  createTheme,
  updateTheme,
  activateTheme,
  deleteTheme,
} = require("../controller/themeController");

router.get("/:siteId/themes", authenticateToken, requireSiteAccess, listThemes);
router.post("/:siteId/themes", authenticateToken, requireSiteAccess, createTheme);
router.put("/:siteId/themes/:themeId", authenticateToken, requireSiteAccess, updateTheme);
router.patch("/:siteId/themes/:themeId/activate", authenticateToken, requireSiteAccess, activateTheme);
router.delete("/:siteId/themes/:themeId", authenticateToken, requireSiteAccess, deleteTheme);

module.exports = router;