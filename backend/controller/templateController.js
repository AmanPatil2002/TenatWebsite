
const db = require("../config/db");

const STATUSES = ["draft", "published", "archived"];

const isAdmin = (req) =>
  ["admin", "superadmin"].includes(req.user?.role);

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const validId = (id) => {
  if (typeof id === "number") {
    if (!Number.isSafeInteger(id) || id < 1) return false;
    id = String(id);
  }

  if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
    return false;
  }

  try {
    return BigInt(id) <= 18446744073709551615n;
  } catch {
    return false;
  }
};

const escapeLike = (value) =>
  value.replace(/[\\%_]/g, (character) => `\\${character}`);

const SELECT_COLUMNS = `
  t.templateId,
  t.categoryId,
  c.name AS categoryName,
  t.name,
  t.language,
  t.shortDescription,
  t.description,
  t.thumbnailUrl,
  t.photos,
  t.price,
  t.currency,
  t.validityDays,
  t.status,
  t.createdBy,
  t.createdAt,
  t.updatedAt
`;

const TEXT_FIELDS = [
  ["language", 100],
  ["shortDescription", 300],
  ["description", null],
  ["thumbnailUrl", 500],
  ["photos", 500],
];

const cleanTemplate = (body, partial = false) => {
  if (!isPlainObject(body)) {
    return { error: "Invalid request body" };
  }

  const data = {};
  const has = (key) => body[key] !== undefined;

  if (!partial || has("categoryId")) {
    const raw = body.categoryId;
    const categoryId =
      typeof raw === "number" ? String(raw) : raw;

    if (!validId(categoryId)) {
      return { error: "A valid categoryId is required" };
    }

    data.categoryId = categoryId;
  }

  if (!partial || has("name")) {
    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    if (!name) return { error: "Template name is required" };

    if (name.length > 150) {
      return { error: "Name must be 150 characters or fewer" };
    }

    data.name = name;
  }

  for (const [field, maxLength] of TEXT_FIELDS) {
    if (!has(field)) continue;

    const raw = body[field];

    if (raw !== null && typeof raw !== "string") {
      return { error: `${field} must be a string or null` };
    }

    const value =
      typeof raw === "string" && raw.trim()
        ? raw.trim()
        : null;

    if (value && maxLength && value.length > maxLength) {
      return {
        error: `${field} must be ${maxLength} characters or fewer`,
      };
    }

    if (
      value &&
      ["thumbnailUrl", "photos"].includes(field) &&
      !/^https?:\/\/\S+$/i.test(value)
    ) {
      return {
        error: `${field} must be a valid HTTP or HTTPS URL`,
      };
    }

    data[field] = value;
  }

  if (!partial || has("price")) {
    const raw = body.price;
    const priceText =
      typeof raw === "number" || typeof raw === "string"
        ? String(raw).trim()
        : "";

    const price = Number(priceText);

    if (
      !/^\d+(?:\.\d{1,2})?$/.test(priceText) ||
      !Number.isFinite(price) ||
      price <= 0 ||
      price > 99999999.99
    ) {
      return {
        error:
          "Price must be positive, at most 99999999.99, with up to 2 decimal places",
      };
    }

    data.price = price.toFixed(2);
  }

  if (has("currency")) {
    if (
      typeof body.currency !== "string" ||
      !/^[A-Za-z]{3}$/.test(body.currency.trim())
    ) {
      return {
        error: "Currency must be a three-letter code, such as INR",
      };
    }

    data.currency = body.currency.trim().toUpperCase();
  }

  if (has("validityDays")) {
    const raw = body.validityDays;

    if (
      raw === "" ||
      raw === null ||
      raw === undefined ||
      !/^\d+$/.test(String(raw))
    ) {
      return {
        error: "Validity must be a whole number from 1 to 3650 days",
      };
    }

    const days = Number(raw);

    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      return {
        error: "Validity must be a whole number from 1 to 3650 days",
      };
    }

    data.validityDays = days;
  }

  if (has("status")) {
    if (!STATUSES.includes(body.status)) {
      return {
        error: "Status must be draft, published or archived",
      };
    }

    data.status = body.status;
  }

  return { data };
};

// GET /templates
// Public users see published templates.
// Administrators can filter by status.
const getTemplates = (req, res) => {
  const where = [];
  const values = [];

  if (!isAdmin(req)) {
    where.push("t.status = 'published'");
  } else if (STATUSES.includes(req.query.status)) {
    where.push("t.status = ?");
    values.push(req.query.status);
  }

  if (req.query.categoryId !== undefined) {
    if (!validId(req.query.categoryId)) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    where.push("t.categoryId = ?");
    values.push(req.query.categoryId);
  }

  const q = typeof req.query.q === "string"
    ? req.query.q.trim()
    : "";

  if (q) {
    const pattern = `%${escapeLike(q)}%`;

    where.push(
      "(t.name LIKE ? OR t.shortDescription LIKE ?)"
    );

    values.push(pattern, pattern);
  }

  const orders = {
    newest: "t.createdAt DESC",
    price_asc: "t.price ASC",
    price_desc: "t.price DESC",
    name: "t.name ASC",
  };

  const orderBy = orders[req.query.sort] || orders.newest;

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit, 10) || 20, 1),
    100
  );
  const offset = (page - 1) * limit;
  const whereSql = where.length
    ? ` WHERE ${where.join(" AND ")}`
    : "";

  db.query(
    `SELECT COUNT(*) AS total
     FROM template t
     ${whereSql}`,
    values,
    (countError, countRows) => {
      if (countError) {
        console.error("getTemplates count error:", countError);

        return res.status(500).json({
          message: "Internal server error",
        });
      }

      db.query(
        `SELECT ${SELECT_COLUMNS}
         FROM template t
         JOIN categories c ON c.categoryId = t.categoryId
         ${whereSql}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [...values, limit, offset],
        (error, rows) => {
          if (error) {
            console.error("getTemplates query error:", error);

            return res.status(500).json({
              message: "Internal server error",
            });
          }

          const total = Number(countRows[0].total);

          res.set("X-Total-Count", String(total));
          res.set("X-Page", String(page));
          res.set("X-Limit", String(limit));

          return res.json(rows);
        }
      );
    }
  );
};

// GET /templates/:templateId
const getTemplate = (req, res) => {
  const { templateId } = req.params;

  if (!validId(templateId)) {
    return res.status(400).json({
      message: "Invalid template ID",
    });
  }

  let sql = `
    SELECT ${SELECT_COLUMNS}
    FROM template t
    JOIN categories c ON c.categoryId = t.categoryId
    WHERE t.templateId = ?
  `;

  const values = [templateId];

  if (!isAdmin(req)) {
    sql += " AND t.status = 'published'";
  }

  db.query(sql, values, (error, rows) => {
    if (error) {
      console.error("getTemplate error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Template not found",
      });
    }

    return res.json(rows[0]);
  });
};

// POST /templates
const addTemplate = (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { error, data } = cleanTemplate(req.body, false);

  if (error) {
    return res.status(400).json({ message: error });
  }

  data.status = data.status || "draft";
  data.currency = data.currency || "INR";
  data.createdBy = req.user.userId;

  const columns = Object.keys(data);
  const placeholders = columns.map(() => "?").join(", ");

  db.query(
    `INSERT INTO template (${columns.join(", ")})
     VALUES (${placeholders})`,
    columns.map((column) => data[column]),
    (insertError, result) => {
      if (insertError?.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          message: "The selected category does not exist",
        });
      }

      if (insertError) {
        console.error("addTemplate error:", insertError);

        return res.status(500).json({
          message: "Internal server error",
        });
      }

      return res.status(201).json({
        message: "Template created successfully",
        templateId: String(result.insertId),
      });
    }
  );
};

// PUT /templates/:templateId
const updateTemplate = (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { templateId } = req.params;

  if (!validId(templateId)) {
    return res.status(400).json({
      message: "Invalid template ID",
    });
  }

  const { error, data } = cleanTemplate(req.body, true);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const columns = Object.keys(data);

  if (columns.length === 0) {
    return res.status(400).json({
      message: "No valid fields were provided for update",
    });
  }

  const setClause = columns
    .map((column) => `${column} = ?`)
    .join(", ");

  db.query(
    `UPDATE template
     SET ${setClause}
     WHERE templateId = ?`,
    [...columns.map((column) => data[column]), templateId],
    (updateError, result) => {
      if (updateError?.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          message: "The selected category does not exist",
        });
      }

      if (updateError) {
        console.error("updateTemplate error:", updateError);

        return res.status(500).json({
          message: "Internal server error",
        });
      }

      if (result.affectedRows === 0) {
        // MySQL may report zero for unchanged values. Confirm existence.
        return db.query(
          "SELECT templateId FROM template WHERE templateId = ?",
          [templateId],
          (findError, rows) => {
            if (findError) {
              console.error("updateTemplate existence error:", findError);

              return res.status(500).json({
                message: "Internal server error",
              });
            }

            if (rows.length === 0) {
              return res.status(404).json({
                message: "Template not found",
              });
            }

            return res.json({
              message: "Template updated successfully",
              templateId,
            });
          }
        );
      }

      return res.json({
        message: "Template updated successfully",
        templateId,
      });
    }
  );
};

// DELETE /templates/:templateId
const deleteTemplate = (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { templateId } = req.params;

  if (!validId(templateId)) {
    return res.status(400).json({
      message: "Invalid template ID",
    });
  }

  db.query(
    "DELETE FROM template WHERE templateId = ?",
    [templateId],
    (error, result) => {
      if (error?.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
          message:
            "This template is in use. Archive it instead of deleting it.",
        });
      }

      if (error) {
        console.error("deleteTemplate error:", error);

        return res.status(500).json({
          message: "Internal server error",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Template not found",
        });
      }

      return res.json({
        message: "Template deleted successfully",
        templateId,
      });
    }
  );
};

module.exports = {
  getTemplates,
  getTemplate,
  addTemplate,
  updateTemplate,
  deleteTemplate,
};