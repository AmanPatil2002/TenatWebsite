const db = require("../config/db");

// GET /public/sites/:subdomain
// Returns published site, active theme, pages, contact — everything the frontend needs to render
const getPublicSite = (req, res) => {
  const { subdomain } = req.params;
  db.query(
    `SELECT id, siteName, subdomain, templateId, categoryId
       FROM sites
      WHERE subdomain = ? AND status = 'active' AND isPublished = 1`,
    [subdomain],
    (err, siteRows) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!siteRows.length) return res.status(404).json({ message: "Site not found" });
      const site = siteRows[0];

      db.query(
        `SELECT id, name, settings, type FROM siteThemes
          WHERE siteId = ? AND isActive = 1 LIMIT 1`,
        [site.id],
        (err2, themeRows) => {
          if (err2) return res.status(500).json({ message: err2.message });

          db.query(
            `SELECT id, parentId, title, slug, pageType, content, showInMenu, sortOrder
               FROM sitePages
              WHERE siteId = ? AND isPublished = 1
              ORDER BY sortOrder, id`,
            [site.id],
            (err3, pages) => {
              if (err3) return res.status(500).json({ message: err3.message });

              db.query(
                "SELECT address, phone, email FROM contact WHERE siteId = ?",
                [site.id],
                (err4, contactRows) => {
                  if (err4) return res.status(500).json({ message: err4.message });
                  res.json({
                    site,
                    theme: themeRows[0] || null,
                    pages,
                    contact: contactRows[0] || null,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
};

// GET /public/sites/:subdomain/pages/:slug
const getPublicPage = (req, res) => {
  const { subdomain, slug } = req.params;
  db.query(
    "SELECT id FROM sites WHERE subdomain = ? AND status = 'active' AND isPublished = 1",
    [subdomain],
    (err, siteRows) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!siteRows.length) return res.status(404).json({ message: "Site not found" });

      db.query(
        `SELECT id, title, slug, pageType, content
           FROM sitePages WHERE siteId = ? AND slug = ? AND isPublished = 1`,
        [siteRows[0].id, slug],
        (err2, pageRows) => {
          if (err2) return res.status(500).json({ message: err2.message });
          if (!pageRows.length) return res.status(404).json({ message: "Page not found" });
          res.json(pageRows[0]);
        }
      );
    }
  );
};

module.exports = { getPublicSite, getPublicPage };