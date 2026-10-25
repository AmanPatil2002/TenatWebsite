const express = require("express");
const router = express.Router();

const {
  getCategories,
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../controller/categoryController");
const authenticateToken = require("../middleware/authenticate");

router.get("/", getCategories);
router.get("/:categoryId", getCategory);
router.post("/", authenticateToken, addCategory);
router.put("/:categoryId", authenticateToken, updateCategory);
router.delete("/:categoryId", authenticateToken, deleteCategory);

module.exports = router;