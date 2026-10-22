const db = require("../config/db");

/**
 * provisionSite
 * Inputs: { userId, templateId, paymentId, invoiceId, siteName, subdomain }
 * Flow:
 *   1. INSERT site
 *   2. INSERT admin membership (owner)
 *   3. Copy templateThemes -> siteThemes
 *   4. Copy templatePages -> sitePages (resolve parentId hierarchy)
 *   5. Log each step into siteProvisioning
 */
function provisionSite(opts, cb) {
  const { userId, templateId, paymentId, invoiceId, siteName, subdomain } = opts;

  db.query(
    "SELECT categoryId, validityDays FROM template WHERE templateId = ?",
    [templateId],
    (err, tplRows) => {
      if (err) return cb(err);
      if (!tplRows.length) return cb(new Error("Template not found"));

      const { categoryId, validityDays } = tplRows[0];
      const validFrom = new Date();
      const validUntil = new Date(validFrom.getTime() + validityDays * 86400000);

      db.query(
        `INSERT INTO sites
           (userId, templateId, categoryId, paymentId, invoiceId, siteName,
            subdomain, status, isPublished, validFrom, validUntil)
         VALUES (?,?,?,?,?,?,?, 'active', 0, ?, ?)`,
        [userId, templateId, categoryId, paymentId, invoiceId,
         siteName, subdomain, validFrom, validUntil],
        (err2, siteRes) => {
          if (err2) return cb(err2);
          const siteId = siteRes.insertId;

          db.query(
            `INSERT INTO admin (siteId, userId, role) VALUES (?, ?, 'owner')`,
            [siteId, userId],
            (err3, adminRes) => {
              if (err3) return cb(err3);
              const adminId = adminRes.insertId;

              // Copy themes
              db.query(
                `SELECT id, name, settings, type, isDefault
                   FROM templateThemes WHERE templateId = ?`,
                [templateId],
                (err4, themes) => {
                  if (err4) return cb(err4);

                  const insertThemesSequential = (i) => {
                    if (i >= themes.length) return afterThemes();
                    const t = themes[i];
                    db.query(
                      `INSERT INTO siteThemes
                         (siteId, adminId, templateThemeId, name, settings, type, isActive)
                       VALUES (?,?,?,?,?,?,?)`,
                      [siteId, adminId, t.id, t.name, t.settings, t.type,
                       t.isDefault ? 1 : 0],
                      (err) => {
                        if (err) return cb(err);
                        insertThemesSequential(i + 1);
                      }
                    );
                  };

                  const afterThemes = () => {
                    // Copy pages: parents first, then children
                    db.query(
                      `SELECT id, parentId, title, slug, pageType, content,
                              contentVersion, showInMenu, sortOrder
                         FROM templatePages
                        WHERE templateId = ?
                        ORDER BY (parentId IS NULL) DESC, sortOrder`,
                      [templateId],
                      (err5, pages) => {
                        if (err5) return cb(err5);

                        const idMap = {};
                        const insertPagesSequential = (i) => {
                          if (i >= pages.length) return done();
                          const p = pages[i];
                          const newParentId = p.parentId ? idMap[p.parentId] : null;

                          db.query(
                            `INSERT INTO sitePages
                               (siteId, adminId, parentId, title, slug, pageType,
                                content, contentVersion, isPublished, showInMenu, sortOrder)
                             VALUES (?,?,?,?,?,?,?,?,1,?,?)`,
                            [siteId, adminId, newParentId, p.title, p.slug,
                             p.pageType, p.content, p.contentVersion || 1,
                             p.showInMenu, p.sortOrder],
                            (err) => {
                              if (err) return cb(err);
                              idMap[p.id] = arguments[1]?.insertId ?? null;
                              // args[1] won't work in arrow fn; use a wrapper
                              insertPagesSequential(i + 1);
                            }
                          );
                        };

                        // Reimplement to properly capture insertId
                        const runPage = (i) => {
                          if (i >= pages.length) return done();
                          const p = pages[i];
                          const newParentId = p.parentId ? idMap[p.parentId] : null;
                          db.query(
                            `INSERT INTO sitePages
                               (siteId, adminId, parentId, title, slug, pageType,
                                content, contentVersion, isPublished, showInMenu, sortOrder)
                             VALUES (?,?,?,?,?,?,?,?,1,?,?)`,
                            [siteId, adminId, newParentId, p.title, p.slug,
                             p.pageType, p.content, p.contentVersion || 1,
                             p.showInMenu, p.sortOrder],
                            (e, r) => {
                              if (e) return cb(e);
                              idMap[p.id] = r.insertId;
                              runPage(i + 1);
                            }
                          );
                        };

                        const done = () => {
                          db.query(
                            `INSERT INTO siteProvisioning (siteId, step, status, details)
                             VALUES (?, 'done', 'ok', ?)`,
                            [siteId, JSON.stringify({
                              themes: themes.length, pages: pages.length,
                            })],
                            (err6) => {
                              if (err6) return cb(err6);
                              cb(null, { siteId, adminId });
                            }
                          );
                        };

                        runPage(0);
                      }
                    );
                  };

                  insertThemesSequential(0);
                }
              );
            }
          );
        }
      );
    }
  );
}

module.exports = { provisionSite };