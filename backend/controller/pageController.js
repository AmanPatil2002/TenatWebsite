const db = require("../config/db");

const isValidPrice = (value) => {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && !value.trim())
  ) {
    return false;
  }

  const price = Number(value);

  return (
    Number.isFinite(price) &&
    price >= 0 &&
    price <= 99999999.99 &&
    /^\d+(\.\d{1,2})?$/.test(String(value).trim())
  );
};

const isValidId = (value) => {
  if (
    value === undefined ||
    value === null ||
    !/^[1-9]\d*$/.test(String(value))
  ) {
    return false;
  }

  try {
    return BigInt(value) <= 18446744073709551615n;
  } catch {
    return false;
  }
};

// POST /pages  (admin/superadmin)
const createPage = (req, res) => {
  const { title, categoryId, description, pagePrice } = req.body;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    !isValidId(categoryId) ||
    !isValidPrice(pagePrice)
  ) {
    return res.status(400).json({
      message:
        "Valid title, categoryId, description and pagePrice are required",
    });
  }

  const cleanTitle = title.trim();
  const cleanDescription = description.trim();

  if (cleanTitle.length > 150) {
    return res.status(400).json({
      message: "Title must be at most 150 characters",
    });
  }

  if (cleanDescription.length > 400) {
    return res.status(400).json({
      message: "Description must be at most 400 characters",
    });
  }

  const sql = `
    INSERT INTO pages
      (title, categoryId, description, pagePrice, createdBy)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      cleanTitle,
      String(categoryId),
      cleanDescription,
      Number(pagePrice),
      req.user.userId,
    ],
    (err, result) => {
      if (err) {
        if (err.code === "ER_NO_REFERENCED_ROW_2") {
          return res.status(400).json({
            message: "Invalid categoryId or user",
          });
        }

        console.error("Create page error:", err);
        return res.status(500).json({
          message: "Database error",
        });
      }

      return res.status(201).json({
        message: "Page created successfully",
        pagesId: result.insertId,
      });
    },
  );
};

// GET /pages?categoryId=1&search=home&page=1&limit=20
const getPages = (req, res) => {
  const { categoryId, search } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
  const offset = (page - 1) * limit;

  const where = [];
  const params = [];
  if (categoryId) {
    where.push("categoryId = ?");
    params.push(categoryId);
  }
  if (search) {
    where.push("title LIKE ?");
    params.push(`%${search}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  db.query(
    `SELECT COUNT(*) AS total FROM pages ${whereSql}`,
    params,
    (err, countRows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }
      const sql = `SELECT * FROM pages ${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
      db.query(sql, [...params, limit, offset], (err2, rows) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ message: "Database error" });
        }
        res.json({ total: countRows[0].total, page, limit, data: rows });
      });
    },
  );
};

// GET /pages/:id
const getPageById = (req, res) => {
  db.query(
    "SELECT * FROM pages WHERE pagesId = ?",
    [req.params.id],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }
      if (!rows.length)
        return res.status(404).json({ message: "Page not found" });
      res.json(rows[0]);
    },
  );
};

// PUT /pages/:id  (admin/superadmin) - partial update
const updatePage = (req, res) => {
  const { title, categoryId, description, pagePrice } = req.body;
  const fields = [];
  const params = [];

  if (title !== undefined) {
    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 150
    ) {
      return res.status(400).json({
        message: "Title must be nonempty and at most 150 characters",
      });
    }

    fields.push("title = ?");
    params.push(title.trim());
  }

  if (categoryId !== undefined) {
    if (!isValidId(categoryId)) {
      return res.status(400).json({
        message: "Invalid categoryId",
      });
    }

    fields.push("categoryId = ?");
    params.push(String(categoryId));
  }

  if (description !== undefined) {
    if (
      typeof description !== "string" ||
      !description.trim() ||
      description.trim().length > 400
    ) {
      return res.status(400).json({
        message: "Description must be nonempty and at most 400 characters",
      });
    }

    fields.push("description = ?");
    params.push(description.trim());
  }

  if (pagePrice !== undefined) {
    if (!isValidPrice(pagePrice)) {
      return res.status(400).json({
        message: "Invalid pagePrice",
      });
    }

    fields.push("pagePrice = ?");
    params.push(Number(pagePrice));
  }

  db.query(
    `UPDATE pages SET ${fields.join(", ")} WHERE pagesId = ?`,
    [...params, req.params.id],
    (err, result) => {
      if (err) {
        if (err.code === "ER_NO_REFERENCED_ROW_2") {
          return res.status(400).json({ message: "Invalid categoryId" });
        }
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }
      if (!result.affectedRows)
        return res.status(404).json({ message: "Page not found" });
      res.json({ message: "Page updated successfully" });
    },
  );
};

// DELETE /pages/:id  (admin/superadmin)
const deletePage = (req, res) => {
  db.query(
    "DELETE FROM pages WHERE pagesId = ?",
    [req.params.id],
    (err, result) => {
      if (err) {
        if (err.code === "ER_ROW_IS_REFERENCED_2") {
          return res
            .status(409)
            .json({ message: "Page is in use and cannot be deleted" });
        }
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }
      if (!result.affectedRows)
        return res.status(404).json({ message: "Page not found" });
      res.json({ message: "Page deleted successfully" });
    },
  );
};

module.exports = { createPage, updatePage, deletePage, getPageById, getPages };
