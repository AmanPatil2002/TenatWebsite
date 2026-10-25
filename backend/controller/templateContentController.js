const db = require("../config/db");

const TYPES = ["default", "dark", "custom"];
const LOCATIONS = ["header", "footer", "sidebar"];
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const validId = (value) =>
  /^[1-9]\d*$/.test(String(value)) && BigInt(value) <= 18446744073709551615n;

const serializeJson = (value) => {
  if (value === null || isObject(value) || Array.isArray(value)) {
    try {
      return value === null ? null : JSON.stringify(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const listTemplatePages = (req, res) => {
  const { templateId } = req.params;
  db.query(
    `SELECT id, templateId, parentId, title, slug, pageType, content
       FROM templatePages WHERE templateId = ? ORDER BY parentId, id`,
    [templateId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

const createTemplatePage = async (req, res) => {
  const { templateId } = req.params;
  if (!isObject(req.body)) return res.status(400).json({ message: "Invalid request body" });
  const { parentId = null } = req.body;
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const slug = typeof req.body.slug === "string" ? req.body.slug.trim() : "";
  const pageType =
    typeof req.body.pageType === "string" ? req.body.pageType.trim() : "custom";
  const content = serializeJson(req.body.content === undefined ? null : req.body.content);

  if (!title || title.length > 150) {
    return res.status(400).json({ message: "Title must be 1–150 characters" });
  }
  if (!slug || slug.length > 150 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return res.status(400).json({ message: "Invalid page slug" });
  }
  if (!pageType || pageType.length > 60) {
    return res.status(400).json({ message: "Page type must be 1–60 characters" });
  }
  if (content === undefined) {
    return res.status(400).json({ message: "Content must be a JSON object, array, or null" });
  }
  if (parentId !== null && !validId(parentId)) {
    return res.status(400).json({ message: "Invalid parent page ID" });
  }

  try {
    if (parentId !== null) {
      const [parents] = await db.promise().execute(
        "SELECT id FROM templatePages WHERE id = ? AND templateId = ? AND parentId IS NULL",
        [parentId, templateId]
      );
      if (!parents.length) return res.status(404).json({ message: "Parent page not found" });
    }
    const [result] = await db.promise().execute(
      `INSERT INTO templatePages (templateId, parentId, title, slug, pageType, content)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [templateId, parentId, title, slug, pageType, content]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Slug already exists under this parent" });
    }
    console.error("createTemplatePage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateTemplatePage = async (req, res) => {
  const { templateId, pageId } = req.params;
  if (!isObject(req.body)) return res.status(400).json({ message: "Invalid request body" });
  const fields = [];
  const values = [];
  const { title, slug, pageType, content, parentId } = req.body;

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim() || title.trim().length > 150) {
      return res.status(400).json({ message: "Title must be 1–150 characters" });
    }
    fields.push("title = ?");
    values.push(title.trim());
  }
  if (slug !== undefined) {
    if (typeof slug !== "string" || slug.length > 150 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return res.status(400).json({ message: "Invalid page slug" });
    }
    fields.push("slug = ?");
    values.push(slug);
  }
  if (pageType !== undefined) {
    if (typeof pageType !== "string" || !pageType.trim() || pageType.trim().length > 60) {
      return res.status(400).json({ message: "Page type must be 1–60 characters" });
    }
    fields.push("pageType = ?");
    values.push(pageType.trim());
  }
  if (content !== undefined) {
    const json = serializeJson(content);
    if (json === undefined) return res.status(400).json({ message: "Invalid page content" });
    fields.push("content = ?");
    values.push(json);
  }
  if (parentId !== undefined) {
    if (parentId !== null && !validId(parentId)) {
      return res.status(400).json({ message: "Invalid parent page ID" });
    }
    fields.push("parentId = ?");
    values.push(parentId);
  }
  if (!fields.length) return res.status(400).json({ message: "Nothing to update" });

  try {
    if (parentId != null) {
      const [parents] = await db.promise().execute(
        `SELECT id FROM templatePages
          WHERE id = ? AND templateId = ? AND parentId IS NULL`,
        [parentId, templateId]
      );
      if (!parents.length || String(parentId) === String(pageId)) {
        return res.status(400).json({ message: "Parent must be a different top-level template page" });
      }
      const [children] = await db.promise().execute(
        "SELECT id FROM templatePages WHERE parentId = ? LIMIT 1",
        [pageId]
      );
      if (children.length) {
        return res.status(400).json({ message: "A page with subpages cannot become a subpage" });
      }
    }
    const [result] = await db.promise().execute(
      `UPDATE templatePages SET ${fields.join(", ")}
        WHERE id = ? AND templateId = ?`,
      [...values, pageId, templateId]
    );
    if (!result.affectedRows) {
      const [rows] = await db.promise().execute(
        "SELECT id FROM templatePages WHERE id = ? AND templateId = ?",
        [pageId, templateId]
      );
      if (!rows.length) return res.status(404).json({ message: "Template page not found" });
    }
    res.json({ message: "Template page updated" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Slug already exists under this parent" });
    }
    console.error("updateTemplatePage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteTemplatePage = (req, res) => {
  db.query(
    "DELETE FROM templatePages WHERE id = ? AND templateId = ?",
    [req.params.pageId, req.params.templateId],
    (err, result) => {
      if (err) {
        console.error("deleteTemplatePage error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!result.affectedRows) return res.status(404).json({ message: "Template page not found" });
      res.json({ message: "Template page deleted" });
    }
  );
};

const listTemplateThemes = (req, res) => {
  db.query(
    `SELECT id, templateId, name, settings, type, isDefault
       FROM templateThemes WHERE templateId = ? ORDER BY id`,
    [req.params.templateId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

const cleanTheme = (body, partial = false) => {
  if (!isObject(body)) return { error: "Invalid request body" };
  const data = {};
  if (!partial || body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 100) {
      return { error: "Theme name must be 1–100 characters" };
    }
    data.name = body.name.trim();
  }
  if (!partial || body.settings !== undefined) {
    const settings = serializeJson(body.settings);
    if (settings === undefined || !isObject(body.settings)) {
      return { error: "Settings must be a JSON object" };
    }
    data.settings = settings;
  }
  if (body.type !== undefined) {
    if (!TYPES.includes(body.type)) return { error: "Theme type must be default, dark, or custom" };
    data.type = body.type;
  }
  if (body.isDefault !== undefined) {
    if (![true, false, 0, 1].includes(body.isDefault)) {
      return { error: "isDefault must be a boolean" };
    }
    data.isDefault = body.isDefault ? 1 : 0;
  }
  return { data };
};

const createTemplateTheme = async (req, res) => {
  const { templateId } = req.params;
  const { error, data } = cleanTheme(req.body);
  if (error) return res.status(400).json({ message: error });
  data.type = data.type || "default";
  data.isDefault = data.isDefault || 0;

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    const [templates] = await connection.execute(
      "SELECT templateId FROM template WHERE templateId = ? FOR UPDATE",
      [templateId]
    );
    if (!templates.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Template not found" });
    }
    if (data.isDefault) {
      await connection.execute(
        "UPDATE templateThemes SET isDefault = 0 WHERE templateId = ?",
        [templateId]
      );
    }
    const [result] = await connection.execute(
      `INSERT INTO templateThemes (templateId, name, settings, type, isDefault)
       VALUES (?, ?, ?, ?, ?)`,
      [templateId, data.name, data.settings, data.type, data.isDefault]
    );
    await connection.commit();
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(404).json({ message: "Template not found" });
    }
    console.error("createTemplateTheme error:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

const updateTemplateTheme = async (req, res) => {
  const { templateId, themeId } = req.params;
  const { error, data } = cleanTheme(req.body, true);
  if (error) return res.status(400).json({ message: error });
  const columns = Object.keys(data);
  if (!columns.length) return res.status(400).json({ message: "Nothing to update" });

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    const [templates] = await connection.execute(
      "SELECT templateId FROM template WHERE templateId = ? FOR UPDATE",
      [templateId]
    );
    if (!templates.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Template not found" });
    }
    const [themes] = await connection.execute(
      "SELECT id FROM templateThemes WHERE id = ? AND templateId = ? FOR UPDATE",
      [themeId, templateId]
    );
    if (!themes.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Template theme not found" });
    }
    if (data.isDefault) {
      await connection.execute(
        "UPDATE templateThemes SET isDefault = 0 WHERE templateId = ?",
        [templateId]
      );
    }
    await connection.execute(
      `UPDATE templateThemes SET ${columns.map((column) => `${column} = ?`).join(", ")}
        WHERE id = ? AND templateId = ?`,
      [...columns.map((column) => data[column]), themeId, templateId]
    );
    await connection.commit();
    res.json({ message: "Template theme updated" });
  } catch (error) {
    await connection.rollback();
    console.error("updateTemplateTheme error:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

const deleteTemplateTheme = (req, res) => {
  db.query(
    "DELETE FROM templateThemes WHERE id = ? AND templateId = ?",
    [req.params.themeId, req.params.templateId],
    (err, result) => {
      if (err) {
        console.error("deleteTemplateTheme error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!result.affectedRows) return res.status(404).json({ message: "Template theme not found" });
      res.json({ message: "Template theme deleted" });
    }
  );
};

const cleanMenuItem = (body, partial = false) => {
  if (!isObject(body)) return { error: "Invalid request body" };
  const data = {};
  const has = (key) => body[key] !== undefined;

  if (!partial || has("menuLocation")) {
    const menuLocation = body.menuLocation ?? "header";
    if (!LOCATIONS.includes(menuLocation)) return { error: "Invalid menu location" };
    data.menuLocation = menuLocation;
  }
  if (!partial || has("templatePageId")) {
    const pageId = body.templatePageId ?? null;
    if (pageId !== null && !validId(pageId)) return { error: "Invalid template page ID" };
    data.templatePageId = pageId;
  }
  if (!partial || has("externalUrl")) {
    if (body.externalUrl !== null && body.externalUrl !== undefined && typeof body.externalUrl !== "string") {
      return { error: "External URL must be a string or null" };
    }
    const url = body.externalUrl?.trim() || null;
    if (url !== null && (url.length > 500 || !/^https?:\/\/\S+$/i.test(url))) {
      return { error: "External URL must be a valid HTTP(S) URL of at most 500 characters" };
    }
    data.externalUrl = url;
  }
  if (!partial || has("parentItemId")) {
    const parentId = body.parentItemId ?? null;
    if (parentId !== null && !validId(parentId)) return { error: "Invalid parent menu item ID" };
    data.parentItemId = parentId;
  }
  if (has("label")) {
    if (body.label !== null && body.label !== undefined && typeof body.label !== "string") {
      return { error: "Menu label must be a string or null" };
    }
    const label = body.label?.trim() || null;
    if (label !== null && label.length > 150) {
      return { error: "Menu label must be at most 150 characters" };
    }
    data.label = label;
  }
  if (has("sortOrder")) {
    if (!Number.isSafeInteger(Number(body.sortOrder)) || Number(body.sortOrder) < 0) {
      return { error: "sortOrder must be a non-negative integer" };
    }
    data.sortOrder = Number(body.sortOrder);
  }
  if (has("isVisible")) {
    if (![true, false, 0, 1].includes(body.isVisible)) return { error: "isVisible must be a boolean" };
    data.isVisible = body.isVisible ? 1 : 0;
  }
  if (!partial) data.isVisible = data.isVisible ?? 1;
  if (!partial && (data.templatePageId === null) === (data.externalUrl === null)) {
    return { error: "A menu item must link to exactly one page or external URL" };
  }
  return { data };
};

const listTemplateMenuItems = (req, res) => {
  db.query(
    `SELECT id, templateId, menuLocation, parentItemId, templatePageId,
            externalUrl, label, sortOrder, isVisible
       FROM templateMenuItems WHERE templateId = ?
      ORDER BY menuLocation, parentItemId, sortOrder, id`,
    [req.params.templateId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

const createTemplateMenuItem = async (req, res) => {
  const { templateId } = req.params;
  const { error, data } = cleanMenuItem(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    if (data.templatePageId !== null) {
      const [pages] = await db.promise().execute(
        "SELECT id FROM templatePages WHERE id = ? AND templateId = ?",
        [data.templatePageId, templateId]
      );
      if (!pages.length) return res.status(404).json({ message: "Template page not found" });
    }
    if (data.parentItemId !== null) {
      const [parents] = await db.promise().execute(
        "SELECT id, menuLocation FROM templateMenuItems WHERE id = ? AND templateId = ?",
        [data.parentItemId, templateId]
      );
      if (!parents.length) return res.status(404).json({ message: "Parent menu item not found" });
      if (parents[0].menuLocation !== data.menuLocation) {
        return res.status(400).json({ message: "Parent and child must use the same menu location" });
      }
    }
    const [result] = await db.promise().execute(
      `INSERT INTO templateMenuItems
         (templateId, menuLocation, parentItemId, templatePageId, externalUrl,
          label, sortOrder, isVisible)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        templateId, data.menuLocation, data.parentItemId, data.templatePageId,
        data.externalUrl, data.label ?? null, data.sortOrder ?? 0, data.isVisible,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Page is already in this menu" });
    console.error("createTemplateMenuItem error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateTemplateMenuItem = async (req, res) => {
  const { templateId, menuItemId } = req.params;
  const { error, data } = cleanMenuItem(req.body, true);
  if (error) return res.status(400).json({ message: error });
  const columns = Object.keys(data);
  if (!columns.length) return res.status(400).json({ message: "Nothing to update" });
  try {
    const [currentRows] = await db.promise().execute(
      `SELECT id, menuLocation, parentItemId, templatePageId, externalUrl,
              label, sortOrder, isVisible
         FROM templateMenuItems WHERE id = ? AND templateId = ?`,
      [menuItemId, templateId]
    );
    if (!currentRows.length) return res.status(404).json({ message: "Template menu item not found" });
    const current = currentRows[0];
    const finalPageId = Object.prototype.hasOwnProperty.call(data, "templatePageId")
      ? data.templatePageId
      : current.templatePageId;
    const finalUrl = Object.prototype.hasOwnProperty.call(data, "externalUrl")
      ? data.externalUrl
      : current.externalUrl;
    if ((finalPageId == null) === (finalUrl == null)) {
      return res.status(400).json({ message: "A menu item must link to exactly one page or external URL" });
    }
    const finalParentId = Object.prototype.hasOwnProperty.call(data, "parentItemId")
      ? data.parentItemId
      : current.parentItemId;
    if (finalPageId != null) {
      const [pages] = await db.promise().execute(
        "SELECT id FROM templatePages WHERE id = ? AND templateId = ?",
        [finalPageId, templateId]
      );
      if (!pages.length) return res.status(404).json({ message: "Template page not found" });
    }
    if (finalParentId != null) {
      if (String(finalParentId) === String(menuItemId)) {
        return res.status(400).json({ message: "A menu item cannot be its own parent" });
      }
      const [parents] = await db.promise().execute(
        "SELECT id, menuLocation, parentItemId FROM templateMenuItems WHERE id = ? AND templateId = ?",
        [finalParentId, templateId]
      );
      if (!parents.length) return res.status(404).json({ message: "Parent menu item not found" });
      if ((data.menuLocation || current.menuLocation) !== parents[0].menuLocation) {
        return res.status(400).json({ message: "Parent and child must use the same menu location" });
      }
      const visited = new Set([String(menuItemId)]);
      let ancestorId = parents[0].parentItemId;
      while (ancestorId != null) {
        if (visited.has(String(ancestorId))) {
          return res.status(400).json({ message: "Menu hierarchy cannot contain a cycle" });
        }
        visited.add(String(ancestorId));
        const [ancestors] = await db.promise().execute(
          "SELECT parentItemId FROM templateMenuItems WHERE id = ? AND templateId = ?",
          [ancestorId, templateId]
        );
        if (!ancestors.length) break;
        ancestorId = ancestors[0].parentItemId;
      }
    }
    const [result] = await db.promise().execute(
      `UPDATE templateMenuItems SET ${columns.map((column) => `${column} = ?`).join(", ")}
        WHERE id = ? AND templateId = ?`,
      [...columns.map((column) => data[column]), menuItemId, templateId]
    );
    if (!result.affectedRows) return res.json({ message: "Template menu item unchanged" });
    res.json({ message: "Template menu item updated" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Page is already in this menu" });
    console.error("updateTemplateMenuItem error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteTemplateMenuItem = (req, res) => {
  db.query(
    "DELETE FROM templateMenuItems WHERE id = ? AND templateId = ?",
    [req.params.menuItemId, req.params.templateId],
    (err, result) => {
      if (err) {
        console.error("deleteTemplateMenuItem error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!result.affectedRows) return res.status(404).json({ message: "Template menu item not found" });
      res.json({ message: "Template menu item deleted" });
    }
  );
};

const getTemplateContent = async (req, res) => {
  const { templateId } = req.params;
  try {
    const [templates] = await db.promise().execute(
      `SELECT templateId, status FROM template WHERE templateId = ?`,
      [templateId]
    );
    if (!templates.length) return res.status(404).json({ message: "Template not found" });
    if (templates[0].status !== "published" && req.user?.role !== "admin") {
      return res.status(404).json({ message: "Template not found" });
    }
    const [pages] = await db.promise().execute(
      "SELECT id, parentId, title, slug, pageType, content FROM templatePages WHERE templateId = ? ORDER BY parentId, id",
      [templateId]
    );
    const [themes] = await db.promise().execute(
      "SELECT id, name, settings, type, isDefault FROM templateThemes WHERE templateId = ? ORDER BY id",
      [templateId]
    );
    const [menuItems] = await db.promise().execute(
      `SELECT id, menuLocation, parentItemId, templatePageId, externalUrl,
              label, sortOrder, isVisible
         FROM templateMenuItems WHERE templateId = ?
        ORDER BY menuLocation, parentItemId, sortOrder, id`,
      [templateId]
    );
    res.json({ pages, themes, menuItems });
  } catch (error) {
    console.error("getTemplateContent error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  listTemplatePages,
  createTemplatePage,
  updateTemplatePage,
  deleteTemplatePage,
  listTemplateThemes,
  createTemplateTheme,
  updateTemplateTheme,
  deleteTemplateTheme,
  listTemplateMenuItems,
  createTemplateMenuItem,
  updateTemplateMenuItem,
  deleteTemplateMenuItem,
  getTemplateContent,
};
