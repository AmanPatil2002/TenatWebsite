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

module.exports = { getMySites };
