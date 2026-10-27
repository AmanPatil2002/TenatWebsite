const express = require("express");
const authenticateToken = require("../middleware/authenticate");
const {
  createPage,
  getPages,
  getPageById,
  updatePage,
  deletePage,
} = require("../controller/pageController");

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (!["admin", "superadmin"].includes(req.user?.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

router.get("/", authenticateToken, getPages);
router.get("/:id", authenticateToken, getPageById);

router.post("/", authenticateToken, requireAdmin, createPage);
router.put("/:id", authenticateToken, requireAdmin, updatePage);
router.delete("/:id", authenticateToken, requireAdmin, deletePage);

module.exports = router;