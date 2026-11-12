const db = require("../config/db").promise();
const { HttpError, sendError } = require("../utils/tx");
const { tn } = require("../config/provisionSite");

const isId = (value) => {
  if (typeof value === "number" && !Number.isSafeInteger(value)) return false;
  return /^[1-9]\d{0,19}$/.test(String(value ?? "")) &&
    BigInt(value) <= 18446744073709551615n;
};

const getActiveOwnedSite = async (siteId, userId) => {
  const [[site]] = await db.query(
    `SELECT s.id, s.userId, s.status, s.expiresAt, s.dbName,
            pay.status AS paymentStatus,
            s.expiresAt > CURRENT_TIMESTAMP AS notExpired
       FROM sites s
       JOIN payments pay ON pay.id = s.paymentId
      WHERE s.id = ? AND s.userId = ?`,
    [siteId, userId],
  );

  if (!site) throw new HttpError(404, "Site not found");
  if (
    site.status !== "active" ||
    site.paymentStatus !== "captured" ||
    !site.notExpired
  ) {
    throw new HttpError(403, "Site is inactive or expired");
  }
  return site;
};

const getActiveManagedSite = async (siteId, req) => {
  if (!req.siteAdmin) {
    return getActiveOwnedSite(siteId, req.user.userId);
  }
  if (String(req.siteAdmin.siteId) !== String(siteId)) {
    throw new HttpError(403, "This login is not assigned to the requested site");
  }
  const [[site]] = await db.query(
    `SELECT s.id, s.userId, s.status, s.expiresAt, s.dbName,
            pay.status AS paymentStatus,
            s.expiresAt > CURRENT_TIMESTAMP AS notExpired
       FROM sites s
       JOIN payments pay ON pay.id = s.paymentId
      WHERE s.id = ?`,
    [siteId],
  );
  if (!site) throw new HttpError(404, "Site not found");
  if (
    site.status !== "active" ||
    site.paymentStatus !== "captured" ||
    !site.notExpired
  ) {
    throw new HttpError(403, "Site is inactive or expired");
  }
  return site;
};

const isValidTitle = (value) =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= 150;

const isValidPage = (value) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  Buffer.byteLength(value, "utf8") <= 60000;

const SITE_HEADER_FIELDS = [
  ["siteTitle", 150],
  ["footerText", 65535],
  ["footerAddress", 300],
  ["footerPhone", 30],
  ["footerEmail", 190],
  ["copyrightText", 255],
];
const SOCIAL_PLATFORMS = ["facebook", "instagram", "youtube", "twitter", "linkedin"];
const isHttpUrl = (value) => {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

const readSiteHeader = async (siteId, dbName) => {
  const [[header]] = await db.query(
    `SELECT logoUrl, siteTitle, footerText, footerAddress,
            footerPhone, footerEmail, copyrightText, socialLinks, createdAt, updatedAt
       FROM ${tn(siteId, "headers", dbName)}
      LIMIT 1`
  );
  if (header && typeof header.socialLinks === "string") {
    try {
      header.socialLinks = JSON.parse(header.socialLinks);
    } catch {
      header.socialLinks = {};
    }
  }
  return header || null;
};

const getSiteHeader = async (req, res) => {
  const { siteId } = req.params;
  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });
  try {
    const site = await getActiveManagedSite(siteId, req);
    return res.json({ header: await readSiteHeader(siteId, site.dbName) });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateSiteHeader = async (req, res) => {
  const { siteId } = req.params;
  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });

  const body = req.body ?? {};
  const header = {};
  for (const [field, maxLength] of SITE_HEADER_FIELDS) {
    const value = body[field] ?? "";
    if (typeof value !== "string" || value.length > maxLength) {
      return res.status(400).json({
        message: `${field} must be a string of at most ${maxLength} characters`,
      });
    }
    header[field] = value.trim() || null;
  }

  const logoUrl = body.logoUrl ?? null;
  if (
    logoUrl !== null &&
    (typeof logoUrl !== "string" ||
      logoUrl.length > 500 ||
      (!isHttpUrl(logoUrl) &&
        !new RegExp(`^/uploads/sites/${siteId}/[a-f0-9]{32}\\.(jpg|png|webp|gif)$`).test(logoUrl)))
  ) {
    return res.status(400).json({ message: "Enter a valid logo image URL" });
  }

  const socialLinks = body.socialLinks ?? {};
  if (
    !socialLinks ||
    typeof socialLinks !== "object" ||
    Array.isArray(socialLinks) ||
    Object.keys(socialLinks).some(
      (platform) =>
        !SOCIAL_PLATFORMS.includes(platform) ||
        typeof socialLinks[platform] !== "string" ||
        socialLinks[platform].length > 500 ||
        (socialLinks[platform].trim() && !isHttpUrl(socialLinks[platform].trim())),
    )
  ) {
    return res.status(400).json({ message: "Enter valid social media links" });
  }
  const cleanSocialLinks = Object.fromEntries(
    Object.entries(socialLinks)
      .map(([platform, url]) => [platform, url.trim()])
      .filter(([, url]) => url),
  );

  try {
    const site = await getActiveManagedSite(siteId, req);
    await db.query(
      `UPDATE ${tn(siteId, "headers", site.dbName)}
       SET logoUrl = ?, siteTitle = ?, footerText = ?, footerAddress = ?,
           footerPhone = ?, footerEmail = ?, copyrightText = ?, socialLinks = ?
       LIMIT 1`,
      [
        logoUrl,
        header.siteTitle,
        header.footerText,
        header.footerAddress,
        header.footerPhone,
        header.footerEmail,
        header.copyrightText,
        JSON.stringify(cleanSocialLinks),
      ],
    );
    return res.json({
      message: "Site header and footer saved",
      header: await readSiteHeader(siteId, site.dbName),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getMySites = async (req, res) => {
  try {
    const [rows] = await db.query(
  `SELECT s.id, s.userId, s.templateId, t.name AS templateName,
          t.thumbnailUrl, t.shortDescription,
          s.themeId, th.name AS themeName, th.color, th.background,
          s.paymentId, s.name, s.status, s.provisionStatus,
          CASE WHEN s.expiresAt <= CURRENT_TIMESTAMP THEN 'expired' ELSE s.status END AS currentStatus,
          (SELECT COUNT(*) FROM sitepages sp WHERE sp.siteId = s.id) AS pageCount,
          s.startsAt, s.expiresAt, s.createdAt
     FROM sites s
     JOIN template t ON t.templateId = s.templateId
     JOIN theme th ON th.themeId = s.themeId
    WHERE s.userId = ?
    ORDER BY s.createdAt DESC`,
  [req.user.userId],
);
    return res.json(rows);
  } catch (error) {
    return sendError(res, error);
  }
};

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
  } catch (error) {
    return sendError(res, error);
  }
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
  } catch (error) {
    return sendError(res, error);
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
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Page-order transaction rollback failed:", rollbackError);
      }
    }
    return sendError(res, error);
  } finally {
    if (connection) connection.release();
  }
};

const getSiteData = async (req, res) => {
  const { siteId } = req.params;
  const { resource } = req.query;
  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });

  try {
    const site = await getActiveManagedSite(siteId, req);
    const dbName = site.dbName;

    // If resource is specified, fetch only that resource
    if (resource) {
      const [rows] = await db.query(
        `SELECT * FROM ${tn(siteId, resource, dbName)} WHERE status = 'active' ORDER BY id DESC`
      );
      return res.json({ [resource]: rows });
    }

    // Otherwise fetch all available resources for the site's category
    const [tables] = await db.query(
      'SELECT baseName FROM sitetables WHERE siteId = ? ORDER BY baseName',
      [siteId]
    );

    const data = {};
    for (const { baseName } of tables) {
      const [rows] = await db.query(
        `SELECT * FROM ${tn(siteId, baseName, dbName)} WHERE status = 'active' ORDER BY id DESC`
      );
      data[baseName] = rows;
    }

    return res.json(data);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getMySites,
  getSitePages,
  getSiteHeader,
  updateSiteHeader,
  getSitePageOptions,
  createSitePage,
  updateSitePage,
  reorderSitePages,
  getSiteData,
};