const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticate");
const {
  listTemplates, getTemplate, createTemplate, updateTemplateStatus,
} = require("../controller/templateController");

router.get("/", listTemplates);
router.get("/:id", getTemplate);
router.post("/", authenticateToken, createTemplate);
router.patch("/:id/status", authenticateToken, updateTemplateStatus);

module.exports = router;

