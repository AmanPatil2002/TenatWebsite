const db = require("../config/db");

const STATUSES = ["draft", "published", "archived"];
const MAX_URL_LENGTH = 255;

const isHttpUrl = (v) => {
  try {
    return ["http:", "https:"].includes(new URL(v).protocol);
  } catch {
    return false;
  }
};

// Log the real error, send a generic message to the client
const fail = (res, err) => {
  console.error(err);
  return res.status(500).json({ message: "Server error" });
};

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
  if (categoryId) {
    sql += " AND t.categoryId = ?";
    params.push(categoryId);
  }
  sql += " ORDER BY t.createdAt DESC";

  db.query(sql, params, (err, rows) => {
    if (err) return fail(res, err);
    res.json(rows);
  });
};

// Admin: list ALL templates (any status) with full details
const listAllTemplates = (req, res) => {
  if (!["admin", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  db.query(
    `SELECT t.*, c.name AS categoryName
       FROM template t
       JOIN categories c ON c.categoryId = t.categoryId
      ORDER BY t.createdAt DESC`,
    (err, rows) => {
      if (err) return fail(res, err);
      res.json(rows);
    }
  );
};

// Public: single template with pages + themes (for preview)
const getTemplate = (req, res) => {
  const { id } = req.params;
  db.query(
    `SELECT templateId, categoryId, name, language, shortDescription, description,
            thumbnailUrl, demoUrl, demoDomain, price, currency, validityDays,
            createdBy, createdAt, updatedAt
       FROM template WHERE templateId = ? AND status = 'published'`,
    [id],
    (err, tplRows) => {
      if (err) return fail(res, err);
      if (!tplRows.length) return res.status(404).json({ message: "Not found" });

      db.query(
        `SELECT id, parentId, title, slug, pageType, content, showInMenu, sortOrder
           FROM templatePages WHERE templateId = ? ORDER BY sortOrder, id`,
        [id],
        (err2, pages) => {
          if (err2) return fail(res, err2);

          db.query(
            `SELECT id, name, settings, type, isDefault
               FROM templateThemes WHERE templateId = ?`,
            [id],
            (err3, themes) => {
              if (err3) return fail(res, err3);
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
    categoryId,
    name,
    language,
    shortDescription,
    description,
    thumbnailUrl,
    demoUrl,
    demoDomain,
    validityDays,
    status = "draft",
  } = req.body;

  const cleanName = typeof name === "string" ? name.trim() : "";
  const price = Number(req.body.price);
  const days = validityDays ?? 365;

  if (!Number.isInteger(Number(categoryId)) || Number(categoryId) < 1) {
    return res.status(400).json({ message: "Valid categoryId is required" });
  }
  if (cleanName.length < 3 || cleanName.length > 100) {
    return res.status(400).json({ message: "name must be 3–100 characters" });
  }
  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ message: "price must be > 0" });
  }
  if (!Number.isInteger(Number(days)) || Number(days) < 1) {
    return res
      .status(400)
      .json({ message: "validityDays must be a whole number ≥ 1" });
  }
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  if (language && String(language).length > 100) {
    return res.status(400).json({ message: "language must be ≤ 100 characters" });
  }
  if (shortDescription && String(shortDescription).length > 150) {
    return res
      .status(400)
      .json({ message: "shortDescription must be ≤ 150 characters" });
  }
  if (description && String(description).length > 2000) {
    return res
      .status(400)
      .json({ message: "description must be ≤ 2000 characters" });
  }
  for (const [key, value] of Object.entries({ thumbnailUrl, demoUrl })) {
    if (value && (!isHttpUrl(value) || String(value).length > MAX_URL_LENGTH)) {
      return res.status(400).json({ message: `${key} is invalid` });
    }
  }

  db.query(
    `INSERT INTO template
       (categoryId, name, language, shortDescription, description,
        thumbnailUrl, demoUrl, demoDomain, price, currency, validityDays,
        status, createdBy)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      Number(categoryId),
      cleanName,
      language || null,
      shortDescription || null,
      description || null,
      thumbnailUrl || null,
      demoUrl || null,
      demoDomain || null,
      price,
      "INR", // currency is fixed; not taken from the client
      Number(days),
      status,
      req.user.userId,
    ],
    (err, result) => {
      if (err) {
        // categoryId doesn't exist in categories table
        if (err.code === "ER_NO_REFERENCED_ROW_2") {
          return res.status(400).json({ message: "Category does not exist" });
        }
        return fail(res, err);
      }
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
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  db.query(
    "UPDATE template SET status = ? WHERE templateId = ?",
    [status, req.params.id],
    (err, result) => {
      if (err) return fail(res, err);
      if (!result.affectedRows) {
        return res.status(404).json({ message: "Not found" });
      }
      res.json({ ok: true });
    }
  );
};

module.exports = {
  listTemplates,
  listAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplateStatus,
};