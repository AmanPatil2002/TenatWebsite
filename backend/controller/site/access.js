const db = require("../../config/db").promise();
const { HttpError } = require("../../utils/tx");
const { tn } = require("../../config/provisionSite");

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
  if (site.status !== "active" || site.paymentStatus !== "captured" || !site.notExpired) {
    throw new HttpError(403, "Site is inactive or expired");
  }
  return site;
};

const getActiveManagedSite = async (siteId, req) => {
  if (!req.siteAdmin) return getActiveOwnedSite(siteId, req.user.userId);
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
  if (site.status !== "active" || site.paymentStatus !== "captured" || !site.notExpired) {
    throw new HttpError(403, "Site is inactive or expired");
  }
  return site;
};

const readSiteHeader = async (siteId, dbName) => {
  const [[header]] = await db.query(
    `SELECT logoUrl, siteTitle, footerText, footerAddress,
            footerPhone, footerEmail, copyrightText, socialLinks, createdAt, updatedAt
       FROM ${tn(siteId, "headers", dbName)}
      LIMIT 1`
  );
  if (header && typeof header.socialLinks === "string") {
    try { header.socialLinks = JSON.parse(header.socialLinks); }
    catch { header.socialLinks = {}; }
  }
  return header || null;
};

module.exports = { isId, getActiveOwnedSite, getActiveManagedSite, readSiteHeader };
