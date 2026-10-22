const db = require("../config/db");

const isAdmin = (user) => ["admin", "superadmin"].includes(user?.role);

function validateCategory(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const tag = typeof body.tag === "string" ? body.tag.trim() : "";
  const content =
    typeof body.content === "string" ? body.content.trim() : "";

  if (!name) return { error: "Name is required" };
  if (name.length > 50) return { error: "Name must be 50 characters or fewer" };
  if (tag.length > 30) return { error: "Tag must be 30 characters or fewer" };
  if (content.length > 100)
    return { error: "Content must be 100 characters or fewer" };

  return { name, tag: tag || null, content: content || null };
}

const listCategories = (req, res) => {
  db.query(
    "SELECT categoryId, name, tag, content FROM categories ORDER BY name",
    (err, rows) => {
      if (err) {
        console.error("listCategories:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      res.json(rows);
    },
  );
};

const createCategory = (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ message: "Forbidden" });

  const { error, name, tag, content } = validateCategory(req.body);
  if (error) return res.status(400).json({ message: error });

  db.query(
    "INSERT INTO categories (name, tag, content, createdBy) VALUES (?, ?, ?, ?)",
    [name, tag, content, req.user.userId],
    (err, result) => {
      if (err) {
        console.error("createCategory:", err);
        if (err.code === "ER_DUP_ENTRY")
          return res.status(409).json({ message: "Category name already exists" });
        return res.status(500).json({ message: "Internal server error" });
      }
      res.status(201).json({ categoryId: result.insertId });
    },
  );
};

const updateCategory = (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ message: "Forbidden" });

  const id = Number(req.params.categoryId);
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ message: "Invalid categoryId" });

  const { error, name, tag, content } = validateCategory(req.body);
  if (error) return res.status(400).json({ message: error });

  db.query(
    "UPDATE categories SET name = ?, tag = ?, content = ? WHERE categoryId = ?",
    [name, tag, content, id],
    (err, result) => {
      if (err) {
        console.error("updateCategory:", err);
        if (err.code === "ER_DUP_ENTRY")
          return res.status(409).json({ message: "Category name already exists" });
        return res.status(500).json({ message: "Internal server error" });
      }
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Category not found" });
      res.json({ categoryId: id });
    },
  );
};

const deleteCategory = (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ message: "Forbidden" });

  const id = Number(req.params.categoryId);
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ message: "Invalid categoryId" });

  db.query("DELETE FROM categories WHERE categoryId = ?", [id], (err, result) => {
    if (err) {
      console.error("deleteCategory:", err);
      // FK constraint, e.g. templates still reference this category
      if (err.code === "ER_ROW_IS_REFERENCED_2")
        return res.status(409).json({
          message: "Cannot delete: templates are still using this category",
        });
      return res.status(500).json({ message: "Internal server error" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Category not found" });
    res.json({ categoryId: id });
  });
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};