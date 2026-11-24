const db = require("../../config/db").promise();
const { sendError } = require("../../utils/tx");

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
  } catch (error) { return sendError(res, error); }
};

const slugify = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "site";

const createSiteSlug = (site) => {
  let hash = 14695981039346656037n;
  for (const character of String(site.id)) {
    hash = BigInt.asUintN(
      64,
      (hash ^ BigInt(character.codePointAt(0))) * 1099511628211n,
    );
  }
  return `${slugify(site.name)}-${hash.toString(36)}`;
};

const resolvePublicSite = async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim();
    if (!slug || slug.length > 300) {
      return res.status(400).json({ message: "Invalid site slug" });
    }
    const [rows] = await db.query(
      `SELECT s.id, s.name, s.status, s.expiresAt, s.dbName, s.provisionStatus,
              pay.status AS paymentStatus,
              c.packKey
         FROM sites s
         JOIN payments pay ON pay.id = s.paymentId
         JOIN template t ON t.templateId = s.templateId
         JOIN categories c ON c.categoryId = t.categoryId
        WHERE s.status = 'active'
          AND s.expiresAt > CURRENT_TIMESTAMP
          AND pay.status = 'captured'`,
    );
    const site = rows.find((row) => createSiteSlug(row) === slug);
    if (!site) return res.status(404).json({ message: "Public site not found" });
    return res.json({
      id: site.id,
      name: site.name,
      packKey: site.packKey,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { getMySites, resolvePublicSite };
