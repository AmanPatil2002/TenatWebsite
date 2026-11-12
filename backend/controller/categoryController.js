const db = require("../config/db");

const isAdmin = (req) => req.user?.role === "admin";

const validId = (id) => /^[1-9]\d*$/.test(id) && BigInt(id) <= 18446744073709551615n;

// Limits match the column sizes in the categories table
const NAME_MAX = 190; // name    VARCHAR(190)
const PACK_KEY_MAX = 30; // packKey VARCHAR(30)
const TAG_MAX = 500; // tag     VARCHAR(500)

// Trimmed string, or null when empty / not a string
const cleanOptional = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;


// Public: all categories, A to Z
const getCategories = (req, res) => {
  db.query(
    "SELECT categoryId,name,packKey,tag,createdBy,createdAt FROM categories ORDER BY name ASC",
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(result);
    }
  );
};

// Public: one category
const getCategory = (req, res) => {
  const categoryId = req.params.categoryId;
  if (!validId(categoryId)) {
    return res.status(400).json({ message: "Invalid category ID" });
  }

  db.query(
    "SELECT categoryId,name,packKey,tag,createdBy,createdAt FROM categories WHERE categoryId=?",
    [categoryId],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.length === 0) return res.status(404).json({ message: "Category not found" });
      res.json(parseContent(result[0]));
    }
  );
};

// Admin: add a category
const addCategory = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const packKey = cleanOptional(req.body.packKey);
  const tag = cleanOptional(req.body.tag);

  if (!name) return res.status(400).json({ message: "Name is required" });
  if (name.length > NAME_MAX) {
    return res.status(400).json({ message: `Name must be ${NAME_MAX} characters or fewer` });
  }
  if (packKey && packKey.length > PACK_KEY_MAX) {
    return res
      .status(400)
      .json({ message: `Pack key must be ${PACK_KEY_MAX} characters or fewer` });
  }
  if (tag && tag.length > TAG_MAX) {
    return res.status(400).json({ message: `Tag must be ${TAG_MAX} characters or fewer` });
  }

  db.query(
    "INSERT INTO categories(name,packKey,tag,createdBy) VALUES(?,?,?,?)",
    [name, packKey, tag, content.value, req.user.userId],
    (err, result) => {
      if (err?.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "A category with this name already exists" });
      }
      if (err?.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({ message: "Creator user not found" });
      }
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({
        message: "Category added",
        categoryId: result.insertId,
      });
    }
  );
};

// Admin: edit a category (send only the fields you want to change)
const updateCategory = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

  const categoryId = req.params.categoryId;
  if (!validId(categoryId)) {
    return res.status(400).json({ message: "Invalid category ID" });
  }

  const fields = [];
  const values = [];

  if (req.body.name !== undefined) {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!name) return res.status(400).json({ message: "Name cannot be empty" });
    if (name.length > NAME_MAX) {
      return res.status(400).json({ message: `Name must be ${NAME_MAX} characters or fewer` });
    }
    fields.push("name=?");
    values.push(name);
  }

  if (req.body.packKey !== undefined) {
    const packKey = cleanOptional(req.body.packKey);
    if (packKey && packKey.length > PACK_KEY_MAX) {
      return res
        .status(400)
        .json({ message: `Pack key must be ${PACK_KEY_MAX} characters or fewer` });
    }
    fields.push("packKey=?");
    values.push(packKey);
  }

  if (req.body.tag !== undefined) {
    const tag = cleanOptional(req.body.tag);
    if (tag && tag.length > TAG_MAX) {
      return res.status(400).json({ message: `Tag must be ${TAG_MAX} characters or fewer` });
    }
    fields.push("tag=?");
    values.push(tag);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  db.query(
    `UPDATE categories SET ${fields.join(",")} WHERE categoryId=?`,
    [...values, categoryId],
    (err, result) => {
      if (err?.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "A category with this name already exists" });
      }
      if (err) return res.status(500).json({ message: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category updated", categoryId });
    }
  );
};

// Admin: delete a category (blocked while templates still use it)
const deleteCategory = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });

  const categoryId = req.params.categoryId;
  if (!validId(categoryId)) {
    return res.status(400).json({ message: "Invalid category ID" });
  }

  db.query("DELETE FROM categories WHERE categoryId=?", [categoryId], (err, result) => {
    if (err?.code === "ER_ROW_IS_REFERENCED_2") {
      return res
        .status(409)
        .json({ message: "Category has templates. Move or delete them first" });
    }
    if (err) return res.status(500).json({ message: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Category deleted", categoryId });
  });
};

module.exports = {
  getCategories,
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory,
};