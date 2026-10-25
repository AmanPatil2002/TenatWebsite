const db = require("../config/db");

const isAdmin = (req) => req.user?.role === "admin";

const validId = (id) => /^[1-9]\d*$/.test(id) && BigInt(id) <= 18446744073709551615n;

// The `mysql` package returns JSON columns as text; mysql2 already parses them.
const parseContent = (row) => {
  if (row && typeof row.content === "string") {
    try {
      row.content = JSON.parse(row.content);
    } catch (e) {
      // leave as is
    }
  }
  return row;
};

// content must be an object/array (or empty). Returns { error } or { value }.
const checkContent = (content) => {
  if (content === null || content === "") return { value: null };
  if (typeof content !== "object") {
    return { error: "Content must be a JSON object or array" };
  }
  return { value: JSON.stringify(content) };
};

// Public: all categories, A to Z
const getCategories = (req, res) => {
  db.query(
    "SELECT categoryId,name,tag,content,createdBy,createdAt FROM categories ORDER BY name ASC",
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(result.map(parseContent));
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
    "SELECT categoryId,name,tag,content,createdBy,createdAt FROM categories WHERE categoryId=?",
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
  const tag =
    typeof req.body.tag === "string" && req.body.tag.trim() ? req.body.tag.trim() : null;

  if (!name) return res.status(400).json({ message: "Name is required" });
  if (name.length > 500) {
    return res.status(400).json({ message: "Name must be 500 characters or fewer" });
  }
  if (tag && tag.length > 500) {
    return res.status(400).json({ message: "Tag must be 500 characters or fewer" });
  }

  const content = checkContent(req.body.content === undefined ? null : req.body.content);
  if (content.error) return res.status(400).json({ message: content.error });

  db.query(
    "INSERT INTO categories(name,tag,content,createdBy) VALUES(?,?,?,?)",
    [name, tag, content.value, req.user.userId],
    (err, result) => {
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
    if (name.length > 500) {
      return res.status(400).json({ message: "Name must be 500 characters or fewer" });
    }
    fields.push("name=?");
    values.push(name);
  }

  if (req.body.tag !== undefined) {
    const tag =
      typeof req.body.tag === "string" && req.body.tag.trim() ? req.body.tag.trim() : null;
    if (tag && tag.length > 500) {
      return res.status(400).json({ message: "Tag must be 500 characters or fewer" });
    }
    fields.push("tag=?");
    values.push(tag);
  }

  if (req.body.content !== undefined) {
    const content = checkContent(req.body.content);
    if (content.error) return res.status(400).json({ message: content.error });
    fields.push("content=?");
    values.push(content.value);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  db.query(
    `UPDATE categories SET ${fields.join(",")} WHERE categoryId=?`,
    [...values, categoryId],
    (err, result) => {
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