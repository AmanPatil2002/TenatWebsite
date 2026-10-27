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
