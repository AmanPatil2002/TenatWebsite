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

// ---- reads (any authenticated user) -------------------------------------
router.get("/",    authenticateToken, getPages);
router.get("/:id", authenticateToken, getPageById);

// ---- writes (platform admin only) ---------------------------------------
router.post("/", authenticateToken, requirePlatformAdmin, createPage);

router.put("/:id",    authenticateToken, requirePlatformAdmin, updatePage);
router.delete("/:id", authenticateToken, requirePlatformAdmin, deletePage);

module.exports = router;