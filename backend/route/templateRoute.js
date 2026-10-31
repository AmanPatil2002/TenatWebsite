const express = require("express");
const authenticateToken = require("../middleware/authenticate");
const { requirePlatformAdmin } = require("../middleware/siteAccess");
const {
  getTemplates,
  getAllTemplates,
  getTemplate,
  getTemplateAdmin,
  addTemplate,
  updateTemplate,
  reorderTemplatePages,
  deleteTemplate,
} = require("../controller/templateController");

const router = express.Router();

router.get("/admin/all", authenticateToken, requirePlatformAdmin, getAllTemplates);
router.get("/admin/:templateId", authenticateToken, requirePlatformAdmin, getTemplateAdmin);
router.post("/", authenticateToken, requirePlatformAdmin, addTemplate);
router.get("/", getTemplates);
router.put(
  "/:templateId/pages/order",
  authenticateToken,
  requirePlatformAdmin,
  reorderTemplatePages,
);
router.get("/:templateId", getTemplate);
router.put("/:templateId", authenticateToken, requirePlatformAdmin, updateTemplate);
router.delete("/:templateId", authenticateToken, requirePlatformAdmin, deleteTemplate);

module.exports = router;