const db = require("../config/db").promise();
const { sendError } = require("../utils/tx");

const isId = (value) => {
  if (typeof value === "number" && !Number.isSafeInteger(value)) return false;
  return /^[1-9]\d{0,19}$/.test(String(value ?? "")) &&
    BigInt(value) <= 18446744073709551615n;
};

const getMySites = async (req, res) => {
  try {
    const [rows] = await db.query(
  `SELECT s.id, s.userId, s.templateId, t.name AS templateName,
          t.thumbnailUrl, t.shortDescription,
          s.themeId, th.name AS themeName, th.color, th.background,
          s.paymentId, s.name, s.status,
          CASE WHEN s.expiresAt <= CURRENT_TIMESTAMP THEN 'expired' ELSE s.status END AS currentStatus,
          (SELECT COUNT(*) FROM paymentpages pp WHERE pp.paymentId = s.paymentId) AS pageCount,
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
    const [[site]] = await db.query(
      `SELECT s.id, s.userId, s.status, s.expiresAt, pay.status AS paymentStatus,
              s.expiresAt > CURRENT_TIMESTAMP AS notExpired
         FROM sites s JOIN payments pay ON pay.id = s.paymentId
        WHERE s.id = ?`,
      [siteId],
    );
    if (!site) return res.status(404).json({ message: "Site not found" });
    if (String(site.userId) !== String(req.user.userId)) {
      return res.status(403).json({ message: "Site access denied" });
    }
    if (
      site.status !== "active" ||
      site.paymentStatus !== "captured" ||
      !site.notExpired
    ) {
      return res.status(403).json({ message: "Site is inactive or expired" });
    }

    const [pages] = await db.query(
      `SELECT siteId, siteName, templateId, expiresAt, themeId, themeName,
              color, background, pagesId, title, page, isDefault, sortOrder
         FROM sitepagesview
        WHERE userId = ? AND siteId = ?
        ORDER BY sortOrder, pagesId`,
      [req.user.userId, siteId],
    );
    return res.json({ siteId, pages });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { getMySites, getSitePages };