const db = require("../../config/db").promise();
const { HttpError, sendError } = require("../../utils/tx");
const { tn } = require("../../config/provisionSite");
const { isId, getActiveManagedSite, readSiteHeader } = require("./access");

const isValidTitle = (value) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.trim().length <= 150;

const isValidPage = (value) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  Buffer.byteLength(value, "utf8") <= 60000;

// Shared site-details query (LEFT JOINs so a missing paymentId/themeId
// doesn't wipe out the whole response).
const SITE_DETAILS_SQL = `
  SELECT s.id AS siteId, s.name AS siteName, s.templateId, s.expiresAt,
         c.categoryId, c.name AS categoryName,
         pay.currency,
         th.themeId, th.name AS themeName, th.color, th.background
    FROM sites s
    JOIN template t       ON t.templateId = s.templateId
    JOIN categories c     ON c.categoryId = t.categoryId
    LEFT JOIN payments pay ON pay.id       = s.paymentId
    LEFT JOIN theme th     ON th.themeId   = s.themeId
   WHERE s.id = ?`;

const fetchSiteDetails = async (siteId) => {
  const [rows] = await db.query(SITE_DETAILS_SQL, [siteId]);
  return rows[0] ?? null;
};

const getSitePages = async (req, res) => {
  const { siteId } = req.params;
  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });
  try {
    const site = await getActiveManagedSite(siteId, req);

    const [pages] = await db.query(
      `SELECT id AS sitePageId, title, page, sortOrder
         FROM ${tn(siteId, "pages", site.dbName)}
        ORDER BY sortOrder, id`,
    );

    const siteDetails = await fetchSiteDetails(siteId);
    const header = await readSiteHeader(siteId, site.dbName);

    return res.json({ ...(siteDetails ?? {}), header, pages });
  } catch (error) {
    return sendError(res, error);
  }
};

const getPublicSitePages = async (req, res) => {
  const { siteId } = req.params;
  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });
  try {
    const { getPublicSite } = require("./access");
    const site = await getPublicSite(siteId);

    const [pages] = await db.query(
      `SELECT id AS sitePageId, title, page, sortOrder
         FROM ${tn(siteId, "pages", site.dbName)}
        ORDER BY sortOrder, id`,
    );

    const siteDetails = await fetchSiteDetails(siteId);
    const header = await readSiteHeader(siteId, site.dbName);

    return res.json({ ...(siteDetails ?? {}), header, pages });
  } catch (error) {
    return sendError(res, error);
  }
};

const getSitePageOptions = async (req, res) => {
  const { siteId } = req.params;
  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });
  try {
    const site = await getActiveManagedSite(siteId, req);

    // "sitepages" is the tenant "pages" table — every row is implicitly
    // for this site, so we only filter on sourcePagesId.
    const [pages] = await db.query(
      `SELECT p.pagesId, p.title
         FROM sites s
         JOIN template t ON t.templateId = s.templateId
         JOIN pages p    ON p.categoryId = t.categoryId
        WHERE s.id = ?
          AND NOT EXISTS (
            SELECT 1 FROM ${tn(siteId, "pages", site.dbName)} sp
             WHERE sp.sourcePagesId = p.pagesId
          )
        ORDER BY p.title`,
      [siteId],
    );
    return res.json(pages);
  } catch (error) {
    return sendError(res, error);
  }
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
      message:
        "Choose a valid category page or provide a title and page content",
    });
  }

  let connection;
  try {
    const site = await getActiveManagedSite(siteId, req);
    const pagesTable = tn(siteId, "pages", site.dbName);

    connection = await db.getConnection();
    await connection.beginTransaction();

    let insertId;

    if (isLibraryPage) {
      const [result] = await connection.query(
        `INSERT INTO ${pagesTable} (sourcePagesId, title, page, sortOrder)
         SELECT p.pagesId, p.title, p.page,
                COALESCE((SELECT MAX(sortOrder) FROM ${pagesTable}), 0) + 1
           FROM template t
           JOIN pages p ON p.categoryId = t.categoryId
          WHERE t.templateId = (SELECT templateId FROM sites WHERE id = ?)
            AND p.pagesId = ?`,
        [siteId, sourcePagesId],
      );

      if (!result.affectedRows) {
        console.warn(
          `[createSitePage] library insert affected 0 rows: siteId=${siteId} sourcePagesId=${sourcePagesId}`,
        );
        throw new HttpError(
          404,
          "Page template is not available for this site's category",
        );
      }
      insertId = result.insertId;
    } else {
      // VALUES-based insert guarantees exactly one row even when the
      // tenant pages table is currently empty. The old
      // INSERT..SELECT..FROM pages form inserted 0 rows on an empty table.
      const [[{ maxSort }]] = await connection.query(
        `SELECT COALESCE(MAX(sortOrder), 0) AS maxSort FROM ${pagesTable}`,
      );
      const [result] = await connection.query(
        `INSERT INTO ${pagesTable} (title, page, sortOrder)
         VALUES (?, ?, ?)`,
        [title.trim(), page, Number(maxSort) + 1],
      );

      if (!result.affectedRows) {
        throw new HttpError(500, "Page could not be created");
      }
      insertId = result.insertId;
    }

    await connection.commit();
    return res.status(201).json({
      message: isLibraryPage
        ? "Category page added successfully"
        : "Page created successfully",
      sitePageId: insertId,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "createSitePage transaction rollback failed:",
          rollbackError,
        );
      }
    }
    return sendError(res, error);
  } finally {
    if (connection) connection.release();
  }
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
      return res
        .status(400)
        .json({ message: "Title must be nonempty and at most 150 characters" });
    }
    fields.push("title = ?");
    values.push(title.trim());
  }
  if (page !== undefined) {
    if (!isValidPage(page)) {
      return res
        .status(400)
        .json({ message: "Page content must be nonempty and at most 60 KB" });
    }
    fields.push("page = ?");
    values.push(page);
  }
  if (!fields.length) {
    return res
      .status(400)
      .json({ message: "Provide a title or page to update" });
  }

  try {
    const site = await getActiveManagedSite(siteId, req);
    const [result] = await db.query(
      `UPDATE ${tn(siteId, "pages", site.dbName)} SET ${fields.join(
        ", ",
      )} WHERE id = ?`,
      [...values, pageId],
    );
    if (!result.affectedRows) throw new HttpError(404, "Page not found");
    return res.json({ message: "Page updated successfully" });
  } catch (error) {
    return sendError(res, error);
  }
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
  } catch (error) {
    return sendError(res, error);
  }
};

const reorderSitePages = async (req, res) => {
  const { siteId } = req.params;
  const { pageIds } = req.body ?? {};
  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });
  if (
    !Array.isArray(pageIds) ||
    pageIds.length === 0 ||
    pageIds.some(
      (id) =>
        (typeof id !== "string" &&
          !(typeof id === "number" && Number.isSafeInteger(id))) ||
        !isId(id),
    ) ||
    new Set(pageIds.map(String)).size !== pageIds.length
  ) {
    return res
      .status(400)
      .json({ message: "Provide a valid ordered list of page ids" });
  }

  let connection;
  try {
    const site = await getActiveManagedSite(siteId, req);
    const pagesTable = tn(siteId, "pages", site.dbName);

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [existingPages] = await connection.query(
      `SELECT id FROM ${pagesTable} ORDER BY id FOR UPDATE`,
    );
    const existingIds = existingPages.map((p) => String(p.id)).sort();
    const requestedIds = pageIds.map(String).sort();
    if (
      existingIds.length !== requestedIds.length ||
      existingIds.some((id, index) => id !== requestedIds[index])
    ) {
      throw new HttpError(
        400,
        "The page list changed. Reload before reordering.",
      );
    }

    for (let sortOrder = 0; sortOrder < pageIds.length; sortOrder += 1) {
      await connection.query(
        `UPDATE ${pagesTable} SET sortOrder = ? WHERE id = ?`,
        [sortOrder, pageIds[sortOrder]],
      );
    }

    await connection.commit();
    return res.json({ message: "Page order updated successfully" });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Page-order transaction rollback failed:",
          rollbackError,
        );
      }
    }
    return sendError(res, error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  getSitePages,
  getPublicSitePages,
  getSitePageOptions,
  createSitePage,
  updateSitePage,
  deleteSitePage,
  reorderSitePages,
};