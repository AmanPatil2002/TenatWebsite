
const db = require("../config/db");

const STATUSES = ["draft", "published", "archived"];

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
];

const hasOwn = (obj, key) =>
  Object.prototype.hasOwnProperty.call(obj, key);

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const isValidHttpUrl = (value) => {
  try {
    const url = new URL(value);

    return (
      ["http:", "https:"].includes(url.protocol) &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
};

const cleanTemplate = (body, partial = false) => {
  if (!isPlainObject(body)) {
    return { error: "Request body must be an object" };
  }

  const data = {};
  const has = (field) => hasOwn(body, field);

  // Category
  if (!partial || has("categoryId")) {
    const categoryId = Number(body.categoryId);

    if (
      body.categoryId === null ||
      body.categoryId === "" ||
      !Number.isInteger(categoryId) ||
      categoryId <= 0
    ) {
      return { error: "A valid categoryId is required" };
    }

    data.categoryId = categoryId;
  }

  // Template name
  if (!partial || has("name")) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return { error: "Template name is required" };
    }

    if (body.name.trim().length > 150) {
      return {
        error: "Template name must be 150 characters or fewer",
      };
    }

    data.name = body.name.trim();
  }

  // Regular text fields and the single thumbnail URL
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
      field === "thumbnailUrl" &&
      !isValidHttpUrl(value)
    ) {
      return {
        error: "thumbnailUrl must be a valid HTTP or HTTPS URL",
      };
    }

    data[field] = value;
  }

  // Multiple photos: accept an array or a JSON-encoded array.
  // Save the normalized array as JSON text in MySQL.
  if (has("photos")) {
    const raw = body.photos;

    if (raw === null || raw === "") {
      data.photos = null;
    } else {
      let photoUrls = raw;

      if (typeof photoUrls === "string") {
        try {
          photoUrls = JSON.parse(photoUrls);
        } catch {
          // Also accept one URL as a string for compatibility.
          photoUrls = [photoUrls];
        }
      }

      if (!Array.isArray(photoUrls)) {
        return {
          error: "photos must be an array of HTTP or HTTPS URLs",
        };
      }

      const normalizedUrls = [];

      for (const photo of photoUrls) {
        if (typeof photo !== "string" || !photo.trim()) {
          return {
            error: "Each photo must be a valid HTTP or HTTPS URL",
          };
        }

        const url = photo.trim();

        if (!isValidHttpUrl(url)) {
          return {
            error: "Each photo must be a valid HTTP or HTTPS URL",
          };
        }

        normalizedUrls.push(url);
      }

      data.photos = normalizedUrls.length
        ? JSON.stringify(normalizedUrls)
        : null;
    }
  }

  // Price
  if (!partial || has("price")) {
    const price = Number(body.price);

    if (
      body.price === null ||
      body.price === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return { error: "Price must be a non-negative number" };
    }

    data.price = price;
  }

  // Currency
  if (!partial || has("currency")) {
    const currency =
      typeof body.currency === "string"
        ? body.currency.trim().toUpperCase()
        : "";

    if (!/^[A-Z]{3}$/.test(currency)) {
      return {
        error: "Currency must be a valid three-letter code",
      };
    }

    data.currency = currency;
  }

  // Validity
  if (!partial || has("validityDays")) {
    const validityDays = Number(body.validityDays);

    if (
      body.validityDays === null ||
      body.validityDays === "" ||
      !Number.isInteger(validityDays) ||
      validityDays < 1
    ) {
      return {
        error: "validityDays must be a positive integer",
      };
    }

    data.validityDays = validityDays;
  }

  // Status
  if (!partial || has("status")) {
    const status = body.status;

    if (!STATUSES.includes(status)) {
      return {
        error: `Status must be one of: ${STATUSES.join(", ")}`,
      };
    }

    data.status = status;
  }

  return { data };
};

// GET /templates
const getTemplates = async (req, res) => {
  try {
    const sql = `
      SELECT ${SELECT_COLUMNS}
      FROM templates t
      LEFT JOIN categories c ON c.categoryId = t.categoryId
      ORDER BY t.createdAt DESC
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error("Get templates error:", err);
        return res.status(500).json({
          message: "Failed to fetch templates",
        });
      }

      return res.status(200).json(results);
    });
  } catch (error) {
    console.error("Get templates exception:", error);
    return res.status(500).json({
      message: "Server error while fetching templates",
    });
  }
};

// GET /templates/:templateId
const getTemplate = async (req, res) => {
  const templateId = Number(req.params.templateId);

  if (!Number.isInteger(templateId) || templateId <= 0) {
    return res.status(400).json({
      message: "Invalid templateId",
    });
  }

  const sql = `
    SELECT ${SELECT_COLUMNS}
    FROM templates t
    LEFT JOIN categories c ON c.categoryId = t.categoryId
    WHERE t.templateId = ?
    LIMIT 1
  `;

  db.query(sql, [templateId], (err, results) => {
    if (err) {
      console.error("Get template error:", err);
      return res.status(500).json({
        message: "Failed to fetch template",
      });
    }

    if (!results.length) {
      return res.status(404).json({
        message: "Template not found",
      });
    }

    return res.status(200).json(results[0]);
  });
};

// POST /templates
const addTemplate = async (req, res) => {
  const { data, error } = cleanTemplate(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const sql = `
    INSERT INTO templates (
      categoryId,
      name,
      language,
      shortDescription,
      description,
      thumbnailUrl,
      photos,
      price,
      currency,
      validityDays,
      status,
      createdBy
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.categoryId,
    data.name,
    data.language ?? null,
    data.shortDescription ?? null,
    data.description ?? null,
    data.thumbnailUrl ?? null,
    data.photos ?? null,
    data.price,
    data.currency,
    data.validityDays,
    data.status,
    req.user?.id ?? req.user?.userId ?? null,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Add template error:", err);

      if (err.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          message: "The selected category does not exist",
        });
      }

      return res.status(500).json({
        message: "Failed to create template",
      });
    }

    return res.status(201).json({
      message: "Template created successfully",
      templateId: result.insertId,
    });
  });
};

// PUT /templates/:templateId
const updateTemplate = async (req, res) => {
  const templateId = Number(req.params.templateId);

  if (!Number.isInteger(templateId) || templateId <= 0) {
    return res.status(400).json({
      message: "Invalid templateId",
    });
  }

  const { data, error } = cleanTemplate(req.body, true);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const fields = Object.keys(data);

  if (!fields.length) {
    return res.status(400).json({
      message: "No valid fields supplied for update",
    });
  }

  const values = fields.map((field) => data[field]);
  const setClause = fields
    .map((field) => `\`${field}\` = ?`)
    .join(", ");

  const sql = `
    UPDATE templates
    SET ${setClause}, updatedAt = CURRENT_TIMESTAMP
    WHERE templateId = ?
  `;

  values.push(templateId);

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Update template error:", err);
      return res.status(500).json({
        message: "Failed to update template",
      });
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Template not found",
      });
    }

    return res.status(200).json({
      message: "Template updated successfully",
      templateId,
    });
  });
};

// DELETE /templates/:templateId
const deleteTemplate = async (req, res) => {
  const templateId = Number(req.params.templateId);

  if (!Number.isInteger(templateId) || templateId <= 0) {
    return res.status(400).json({
      message: "Invalid templateId",
    });
  }

  db.query(
    "DELETE FROM templates WHERE templateId = ?",
    [templateId],
    (err, result) => {
      if (err) {
        console.error("Delete template error:", err);
        return res.status(500).json({
          message: "Failed to delete template",
        });
      }

      if (!result.affectedRows) {
        return res.status(404).json({
          message: "Template not found",
        });
      }

      return res.status(200).json({
        message: "Template deleted successfully",
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
