const db = require("../config/db");

// Public: list published templates (filter by categoryId optional)
const listTemplates = (req, res) => {
  const { categoryId } = req.query;
  let sql = `
    SELECT t.templateId, t.name, t.shortDescription, t.thumbnailUrl,
           t.price, t.currency, t.validityDays,
           t.categoryId, c.name AS categoryName,
           (SELECT AVG(rating) FROM review WHERE templateId = t.templateId) AS avgRating
      FROM template t
      JOIN categories c ON c.categoryId = t.categoryId
     WHERE t.status = 'published'`;
  const params = [];
  if (categoryId) { sql += " AND t.categoryId = ?"; params.push(categoryId); }
  sql += " ORDER BY t.createdAt DESC";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

// Public: single template with pages + themes (for preview)
const getTemplate = (req, res) => {
  const { id } = req.params;
  db.query(
    `SELECT templateId, categoryId, name, language, shortDescription, description,
            thumbnailUrl, demoUrl, demoDomain, price, currency, validityDays
       FROM template WHERE templateId = ? AND status = 'published'`,
    [id],
    (err, tplRows) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!tplRows.length) return res.status(404).json({ message: "Not found" });

      db.query(
        `SELECT id, parentId, title, slug, pageType, content, showInMenu, sortOrder
           FROM templatePages WHERE templateId = ? ORDER BY sortOrder, id`,
        [id],
        (err2, pages) => {
          if (err2) return res.status(500).json({ message: err2.message });

          db.query(
            `SELECT id, name, settings, type, isDefault
               FROM templateThemes WHERE templateId = ?`,
            [id],
            (err3, themes) => {
              if (err3) return res.status(500).json({ message: err3.message });
              res.json({ ...tplRows[0], pages, themes });
            }
          );
        }
      );
    }
  );
};

// Admin: create template
const createTemplate = (req, res) => {
  if (!["superadmin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const {
    categoryId, name, language, shortDescription, description,
    thumbnailUrl, demoUrl, demoDomain, price, currency, validityDays,
    status = "draft",
  } = req.body;

  if (!categoryId || !name || price == null) {
    return res.status(400).json({ message: "categoryId, name, price required" });
  }
  if (Number(price) <= 0) {
    return res.status(400).json({ message: "price must be > 0" });
  }

  db.query(
    `INSERT INTO template
       (categoryId, name, language, shortDescription, description,
        thumbnailUrl, demoUrl, demoDomain, price, currency, validityDays,
        status, createdBy)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      categoryId, name, language || null, shortDescription || null, description || null,
      thumbnailUrl || null, demoUrl || null, demoDomain || null,
      price, currency || "INR", validityDays ?? 365, status, req.user.userId,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ templateId: result.insertId });
    }
  );
};

// Admin: change template status
const updateTemplateStatus = (req, res) => {
  if (!["admin", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const { status } = req.body;
  if (!["draft", "published", "archived"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  db.query(
    "UPDATE template SET status = ? WHERE templateId = ?",
    [status, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!result.affectedRows) return res.status(404).json({ message: "Not found" });
      res.json({ ok: true });
    }
  );
};

module.exports = { listTemplates, getTemplate, createTemplate, updateTemplateStatus };