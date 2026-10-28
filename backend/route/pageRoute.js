const express = require("express");
const authenticateToken = require("../middleware/authenticate");
const { requirePlatformAdmin } = require("../middleware/siteAccess");
const {
  createPage,
  getPages,
  getPageById,
  updatePage,
  deletePage,
} = require("../controller/pageController");

const router = express.Router();

// Read pages: authenticated users
router.get("/", authenticateToken, getPages);
router.get("/:id", authenticateToken, getPageById);

// Create, update, delete: admin only
router.post("/", authenticateToken, requirePlatformAdmin, createPage);
router.put("/:id", authenticateToken, requirePlatformAdmin, updatePage);
router.delete("/:id", authenticateToken, requirePlatformAdmin, deletePage);

module.exports = router;