const db = require("../../config/db").promise();
const { HttpError, sendError } = require("../../utils/tx");
const { tn } = require("../../config/provisionSite");
const { isId, getActiveManagedSite, readSiteHeader } = require("./access");

const isValidTitle = (value) =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= 150;
const isValidPage = (value) =>
  typeof value === "string" && value.trim().length > 0 &&
  Buffer.byteLength(value, "utf8") <= 60000;

const getSitePages = async (req, res) => {
  const { siteId } = req.params;
  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });
  try {
    const site = await getActiveManagedSite(siteId, req);

    const [pages] = await db.query(
      `SELECT id AS sitePageId, title, page, sortOrder
         FROM ${tn(siteId, "pages", site.dbName)}
        ORDER BY sortOrder, id`
    );

    const [[siteDetails]] = await db.query(
      `SELECT s.id AS siteId, s.name AS siteName, s.templateId, s.expiresAt,
              c.categoryId, c.name AS categoryName,
              pay.currency,
              th.themeId, th.name AS themeName, th.color, th.background
         FROM sites s
         JOIN template t ON t.templateId = s.templateId
         JOIN categories c ON c.categoryId = t.categoryId
         JOIN payments pay ON pay.id = s.paymentId
         JOIN theme th ON th.themeId = s.themeId
        WHERE s.id = ?`,
      [siteId],
    );

    const header = await readSiteHeader(siteId, site.dbName);

    return res.json({ ...siteDetails, header, pages });
  } catch (error) { return sendError(res, error); }
};

const getSitePageOptions = async (req, res) => {
  const { siteId } = req.params;
  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });
  try {
    await getActiveManagedSite(siteId, req);
    const [pages] = await db.query(
      `SELECT p.pagesId, p.title
         FROM sites s
         JOIN template t ON t.templateId = s.templateId
         JOIN pages p ON p.categoryId = t.categoryId
        WHERE s.id = ?
          AND NOT EXISTS (
            SELECT 1 FROM sitepages sp
             WHERE sp.siteId = s.id AND sp.sourcePagesId = p.pagesId
          )
        ORDER BY p.title`,
      [siteId],
    );
    return res.json(pages);
  } catch (error) { return sendError(res, error); }
};

const createSitePage = async (req, res) => {
  const { siteId } = req.params;
  const { title, page, sourcePagesId } = req.body ?? {};
  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });
  const isLibraryPage = sourcePagesId !== undefined;
  if (
    (isLibraryPage && !isId(sourcePagesId)) ||
    (!isLibraryPage && (!isValidTitle(title) || !isValidPage(page)))
  ) {
    return res.status(400).json({
      message: "Choose a valid category page or provide a title and page content",
    });
  }

  try {
    const site = await getActiveManagedSite(siteId, req);
    if (isLibraryPage) {
      const [result] = await db.query(
        `INSERT INTO ${tn(siteId, "pages", site.dbName)} (sourcePagesId, title, page, sortOrder)
         SELECT p.pagesId, p.title, p.page,
                COALESCE((SELECT MAX(sortOrder) FROM ${tn(siteId, "pages", site.dbName)}), 0) + 1
           FROM template t
           JOIN pages p ON p.categoryId = t.categoryId
          WHERE t.templateId = (SELECT templateId FROM sites WHERE id = ?) AND p.pagesId = ?`,
        [siteId, sourcePagesId],
      );
      if (!result.affectedRows) {
        throw new HttpError(404, "Page template is not available for this site's category");
      }
      return res.status(201).json({
        message: "Category page added successfully",
        sitePageId: result.insertId,
      });
    }

    const [result] = await db.query(
      `INSERT INTO ${tn(siteId, "pages", site.dbName)} (title, page, sortOrder)
       SELECT ?, ?, COALESCE(MAX(sortOrder), 0) + 1
         FROM ${tn(siteId, "pages", site.dbName)}`,
      [title.trim(), page],
    );
    return res.status(201).json({
      message: "Page created successfully",
      sitePageId: result.insertId,
    });
  } catch (error) { return sendError(res, error); }
};

const updateSitePage = async (req, res) => {
  const { siteId, pageId } = req.params;
  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });
  if (!isId(pageId)) return res.status(400).json({ message: "Invalid page id" });

  const fields = [];
  const values = [];
  const { title, page } = req.body ?? {};

  if (title !== undefined) {
    if (!isValidTitle(title)) {
      return res.status(400).json({ message: "Title must be nonempty and at most 150 characters" });
    }
    fields.push("title = ?");
    values.push(title.trim());
  }
  if (page !== undefined) {
    if (!isValidPage(page)) {
      return res.status(400).json({ message: "Page content must be nonempty and at most 60 KB" });
    }
    fields.push("page = ?");
    values.push(page);
  }
  if (!fields.length) {
    return res.status(400).json({ message: "Provide a title or page to update" });
  }

  try {
    const site = await getActiveManagedSite(siteId, req);
    const [result] = await db.query(
      `UPDATE ${tn(siteId, "pages", site.dbName)} SET ${fields.join(", ")} WHERE id = ?`,
      [...values, pageId],
    );
    if (!result.affectedRows) throw new HttpError(404, "Page not found");
    return res.json({ message: "Page updated successfully" });
  } catch (error) { return sendError(res, error); }
};

const deleteSitePage = async (req, res) => {
  const { siteId, pageId } = req.params;
  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });
  if (!isId(pageId)) return res.status(400).json({ message: "Invalid page id" });

  try {
    const site = await getActiveManagedSite(siteId, req);
    const [result] = await db.query(
      `DELETE FROM ${tn(siteId, "pages", site.dbName)} WHERE id = ?`,
      [pageId],
    );
    if (!result.affectedRows) throw new HttpError(404, "Page not found");
    return res.json({ message: "Page deleted successfully" });
  } catch (error) { return sendError(res, error); }
};

const reorderSitePages = async (req, res) => {
  const { siteId } = req.params;
  const { pageIds } = req.body ?? {};
  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });
  if (
    !Array.isArray(pageIds) ||
    pageIds.length > 4294967296 ||
    pageIds.some(
      (id) =>
        (typeof id !== "string" &&
          !(typeof id === "number" && Number.isSafeInteger(id))) ||
        !isId(id),
    ) ||
    new Set(pageIds.map(String)).size !== pageIds.length
  ) {
    return res.status(400).json({ message: "Provide a valid ordered list of page ids" });
  }

  let connection;
  try {
    const site = await getActiveManagedSite(siteId, req);
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [existingPages] = await connection.query(
      `SELECT id FROM ${tn(siteId, "pages", site.dbName)} ORDER BY id FOR UPDATE`
    );
    const existingIds = existingPages.map((page) => String(page.id)).sort();
    const requestedIds = pageIds.map(String).sort();
    if (
      existingIds.length !== requestedIds.length ||
      existingIds.some((id, index) => id !== requestedIds[index])
    ) {
      throw new HttpError(400, "The page list changed. Reload before reordering.");
    }

    for (let sortOrder = 0; sortOrder < pageIds.length; sortOrder += 1) {
      await connection.query(
        `UPDATE ${tn(siteId, "pages", site.dbName)} SET sortOrder = ? WHERE id = ?`,
        [sortOrder, pageIds[sortOrder]],
      );
    }

    await connection.commit();
    return res.json({ message: "Page order updated successfully" });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); }
      catch (rollbackError) { console.error("Page-order transaction rollback failed:", rollbackError); }
    }
    return sendError(res, error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  getSitePages, getSitePageOptions, createSitePage,
  updateSitePage, deleteSitePage, reorderSitePages,
};
