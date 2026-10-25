const db = require("../config/db");

// Total BIGINT UNSIGNED guard — prevents 30-digit "ids" from reaching MySQL.
const validId = (id) => {
  if (typeof id !== "string") return false;
  if (!/^[1-9]\d*$/.test(id)) return false;
  try {
    return BigInt(id) <= 18446744073709551615n;
  } catch {
    return false;
  }
};

const isPublishedValue = (value) =>
  value === true || value === false || value === 0 || value === 1;

// Serialize JSON content safely. Returns:
//   undefined  -> invalid (not an object / not null / circular)
//   null       -> explicit "no content"
//   string     -> JSON
const serializeContent = (content) => {
  if (content === undefined) return undefined;
  if (content === null) return null;
  if (typeof content !== "object") return undefined;
  try {
    return JSON.stringify(content);
  } catch {
    return undefined;
  }
};

// Only these tables may be passed to the shared UPDATE/DELETE helpers.
const ALLOWED_TABLES = new Set(["sitePages", "subPages"]);

// ---------------------------------------------------------------------------

const listPages = (req, res) => {
  const { siteId } = req.params;
  if (!validId(siteId)) {
    return res.status(400).json({ message: "Invalid site ID" });
  }

  db.query(
    `SELECT id, NULL AS parentId, 'page' AS recordType, title, slug, pageType,
            content, pageLink, isPublished, createdAt, updatedAt
       FROM sitePages WHERE siteId = ?
     UNION ALL
     SELECT sp.id, sp.pageId AS parentId, 'subPage' AS recordType, sp.title,
            sp.slug, sp.pageType, sp.content, sp.pageLink, sp.isPublished,
            sp.createdAt, sp.updatedAt
       FROM subPages sp WHERE sp.siteId = ?
     ORDER BY parentId, id`,
    [siteId, siteId],
    (err, rows) => {
      if (err) {
        console.error("listPages error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      res.json(rows);
    }
  );
};

// ---------------------------------------------------------------------------

const validatePage = (body, partial = false) => {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid request body" };
  }
  const data = {};
  const has = (key) => body[key] !== undefined;

  if (!partial || has("title")) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 150) {
      return { error: "Title must be 1–150 characters" };
    }
    data.title = title;
  }

  if (!partial || has("slug")) {
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (
      !slug ||
      slug.length > 150 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
      return {
        error:
          "Slug must use lowercase letters, numbers and hyphens (max 150 characters)",
      };
    }
    data.slug = slug;
  }

  if (!partial || has("pageType")) {
    const pageType =
      typeof body.pageType === "string" ? body.pageType.trim() : "";
    if (!pageType || pageType.length > 60) {
      return { error: "Page type must be 1–60 characters" };
    }
    data.pageType = pageType;
  }

  if (has("content")) {
    const content = serializeContent(body.content);
    if (content === undefined) {
      return { error: "Content must be a JSON object, array, or null" };
    }
    data.content = content;
  }

  if (has("pageLink")) {
    if (body.pageLink !== null && typeof body.pageLink !== "string") {
      return { error: "Page link must be a string or null" };
    }
    const link = body.pageLink?.trim() || null;
    if (link && link.length > 500) {
      return { error: "Page link must be 500 characters or fewer" };
    }
    data.pageLink = link;
  }

  if (has("isPublished")) {
    if (!isPublishedValue(body.isPublished)) {
      return { error: "isPublished must be a boolean" };
    }
    data.isPublished = body.isPublished ? 1 : 0;
  }

  return { data };
};

// ---------------------------------------------------------------------------

const createPage = (req, res) => {
  const { siteId } = req.params;
  if (!validId(siteId)) {
    return res.status(400).json({ message: "Invalid site ID" });
  }

  const { error, data } = validatePage(req.body);
  if (error) return res.status(400).json({ message: error });

  db.query(
    `INSERT INTO sitePages (siteId, adminId, title, slug, pageType, content, pageLink, isPublished)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      siteId,
      req.siteAdmin.adminId,
      data.title,
      data.slug,
      data.pageType,
      data.content ?? null,
      data.pageLink ?? null,
      data.isPublished ?? 1,
    ],
    (err, result) => {
      if (err?.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Slug already exists" });
      }
      if (err?.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(404).json({ message: "Site not found" });
      }
      if (err) {
        console.error("createPage error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      res.status(201).json({ id: result.insertId, recordType: "page" });
    }
  );
};

// ---------------------------------------------------------------------------

const createSubPage = (req, res) => {
  const { siteId } = req.params;
  if (!validId(siteId)) {
    return res.status(400).json({ message: "Invalid site ID" });
  }

  const { parentId } = req.body;
  if (!validId(String(parentId))) {
    return res.status(400).json({ message: "A valid parentId is required" });
  }

  const { error, data } = validatePage(req.body);
  if (error) return res.status(400).json({ message: error });

  // INSERT ... SELECT guarantees the parent page exists AND belongs to this
  // site, atomically — no TOCTOU race. If the parent is missing, zero rows are
  // inserted and we return 404.
  db.query(
    `INSERT INTO subPages
       (siteId, adminId, pageId, title, slug, pageType, content, pageLink, isPublished)
     SELECT ?, ?, p.id, ?, ?, ?, ?, ?, ?
       FROM sitePages p WHERE p.id = ? AND p.siteId = ?`,
    [
      siteId,
      req.siteAdmin.adminId,
      data.title,
      data.slug,
      data.pageType,
      data.content ?? null,
      data.pageLink ?? null,
      data.isPublished ?? 1,
      parentId,
      siteId,
    ],
    (err, result) => {
      if (err?.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ message: "Slug already exists under this page" });
      }
      if (err?.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(404).json({ message: "Site not found" });
      }
      if (err) {
        console.error("createSubPage error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!result.affectedRows) {
        return res.status(404).json({ message: "Parent page not found" });
      }
      res
        .status(201)
        .json({ id: result.insertId, recordType: "subPage", parentId });
    }
  );
};

// ---------------------------------------------------------------------------

// Shared UPDATE. `table` must be one of ALLOWED_TABLES.
// Checks existence first so:
//   (a) submitting unchanged values doesn't return a false 404, and
//   (b) "not found" is distinct from "no changes".
const updateRecord = (table, req, res) => {
  if (!ALLOWED_TABLES.has(table)) {
    return res.status(500).json({ message: "Internal server error" });
  }

  const { siteId, pageId } = req.params;
  if (!validId(siteId) || !validId(pageId)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const { error, data } = validatePage(req.body, true);
  if (error) return res.status(400).json({ message: error });

  const columns = Object.keys(data);
  if (!columns.length) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  db.query(
    `SELECT 1 FROM ${table} WHERE id = ? AND siteId = ? LIMIT 1`,
    [pageId, siteId],
    (findErr, found) => {
      if (findErr) {
        console.error(`updateRecord(${table}) select error:`, findErr);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (found.length === 0) {
        return res.status(404).json({ message: "Page not found" });
      }

      db.query(
        `UPDATE ${table} SET ${columns
          .map((column) => `${column} = ?`)
          .join(", ")}
          WHERE id = ? AND siteId = ?`,
        [...columns.map((column) => data[column]), pageId, siteId],
        (err) => {
          if (err?.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Slug already exists" });
          }
          if (err?.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(404).json({ message: "Site not found" });
          }
          if (err) {
            console.error(`updateRecord(${table}) update error:`, err);
            return res.status(500).json({ message: "Internal server error" });
          }
          res.json({ message: "Page updated" });
        }
      );
    }
  );
};

const updatePage = (req, res) => updateRecord("sitePages", req, res);
const updateSubPage = (req, res) => updateRecord("subPages", req, res);

// ---------------------------------------------------------------------------

const deleteRecord = (table, req, res) => {
  if (!ALLOWED_TABLES.has(table)) {
    return res.status(500).json({ message: "Internal server error" });
  }

  const { siteId, pageId } = req.params;
  if (!validId(siteId) || !validId(pageId)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  db.query(
    `DELETE FROM ${table} WHERE id = ? AND siteId = ?`,
    [pageId, siteId],
    (err, result) => {
      if (err?.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
          message:
            "Page has sub-pages. Delete them first or enable ON DELETE CASCADE.",
        });
      }
      if (err) {
        console.error(`deleteRecord(${table}) error:`, err);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!result.affectedRows) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json({ message: "Page deleted" });
    }
  );
};

const deletePage = (req, res) => deleteRecord("sitePages", req, res);
const deleteSubPage = (req, res) => deleteRecord("subPages", req, res);

module.exports = {
  listPages,
  createPage,
  createSubPage,
  updatePage,
  updateSubPage,
  deletePage,
  deleteSubPage,
};