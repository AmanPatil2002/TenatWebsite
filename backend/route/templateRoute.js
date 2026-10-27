const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authenticate");
const { requirePlatformAdmin } = require("../middleware/siteAccess");

const {
  getTemplates,
  getTemplate,
  addTemplate,
  updateTemplate,
  deleteTemplate,
} = require("../controller/templateController");

const {
  listTemplatePages,
  createTemplatePage,
  updateTemplatePage,
  deleteTemplatePage,
  listTemplateThemes,
  createTemplateTheme,
  updateTemplateTheme,
  deleteTemplateTheme,
  listTemplateMenuItems,
  createTemplateMenuItem,
  updateTemplateMenuItem,
  deleteTemplateMenuItem,
  getTemplateContent,
} = require("../controller/templateContentController");

// Admin-only listing routes must come before /:templateId.
router.get("/admin/all", authenticateToken, requirePlatformAdmin, getTemplates);

router.get(
  "/admin/:templateId",
  authenticateToken,
  requirePlatformAdmin,
  getTemplate,
);

// Public template listing and details.
router.get("/", getTemplates);
router.get("/:templateId", getTemplate);
router.get("/:templateId/content", getTemplateContent);

// Pages belonging to a template.
router.get(
  "/:templateId/pages",
  authenticateToken,
  requirePlatformAdmin,
  listTemplatePages,
);
router.post(
  "/:templateId/pages",
  authenticateToken,
  requirePlatformAdmin,
  createTemplatePage,
);
router.put(
  "/:templateId/pages/:pageId",
  authenticateToken,
  requirePlatformAdmin,
  updateTemplatePage,
);
router.delete(
  "/:templateId/pages/:pageId",
  authenticateToken,
  requirePlatformAdmin,
  deleteTemplatePage,
);

// Themes belonging to a template.
router.get(
  "/:templateId/themes",
  authenticateToken,
  requirePlatformAdmin,
  listTemplateThemes,
);
router.post(
  "/:templateId/themes",
  authenticateToken,
  requirePlatformAdmin,
  createTemplateTheme,
);
router.put(
  "/:templateId/themes/:themeId",
  authenticateToken,
  requirePlatformAdmin,
  updateTemplateTheme,
);
router.delete(
  "/:templateId/themes/:themeId",
  authenticateToken,
  requirePlatformAdmin,
  deleteTemplateTheme,
);

// Menu items belonging to a template.
router.get(
  "/:templateId/menu",
  authenticateToken,
  requirePlatformAdmin,
  listTemplateMenuItems,
);
router.post(
  "/:templateId/menu",
  authenticateToken,
  requirePlatformAdmin,
  createTemplateMenuItem,
);
router.put(
  "/:templateId/menu/:menuItemId",
  authenticateToken,
  requirePlatformAdmin,
  updateTemplateMenuItem,
);
router.delete(
  "/:templateId/menu/:menuItemId",
  authenticateToken,
  requirePlatformAdmin,
  deleteTemplateMenuItem,
);

// Template CRUD.
router.post("/", authenticateToken, requirePlatformAdmin, addTemplate);
router.put(
  "/:templateId",
  authenticateToken,
  requirePlatformAdmin,
  updateTemplate,
);
router.delete(
  "/:templateId",
  authenticateToken,
  requirePlatformAdmin,
  deleteTemplate,
);

module.exports = router;
