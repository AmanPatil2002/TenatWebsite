const db = require("../config/db");

const LOCATIONS = ["header", "footer", "sidebar"];
const validId = (id) =>
  /^[1-9]\d*$/.test(String(id)) && BigInt(id) <= 18446744073709551615n;
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const cleanMenuItem = (body, partial = false) => {
  if (!isObject(body)) return { error: "Invalid request body" };
  const data = {};

  if (!partial || has(body, "menuLocation")) {
    const menuLocation = body.menuLocation ?? "header";
    if (!LOCATIONS.includes(menuLocation)) return { error: "Invalid menu location" };
    data.menuLocation = menuLocation;
  }
  if (!partial || has(body, "pageId")) {
    const pageId = body.pageId ?? null;
    if (pageId !== null && !validId(pageId)) return { error: "Invalid page ID" };
    data.pageId = pageId;
  }
  if (!partial || has(body, "subPageId")) {
    const subPageId = body.subPageId ?? null;
    if (subPageId !== null && !validId(subPageId)) return { error: "Invalid subpage ID" };
    data.subPageId = subPageId;
  }
  if (!partial || has(body, "externalUrl")) {
    if (
      body.externalUrl !== undefined &&
      body.externalUrl !== null &&
      typeof body.externalUrl !== "string"
    ) {
      return { error: "External URL must be a string or null" };
    }
    const externalUrl = body.externalUrl?.trim() || null;
    if (externalUrl && (externalUrl.length > 500 || !/^https?:\/\/\S+$/i.test(externalUrl))) {
      return { error: "External URL must be a valid HTTP(S) URL of at most 500 characters" };
    }
    data.externalUrl = externalUrl;
  }
  if (!partial && (Number(data.pageId !== null) + Number(data.subPageId !== null) + Number(data.externalUrl !== null) !== 1)) {
    return { error: "A menu item must link to exactly one page, subpage, or external URL" };
  }
  if (!partial || has(body, "parentItemId")) {
    const parentItemId = body.parentItemId ?? null;
    if (parentItemId !== null && !validId(parentItemId)) {
      return { error: "Invalid parent menu item ID" };
    }
    data.parentItemId = parentItemId;
  }
  if (has(body, "label")) {
    if (body.label !== null && typeof body.label !== "string") {
      return { error: "Menu label must be a string or null" };
    }
    const label = body.label?.trim() || null;
    if (label && label.length > 150) return { error: "Menu label must be at most 150 characters" };
    data.label = label;
  }
  if (has(body, "sortOrder")) {
    if (!Number.isInteger(Number(body.sortOrder)) || Number(body.sortOrder) < 0) {
      return { error: "sortOrder must be a non-negative integer" };
    }
    data.sortOrder = Number(body.sortOrder);
  }
  for (const column of ["isVisible", "opensInNewTab"]) {
    if (has(body, column)) {
      if (![true, false, 0, 1].includes(body[column])) {
        return { error: `${column} must be a boolean` };
      }
      data[column] = body[column] ? 1 : 0;
    }
  }
  if (!partial) {
    data.label = data.label ?? null;
    data.sortOrder = data.sortOrder ?? 0;
    data.isVisible = data.isVisible ?? 1;
    data.opensInNewTab = data.opensInNewTab ?? 0;
  }
  return { data };
};

const validateReferences = async (connection, siteId, data, existing = null) => {
  const pageId = has(data, "pageId") ? data.pageId : existing?.pageId ?? null;
  const subPageId = has(data, "subPageId") ? data.subPageId : existing?.subPageId ?? null;
  const externalUrl = has(data, "externalUrl")
    ? data.externalUrl
    : existing?.externalUrl ?? null;
  if (Number(pageId !== null) + Number(subPageId !== null) + Number(externalUrl !== null) !== 1) {
    return "A menu item must link to exactly one page, subpage, or external URL";
  }
  if (pageId !== null) {
    const [rows] = await connection.execute(
      "SELECT id FROM sitePages WHERE id = ? AND siteId = ?",
      [pageId, siteId]
    );
    if (!rows.length) return "Page not found in this site";
  }
  if (subPageId !== null) {
    const [rows] = await connection.execute(
      "SELECT id FROM subPages WHERE id = ? AND siteId = ?",
      [subPageId, siteId]
    );
    if (!rows.length) return "Subpage not found in this site";
  }
  const parentItemId = has(data, "parentItemId")
    ? data.parentItemId
    : existing?.parentItemId ?? null;
  if (parentItemId !== null) {
    if (existing && String(parentItemId) === String(existing.id)) {
      return "A menu item cannot be its own parent";
    }
    const [rows] = await connection.execute(
      "SELECT id, menuLocation, parentItemId FROM siteMenuItems WHERE id = ? AND siteId = ?",
      [parentItemId, siteId]
    );
    if (!rows.length) return "Parent menu item not found in this site";
    const menuLocation = data.menuLocation || existing?.menuLocation || "header";
    if (rows[0].menuLocation !== menuLocation) {
      return "Parent and child must use the same menu location";
    }
    if (existing) {
      const visited = new Set([String(existing.id)]);
      let ancestorId = rows[0].parentItemId;
      while (ancestorId != null) {
        if (visited.has(String(ancestorId))) {
          return "Menu hierarchy cannot contain a cycle";
        }
        visited.add(String(ancestorId));
        const [ancestors] = await connection.execute(
          "SELECT parentItemId FROM siteMenuItems WHERE id = ? AND siteId = ?",
          [ancestorId, siteId]
        );
        if (!ancestors.length) break;
        ancestorId = ancestors[0].parentItemId;
      }
    }
  }
  return null;
};

const listSiteMenuItems = (req, res) => {
  const { siteId } = req.params;
  const { menuLocation } = req.query;
  if (menuLocation !== undefined && !LOCATIONS.includes(menuLocation)) {
    return res.status(400).json({ message: "Invalid menu location" });
  }

  const where = ["m.siteId = ?"];
  const values = [siteId];
  if (menuLocation) {
    where.push("m.menuLocation = ?");
    values.push(menuLocation);
  }
  db.query(
    `SELECT m.id, m.siteId, m.adminId, m.menuLocation, m.parentItemId,
            m.pageId, m.subPageId, m.externalUrl, m.label,
            COALESCE(m.label, p.title, sp.title) AS displayLabel,
            COALESCE(p.slug, sp.slug) AS slug,
            m.sortOrder, m.isVisible, m.opensInNewTab,
            m.createdAt, m.updatedAt
       FROM siteMenuItems m
       LEFT JOIN sitePages p ON p.id = m.pageId
       LEFT JOIN subPages sp ON sp.id = m.subPageId
      WHERE ${where.join(" AND ")}
      ORDER BY m.menuLocation, m.parentItemId, m.sortOrder, m.id`,
    values,
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

const createSiteMenuItem = async (req, res) => {
  const { siteId } = req.params;
  const { error, data } = cleanMenuItem(req.body);
  if (error) return res.status(400).json({ message: error });
  const connection = await db.promise().getConnection();
  try {
    const referenceError = await validateReferences(connection, siteId, data);
    if (referenceError) return res.status(400).json({ message: referenceError });
    const [result] = await connection.execute(
      `INSERT INTO siteMenuItems
         (siteId, adminId, menuLocation, parentItemId, pageId, subPageId,
          externalUrl, label, sortOrder, isVisible, opensInNewTab)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        siteId, req.siteAdmin.adminId, data.menuLocation, data.parentItemId,
        data.pageId, data.subPageId, data.externalUrl, data.label,
        data.sortOrder, data.isVisible, data.opensInNewTab,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Page is already in this menu" });
    console.error("createSiteMenuItem error:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

const updateSiteMenuItem = async (req, res) => {
  const { siteId, menuItemId } = req.params;
  const { error, data } = cleanMenuItem(req.body, true);
  if (error) return res.status(400).json({ message: error });
  const columns = Object.keys(data);
  if (!columns.length) return res.status(400).json({ message: "Nothing to update" });

  const connection = await db.promise().getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT id, menuLocation, parentItemId, pageId, subPageId, externalUrl
         FROM siteMenuItems WHERE id = ? AND siteId = ?`,
      [menuItemId, siteId]
    );
    if (!rows.length) return res.status(404).json({ message: "Menu item not found" });
    const referenceError = await validateReferences(connection, siteId, data, rows[0]);
    if (referenceError) return res.status(400).json({ message: referenceError });
    const [result] = await connection.execute(
      `UPDATE siteMenuItems SET ${columns.map((column) => `${column} = ?`).join(", ")}
        WHERE id = ? AND siteId = ?`,
      [...columns.map((column) => data[column]), menuItemId, siteId]
    );
    if (!result.affectedRows) return res.json({ message: "Menu item unchanged" });
    res.json({ message: "Menu item updated" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Page is already in this menu" });
    console.error("updateSiteMenuItem error:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

const deleteSiteMenuItem = (req, res) => {
  db.query(
    "DELETE FROM siteMenuItems WHERE id = ? AND siteId = ?",
    [req.params.menuItemId, req.params.siteId],
    (err, result) => {
      if (err) {
        console.error("deleteSiteMenuItem error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!result.affectedRows) return res.status(404).json({ message: "Menu item not found" });
      res.json({ message: "Menu item deleted" });
    }
  );
};

const reorderSiteMenuItems = async (req, res) => {
  const { siteId } = req.params;
  const items = req.body.items;
  if (!Array.isArray(items) || items.length > 500) {
    return res.status(400).json({ message: "items must be an array of at most 500 items" });
  }
  const seen = new Set();
  const normalized = [];
  for (const item of items) {
    if (
      !isObject(item) ||
      !validId(String(item.id)) ||
      (item.parentItemId != null && !validId(String(item.parentItemId))) ||
      !Number.isSafeInteger(item.sortOrder) ||
      item.sortOrder < 0
    ) {
      return res.status(400).json({ message: "Each item needs a valid id, parentItemId, and non-negative sortOrder" });
    }
    const id = String(item.id);
    if (seen.has(id)) return res.status(400).json({ message: "Duplicate menu item ID" });
    seen.add(id);
    normalized.push({ id, parentItemId: item.parentItemId == null ? null : String(item.parentItemId), sortOrder: item.sortOrder });
  }

  const parents = new Map(normalized.map((item) => [item.id, item.parentItemId]));
  for (const item of normalized) {
    const visited = new Set([item.id]);
    let parentId = item.parentItemId;
    while (parentId !== null && parents.has(parentId)) {
      if (visited.has(parentId)) return res.status(400).json({ message: "Menu hierarchy cannot contain a cycle" });
      visited.add(parentId);
      parentId = parents.get(parentId);
    }
  }

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT id, menuLocation FROM siteMenuItems WHERE siteId = ? FOR UPDATE",
      [siteId]
    );
    const siteItems = new Map(rows.map((row) => [String(row.id), row]));
    if (siteItems.size !== normalized.length || normalized.some((item) => !siteItems.has(item.id))) {
      await connection.rollback();
      return res.status(400).json({ message: "Reorder payload must include every menu item for this site" });
    }
    for (const item of normalized) {
      if (item.parentItemId !== null) {
        const parent = siteItems.get(item.parentItemId);
        if (!parent) {
          await connection.rollback();
          return res.status(400).json({ message: "Parent menu item not found in this site" });
        }
        if (parent.menuLocation !== siteItems.get(item.id).menuLocation) {
          await connection.rollback();
          return res.status(400).json({ message: "Parent and child must use the same menu location" });
        }
      }
    }
    for (const item of normalized) {
      await connection.execute(
        "UPDATE siteMenuItems SET parentItemId = ?, sortOrder = ? WHERE id = ? AND siteId = ?",
        [item.parentItemId, item.sortOrder, item.id, siteId]
      );
    }
    await connection.commit();
    res.json({ message: "Menu items reordered" });
  } catch (error) {
    await connection.rollback();
    console.error("reorderSiteMenuItems error:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

module.exports = {
  listSiteMenuItems,
  createSiteMenuItem,
  updateSiteMenuItem,
  deleteSiteMenuItem,
  reorderSiteMenuItems,
};
