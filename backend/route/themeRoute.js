const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticate");

const { requirePlatformAdmin } = require("../middleware/siteAccess");
const {
  listThemes,
  createTheme,
  updateTheme,
  deleteTheme,
} = require("../controller/themeController");

router.get("/", authenticateToken, listThemes);
router.post("/", authenticateToken, requirePlatformAdmin, createTheme);
router.put("/:themeId", authenticateToken, requirePlatformAdmin, updateTheme);
router.delete("/:themeId", authenticateToken, requirePlatformAdmin, deleteTheme);

module.exports = router;