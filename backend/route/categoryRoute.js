const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticate");
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controller/categoryController");

router.get("/", listCategories);
router.post("/", authenticateToken, createCategory);
router.put("/:categoryId", authenticateToken, updateCategory);
router.delete("/:categoryId", authenticateToken, deleteCategory);

module.exports = router;