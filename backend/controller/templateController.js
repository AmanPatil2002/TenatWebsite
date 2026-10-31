const db = require("../config/db").promise();
const { withTx } = require("../utils/tx");

const ID_PATTERN = /^[1-9]\d{0,19}$/;
const STATUSES = new Set(["draft", "published", "archived"]);
const FIELDS = new Set([
  "categoryId",
  "name",
  "language",
  "shortDescription",
  "description",
  "thumbnailUrl",
  "photos",
  "price",
  "currency",
  "validityDays",
  "status",
]);

const isId = (value) => {
  if (typeof value === "number" && !Number.isSafeInteger(value)) return false;
  if (!ID_PATTERN.test(String(value ?? ""))) return false;
  return BigInt(value) <= 18446744073709551615n;
};

const parseJson = (value, field) => {
  if (value == null || typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    if (field === "photos") return value;
    console.error(`Invalid JSON returned for template ${field}:`, error);
    throw new Error(`Invalid stored template ${field}`);
  }
};

const templateRows = (rows) =>
  rows.map((row) => ({
    ...row,
    photos: parseJson(row.photos, "photos"),
    themes: parseJson(row.themes, "themes") ?? [],
    pages: parseJson(row.pages, "pages") ?? [],
  }));

const normalizeIds = (value, label) => {
  if (!Array.isArray(value)) return { error: `${label} must be an array` };
  const ids = [];
  for (const id of value) {
    if (!isId(id)) return { error: `${label} must contain valid ids` };
    if (!ids.some((existing) => String(existing) === String(id))) ids.push(String(id));
  }
  return { ids };
};

const toBool01 = (value) => {
  if (value === true || value === 1 || value === "1") return 1;
  if (value === false || value === 0 || value === "0") return 0;
  return null;
};

const normalizePageLinks = (body) => {
  // Preferred format: pages: [{ pagesId, isDefault, sortOrder }]
  if (body.pages !== undefined) {
    if (!Array.isArray(body.pages)) return { error: "pages must be an array" };
    const seen = new Set();
    const pages = [];
    for (let index = 0; index < body.pages.length; index += 1) {
      const item = body.pages[index];
      if (!item || !isId(item.pagesId)) {
        return { error: "Each pages entry must include a valid pagesId" };
      }
      const id = String(item.pagesId);
      if (seen.has(id)) return { error: "pages cannot contain duplicate ids" };
      seen.add(id);

      const sortOrder = item.sortOrder === undefined ? index : Number(item.sortOrder);
      if (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > 4294967295) {
        return { error: "Page sortOrder must be a nonnegative integer" };
      }

      // Default is 0 (extra page) — safer than silently making it default.
      const isDefault = item.isDefault === undefined ? 0 : toBool01(item.isDefault);
      if (isDefault === null) {
        return { error: "Page isDefault must be a boolean" };
      }

      pages.push({ pagesId: id, isDefault, sortOrder });
    }
    return { pages };
  }

  // Legacy format: pageIds[] (default) + additionalPageIds[] (extra)
  const pageIds = body.pageIds === undefined ? null : normalizeIds(body.pageIds, "pageIds");
  if (pageIds?.error) return pageIds;
  const additionalIds =
    body.additionalPageIds === undefined
      ? { ids: [] }
      : normalizeIds(body.additionalPageIds, "additionalPageIds");
  if (additionalIds.error) return additionalIds;
  if (pageIds === null && body.additionalPageIds === undefined) return { pages: null };

  const pages = [
    ...(pageIds?.ids ?? []).map((pagesId, sortOrder) => ({
      pagesId,
      isDefault: 1,
      sortOrder,
    })),
    ...additionalIds.ids.map((pagesId, index) => ({
      pagesId,
      isDefault: 0,
      sortOrder: (pageIds?.ids.length ?? 0) + index,
    })),
  ];
  if (new Set(pages.map((page) => page.pagesId)).size !== pages.length) {
    return { error: "A page cannot be both default and additional" };
  }
  return { pages };
};

const cleanTemplate = (body, partial = false) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A template object is required" };
  }
  const data = {};
  const required = ["categoryId", "name", "price"];
  if (!partial) {
    for (const key of required) {
      if (body[key] === undefined) return { error: `${key} is required` };
    }
  }

  for (const key of Object.keys(body)) {
    if (key === "themeIds" || key === "defaultThemeId" || key === "pages" ||
        key === "pageIds" || key === "additionalPageIds") continue;
    if (!FIELDS.has(key)) return { error: `Unknown template field: ${key}` };
  }

  if (body.categoryId !== undefined) {
    if (!isId(body.categoryId)) return { error: "Invalid categoryId" };
    data.categoryId = String(body.categoryId);
  }
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 150) {
      return { error: "Name must be nonempty and at most 150 characters" };
    }
    data.name = body.name.trim();
  }
  for (const [key, maxLength] of [
    ["language", 65535],
    ["shortDescription", 300],
    ["description", 65535],
    ["thumbnailUrl", 500],
  ]) {
    if (body[key] === undefined) continue;
    if (body[key] !== null && (typeof body[key] !== "string" || body[key].length > maxLength)) {
      return { error: `${key} must be a string of at most ${maxLength} characters` };
    }
    data[key] = typeof body[key] === "string" ? body[key].trim() || null : null;
  }
  if (body.photos !== undefined) {
    if (Array.isArray(body.photos)) {
      if (body.photos.some((photo) => typeof photo !== "string" || photo.length > 500)) {
        return { error: "photos must contain strings of at most 500 characters" };
      }
      data.photos = JSON.stringify(body.photos);
    } else if (typeof body.photos === "string" && body.photos.length <= 65535) {
      data.photos = body.photos.trim() || null;
    } else if (body.photos === null) {
      data.photos = null;
    } else {
      return { error: "photos must be a string or an array of URLs" };
    }
  }
  if (body.price !== undefined) {
    const price = String(body.price).trim();
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(price) || Number(price) <= 0) {
      return { error: "Price must be greater than 0 and have at most 2 decimal places" };
    }
    data.price = Number(price).toFixed(2);
  }
  if (body.currency !== undefined) {
    if (typeof body.currency !== "string" || !/^[A-Za-z]{3}$/.test(body.currency.trim())) {
      return { error: "Currency must be a three-letter code" };
    }
    data.currency = body.currency.trim().toUpperCase();
  }
  if (body.validityDays !== undefined) {
    const validityDays = Number(body.validityDays);
    if (!Number.isInteger(validityDays) || validityDays < 1 || validityDays > 4294967295) {
      return { error: "validityDays must be a positive integer" };
    }
    data.validityDays = validityDays;
  }
  if (body.status !== undefined) {
    if (!STATUSES.has(body.status)) return { error: "Invalid template status" };
    data.status = body.status;
  }

  let themes = null;
  if (body.themeIds !== undefined) {
    const normalized = normalizeIds(body.themeIds, "themeIds");
    if (normalized.error) return normalized;
    themes = normalized.ids;
    if (body.defaultThemeId !== undefined && !themes.some((id) => id === String(body.defaultThemeId))) {
      return { error: "defaultThemeId must be included in themeIds" };
    }
  } else if (body.defaultThemeId !== undefined) {
    if (!isId(body.defaultThemeId)) return { error: "Invalid defaultThemeId" };
    themes = [String(body.defaultThemeId)];
  }

  const pageLinks = normalizePageLinks(body);
  if (pageLinks.error) return pageLinks;
  const pages = pageLinks.pages;
  const defaultThemeId =
    themes && themes.length
      ? String(body.defaultThemeId ?? themes[0])
      : null;

  return { data, links: { themes, defaultThemeId, pages } };
};

const syncLinks = async (connection, templateId, links, categoryId) => {
  if (links.pages !== null) {
    if (links.pages.length) {
      const ids = links.pages.map((page) => page.pagesId);
      const [rows] = await connection.query(
        "SELECT pagesId, categoryId FROM pages WHERE pagesId IN (?)",
        [ids],
      );
      if (
        rows.length !== ids.length ||
        rows.some((row) => String(row.categoryId) !== String(categoryId))
      ) {
        const error = new Error("One or more pages do not belong to this category");
        error.status = 400;
        throw error;
      }
    }
    await connection.query("DELETE FROM templatepages WHERE templateId = ?", [templateId]);
    if (links.pages.length) {
      await connection.query(
        "INSERT INTO templatepages (templateId, pagesId, isDefault, sortOrder) VALUES ?",
        [links.pages.map((page) => [templateId, page.pagesId, page.isDefault, page.sortOrder])],
      );
    }
  }

  if (links.themes !== null) {
    if (links.themes.length) {
      const [rows] = await connection.query(
        "SELECT themeId FROM theme WHERE themeId IN (?)",
        [links.themes],
      );
      if (rows.length !== links.themes.length) {
        const error = new Error("One or more themes do not exist");
        error.status = 400;
        throw error;
      }
    }
    await connection.query("DELETE FROM templatetheme WHERE templateId = ?", [templateId]);
    if (links.themes.length) {
      await connection.query(
        "INSERT INTO templatetheme (templateId, themeId, isDefault) VALUES ?",
        [links.themes.map((themeId) => [templateId, themeId, themeId === links.defaultThemeId ? 1 : 0])],
      );
    }
  }
};

const assertPublishReady = async (connection, templateId) => {
  const [[readiness]] = await connection.query(
    `SELECT
       EXISTS(SELECT 1 FROM templatetheme WHERE templateId = ? AND isDefault = 1) AS hasDefaultTheme,
       EXISTS(SELECT 1 FROM templatepages WHERE templateId = ? AND isDefault = 1) AS hasDefaultPage`,
    [templateId, templateId],
  );
  if (!readiness.hasDefaultTheme) {
    const error = new Error("Published templates need exactly one default theme");
    error.status = 400;
    throw error;
  }
  if (!readiness.hasDefaultPage) {
    const error = new Error("Published templates need at least one default page");
    error.status = 400;
    throw error;
  }
};

const listTemplates = (admin) => async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT tf.*, c.name AS categoryName
         FROM templatefull tf
         LEFT JOIN categories c ON c.categoryId = tf.categoryId
        ${admin ? "" : "WHERE tf.status = 'published'"}
        ORDER BY tf.createdAt DESC`,
    );
    return res.json(templateRows(rows));
  } catch (error) {
    console.error("List templates error:", error);
    return res.status(500).json({ message: "Failed to fetch templates" });
  }
};

const getOne = (admin) => async (req, res) => {
  if (!isId(req.params.templateId)) return res.status(400).json({ message: "Invalid templateId" });
  try {
    const [rows] = await db.query(
      `SELECT tf.*, c.name AS categoryName
         FROM templatefull tf
         LEFT JOIN categories c ON c.categoryId = tf.categoryId
        WHERE tf.templateId = ? ${admin ? "" : "AND tf.status = 'published'"} LIMIT 1`,
      [req.params.templateId],
    );
    if (!rows.length) return res.status(404).json({ message: "Template not found" });
    return res.json(templateRows(rows)[0]);
  } catch (error) {
    console.error("Get template error:", error);
    return res.status(500).json({ message: "Failed to fetch template" });
  }
};

const getTemplates = listTemplates(false);
const getAllTemplates = listTemplates(true);
const getTemplate = getOne(false);
const getTemplateAdmin = getOne(true);

const addTemplate = async (req, res) => {
  const { data, links, error } = cleanTemplate(req.body);
  if (error) return res.status(400).json({ message: error });
  const createdBy = req.user?.userId;
  if (!createdBy) return res.status(401).json({ message: "Unable to identify the admin user" });

  try {
    const templateId = await withTx(async (connection) => {
      const [result] = await connection.query(
        `INSERT INTO template
          (categoryId, name, language, shortDescription, description, thumbnailUrl,
           photos, price, currency, validityDays, status, createdBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.categoryId,
          data.name,
          data.language ?? null,
          data.shortDescription ?? null,
          data.description ?? null,
          data.thumbnailUrl ?? null,
          data.photos ?? null,
          data.price,
          data.currency ?? "INR",
          data.validityDays ?? 365,
          data.status ?? "draft",
          createdBy,
        ],
      );
      await syncLinks(connection, result.insertId, links, data.categoryId);
      if ((data.status ?? "draft") === "published") {
        await assertPublishReady(connection, result.insertId);
      }
      return result.insertId;
    });
    return res.status(201).json({ message: "Template created successfully", templateId });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Template name or link already exists" });
    if (error.code === "ER_NO_REFERENCED_ROW_2") return res.status(400).json({ message: "Invalid category, theme, page or creator" });
    console.error("Create template error:", error);
    return res.status(500).json({ message: "Failed to create template" });
  }
};

const updateTemplate = async (req, res) => {
  if (!isId(req.params.templateId)) return res.status(400).json({ message: "Invalid templateId" });
  const { data, links, error } = cleanTemplate(req.body, true);
  if (error) return res.status(400).json({ message: error });
  const fields = Object.keys(data);
  if (!fields.length && links.themes === null && links.pages === null) {
    return res.status(400).json({ message: "No fields supplied for update" });
  }

  try {
    await withTx(async (connection) => {
      const [[current]] = await connection.query(
        "SELECT categoryId, status FROM template WHERE templateId = ? FOR UPDATE",
        [req.params.templateId],
      );
      if (!current) {
        const notFound = new Error("Template not found");
        notFound.status = 404;
        throw notFound;
      }
      const categoryId = data.categoryId ?? current.categoryId;
      if (fields.length) {
        await connection.query(
          `UPDATE template SET ${fields.map((field) => `\`${field}\` = ?`).join(", ")},
             updatedAt = CURRENT_TIMESTAMP WHERE templateId = ?`,
          [...fields.map((field) => data[field]), req.params.templateId],
        );
      }
      await syncLinks(connection, req.params.templateId, links, categoryId);
      if (data.categoryId !== undefined && links.pages === null) {
        const [[mismatchedPages]] = await connection.query(
          `SELECT COUNT(*) AS count
             FROM templatepages tp
             JOIN pages p ON p.pagesId = tp.pagesId
            WHERE tp.templateId = ? AND p.categoryId <> ?`,
          [req.params.templateId, categoryId],
        );
        if (Number(mismatchedPages.count) > 0) {
          const categoryError = new Error(
            "The template category cannot change while it has pages from another category",
          );
          categoryError.status = 400;
          throw categoryError;
        }
      }
      if ((data.status ?? current.status) === "published") {
        await assertPublishReady(connection, req.params.templateId);
      }
    });
    return res.json({ message: "Template updated successfully", templateId: req.params.templateId });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Template name or link already exists" });
    if (error.code === "ER_NO_REFERENCED_ROW_2") return res.status(400).json({ message: "Invalid category, theme or page" });
    if (error.code === "ER_ROW_IS_REFERENCED_2") return res.status(409).json({ message: "A page or theme in this template is used by a purchase and cannot be removed" });
    console.error("Update template error:", error);
    return res.status(500).json({ message: "Failed to update template" });
  }
};

const reorderTemplatePages = async (req, res) => {
  const { templateId } = req.params;
  const { pageIds } = req.body ?? {};
  if (!isId(templateId)) {
    return res.status(400).json({ message: "Invalid templateId" });
  }
  if (
    !Array.isArray(pageIds) ||
    pageIds.length > 1000 ||
    pageIds.some((id) => !isId(id)) ||
    new Set(pageIds.map(String)).size !== pageIds.length
  ) {
    return res.status(400).json({ message: "Provide a valid ordered list of page ids" });
  }

  try {
    await withTx(async (connection) => {
      const [[template]] = await connection.query(
        "SELECT templateId FROM template WHERE templateId = ? FOR UPDATE",
        [templateId],
      );
      if (!template) {
        const notFound = new Error("Template not found");
        notFound.status = 404;
        throw notFound;
      }

      const [templatePages] = await connection.query(
        "SELECT pagesId FROM templatepages WHERE templateId = ? ORDER BY pagesId FOR UPDATE",
        [templateId],
      );
      const existingIds = templatePages.map((page) => String(page.pagesId)).sort();
      const requestedIds = pageIds.map(String).sort();
      if (
        existingIds.length !== requestedIds.length ||
        existingIds.some((id, index) => id !== requestedIds[index])
      ) {
        const invalidOrder = new Error("The template page list changed. Reload before reordering.");
        invalidOrder.status = 400;
        throw invalidOrder;
      }

      for (let sortOrder = 0; sortOrder < pageIds.length; sortOrder += 1) {
        await connection.query(
          "UPDATE templatepages SET sortOrder = ? WHERE templateId = ? AND pagesId = ?",
          [sortOrder, templateId, pageIds[sortOrder]],
        );
      }
    });
    return res.json({ message: "Template page order updated successfully" });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error("Reorder template pages error:", error);
    return res.status(500).json({ message: "Failed to reorder template pages" });
  }
};

const deleteTemplate = async (req, res) => {
  if (!isId(req.params.templateId)) return res.status(400).json({ message: "Invalid templateId" });
  try {
    const [result] = await db.query("DELETE FROM template WHERE templateId = ?", [req.params.templateId]);
    if (!result.affectedRows) return res.status(404).json({ message: "Template not found" });
    return res.json({ message: "Template deleted successfully" });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({ message: "This template has purchases and cannot be deleted. Archive it instead." });
    }
    console.error("Delete template error:", error);
    return res.status(500).json({ message: "Failed to delete template" });
  }
};

module.exports = {
  getTemplates,
  getAllTemplates,
  getTemplate,
  getTemplateAdmin,
  addTemplate,
  updateTemplate,
  reorderTemplatePages,
  deleteTemplate,
};