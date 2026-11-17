const db = require("../../config/db").promise();
const { sendError } = require("../../utils/tx");
const { tn } = require("../../config/provisionSite");
const { isId, getActiveManagedSite, readSiteHeader } = require("./access");

const isHttpUrl = (value) => {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch { return false; }
};

const SITE_HEADER_FIELDS = [
  ["siteTitle", 150], ["footerText", 65535], ["footerAddress", 300],
  ["footerPhone", 30], ["footerEmail", 190], ["copyrightText", 255],
];
const SOCIAL_PLATFORMS = ["facebook", "instagram", "youtube", "twitter", "linkedin"];

const getSiteHeader = async (req, res) => {
  const { siteId } = req.params;
  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });
  try {
    const site = await getActiveManagedSite(siteId, req);
    return res.json({ header: await readSiteHeader(siteId, site.dbName) });
  } catch (error) { return sendError(res, error); }
};

const updateSiteHeader = async (req, res) => {
  const { siteId } = req.params;
  if (!isId(siteId)) return res.status(400).json({ message: "Invalid site id" });

  const body = req.body ?? {};
  const header = {};
  for (const [field, maxLength] of SITE_HEADER_FIELDS) {
    const value = body[field] ?? "";
    if (typeof value !== "string" || value.length > maxLength) {
      return res.status(400).json({ message: `${field} must be a string of at most ${maxLength} characters` });
    }
    header[field] = value.trim() || null;
  }

  const logoUrl = body.logoUrl ?? null;
  if (logoUrl !== null && (typeof logoUrl !== "string" || logoUrl.length > 500 ||
      (!isHttpUrl(logoUrl) &&
       !new RegExp(`^/uploads/sites/${siteId}/[a-f0-9]{32}\\.(jpg|png|webp|gif)$`).test(logoUrl)))) {
    return res.status(400).json({ message: "Enter a valid logo image URL" });
  }

  const socialLinks = body.socialLinks ?? {};
  if (!socialLinks || typeof socialLinks !== "object" || Array.isArray(socialLinks) ||
      Object.keys(socialLinks).some((p) =>
        !SOCIAL_PLATFORMS.includes(p) || typeof socialLinks[p] !== "string" ||
        socialLinks[p].length > 500 ||
        (socialLinks[p].trim() && !isHttpUrl(socialLinks[p].trim())))) {
    return res.status(400).json({ message: "Enter valid social media links" });
  }
  const cleanSocialLinks = Object.fromEntries(
    Object.entries(socialLinks).map(([p, url]) => [p, url.trim()]).filter(([, url]) => url)
  );

  try {
    const site = await getActiveManagedSite(siteId, req);
    await db.query(
      `UPDATE ${tn(siteId, "headers", site.dbName)}
       SET logoUrl = ?, siteTitle = ?, footerText = ?, footerAddress = ?,
           footerPhone = ?, footerEmail = ?, copyrightText = ?, socialLinks = ?
       LIMIT 1`,
      [logoUrl, header.siteTitle, header.footerText, header.footerAddress,
       header.footerPhone, header.footerEmail, header.copyrightText,
       JSON.stringify(cleanSocialLinks)],
    );
    return res.json({
      message: "Site header and footer saved",
      header: await readSiteHeader(siteId, site.dbName),
    });
  } catch (error) { return sendError(res, error); }
};

module.exports = { getSiteHeader, updateSiteHeader };
