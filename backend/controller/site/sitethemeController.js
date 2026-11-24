// controllers/siteTheme.controller.js
const { validateCustomTheme } = require('../../middleware/themeservice');
const db = require('../../config/db').promise();

/**
 * Helper: load a sitetheme row joined with site ownership info.
 * Returns null if not found.
 */
async function loadSiteTheme(dbConn, siteId) {
  const [rows] = await dbConn.query(
    `SELECT st.siteId,
            st.defaultThemeId,
            st.defaultTheme,
            st.customTheme,
            st.activeTheme,
            st.updatedAt,
            s.userId,
            s.name AS siteName
       FROM sitethemes st
       JOIN sites s ON s.id = st.siteId
      WHERE st.siteId = ?`,
    [siteId]
  );
  return rows[0] || null;
}

/**
 * Authorization:
 *   - admin role: full access to every site
 *   - client role: only sites they own (sites.userId = req.user.userId)
 * Optionally also allow the per-site admin (admin table) — adjust to your auth model.
 */
function canManageSite(user, siteThemeRow) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  // siteAdmin role (from authenticateSiteAdmin) should be allowed if they own/manage the site
  if (user.role === 'siteAdmin') return Number(user.userId) === Number(siteThemeRow.userId);
  return Number(user.userId) === Number(siteThemeRow.userId);
}

function getThemeUser(req) {
  return req.user || (req.siteAdmin
    ? { role: 'siteAdmin', userId: req.siteAdmin.userId }
    : null);
}

async function loadOrCreateSiteTheme(siteId, user) {
  const [[site]] = await db.query(
    `SELECT s.id AS siteId, s.userId, s.themeId, th.color, th.background
       FROM sites s
       JOIN theme th ON th.themeId = s.themeId
      WHERE s.id = ?`,
    [siteId]
  );
  if (!site) return { status: 404 };
  if (!canManageSite(user, site)) return { status: 403 };

  await db.query(
    `INSERT IGNORE INTO sitethemes (siteId, defaultThemeId, defaultTheme)
     VALUES (?, ?, ?)`,
    [
      site.siteId,
      site.themeId,
      JSON.stringify({ color: site.color, background: site.background }),
    ]
  );

  return { row: await loadSiteTheme(db, siteId) };
}

// -------------------------------------------------------------------
// GET /sites/:siteId/theme
// Returns both the default and custom theme + which one is active.
// -------------------------------------------------------------------
exports.getTheme = async (req, res) => {
  const siteId = Number(req.params.siteId);

  try {
    const result = await loadOrCreateSiteTheme(siteId, getThemeUser(req));
    if (result.status) {
      return res
        .status(result.status)
        .json({ error: result.status === 404 ? 'Site not found' : 'Forbidden' });
    }
    const { row } = result;

    // If customTheme is null, expose the default as the effective theme
    const effectiveTheme =
      row.activeTheme === 'custom' && row.customTheme
        ? row.customTheme
        : row.defaultTheme;

    return res.json({
      siteId: row.siteId,
      siteName: row.siteName,
      activeTheme: row.activeTheme,
      defaultTheme: row.defaultTheme,
      customTheme: row.customTheme,
      effectiveTheme,
      updatedAt: row.updatedAt,
    });
  } catch (err) {
    console.error('getTheme error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getPublicTheme = async (req, res) => {
  const siteId = Number(req.params.siteId);
  if (!Number.isSafeInteger(siteId) || siteId <= 0) {
    return res.status(400).json({ error: "Invalid site id" });
  }
  try {
    const { getPublicSite } = require("./access");
    await getPublicSite(String(siteId));
    const [[site]] = await db.query(
      `SELECT s.name AS siteName, th.color, th.background,
              st.defaultTheme, st.customTheme, st.activeTheme
         FROM sites s
         JOIN theme th ON th.themeId = s.themeId
         LEFT JOIN sitethemes st ON st.siteId = s.id
        WHERE s.id = ?`,
      [siteId],
    );
    if (!site) return res.status(404).json({ error: "Site not found" });
    let effectiveTheme = { color: site.color, background: site.background };
    if (site.activeTheme === "custom" && site.customTheme) {
      effectiveTheme = site.customTheme;
    } else if (site.defaultTheme) {
      effectiveTheme = site.defaultTheme;
    }
    return res.json({
      siteId,
      siteName: site.siteName,
      activeTheme: site.activeTheme || "default",
      effectiveTheme,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error("getPublicTheme error", error);
    return res.status(500).json({ error: "Could not load public theme" });
  }
};

// -------------------------------------------------------------------
// PUT /sites/:siteId/theme/custom
// Body: { customTheme: { color: "...", background: "..." }, activeTheme?: "custom"|"default" }
// Merges the supplied keys onto the existing customTheme (or defaultTheme).
// Set a key to null to remove that override.
// -------------------------------------------------------------------
exports.updateCustomTheme = async (req, res) => {
  const siteId = Number(req.params.siteId);
  const { customTheme, activeTheme } = req.body || {};
  const userForAuth = getThemeUser(req);

  if (!customTheme || typeof customTheme !== 'object') {
    return res.status(400).json({ error: 'customTheme object is required' });
  }
  if (activeTheme && !['default', 'custom'].includes(activeTheme)) {
    return res.status(400).json({ error: 'activeTheme must be "default" or "custom"' });
  }

  let conn;
  try {
    const result = await loadOrCreateSiteTheme(siteId, userForAuth);
    if (result.status) {
      return res
        .status(result.status)
        .json({ error: result.status === 404 ? 'Site not found' : 'Forbidden' });
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT st.siteId, st.defaultTheme, st.customTheme, st.activeTheme, s.userId
         FROM sitethemes st
         JOIN sites s ON s.id = st.siteId
        WHERE st.siteId = ?
        FOR UPDATE`,
      [siteId]
    );
    const row = rows[0];
    if (!row) {
      await conn.rollback();
      return res.status(404).json({ error: 'Site not found' });
    }
    if (!canManageSite(userForAuth, row)) {
      await conn.rollback();
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Merge: start from existing customTheme (or empty), apply incoming keys,
    // drop keys explicitly set to null.
    const merged = { ...(row.customTheme || {}) };
    for (const [key, value] of Object.entries(customTheme)) {
      if (value === null) {
        delete merged[key];
      } else {
        merged[key] = value;
      }
    }

    // Validate merged result against the default theme's allowed keys
    const validation = validateCustomTheme(merged, row.defaultTheme);
    if (!validation.ok) {
      await conn.rollback();
      return res.status(422).json({ error: validation.message });
    }

    // If nothing left after merge, store NULL
    const finalCustom = Object.keys(merged).length ? merged : null;

    // Decide the new active theme
    let newActive = activeTheme || row.activeTheme;
    if (newActive === 'custom' && !finalCustom) {
      await conn.rollback();
      return res
        .status(422)
        .json({ error: 'Cannot activate custom theme: customTheme is empty' });
    }

    await conn.query(
      `UPDATE sitethemes
          SET customTheme  = ?,
              activeTheme  = ?
        WHERE siteId = ?`,
      [finalCustom ? JSON.stringify(finalCustom) : null, newActive, siteId]
    );

    await conn.commit();

    return res.json({
      siteId,
      activeTheme: newActive,
      defaultTheme: row.defaultTheme,
      customTheme: finalCustom,
      effectiveTheme: newActive === 'custom' ? finalCustom : row.defaultTheme,
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('updateCustomTheme error', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (conn) conn.release();
  }
};

// -------------------------------------------------------------------
// PATCH /sites/:siteId/theme/active
// Body: { activeTheme: "default" | "custom" }
// Toggle without touching the JSON.
// -------------------------------------------------------------------
exports.setActiveTheme = async (req, res) => {
  const siteId = Number(req.params.siteId);
  const { activeTheme } = req.body || {};

  if (!['default', 'custom'].includes(activeTheme)) {
    return res.status(400).json({ error: 'activeTheme must be "default" or "custom"' });
  }

  try {
    const result = await loadOrCreateSiteTheme(siteId, getThemeUser(req));
    if (result.status) {
      return res
        .status(result.status)
        .json({ error: result.status === 404 ? 'Site not found' : 'Forbidden' });
    }
    const { row } = result;
    const userForAuth = req.user || (req.siteAdmin ? { role: 'siteAdmin', userId: req.siteAdmin.userId } : null);
    if (!canManageSite(userForAuth, row)) return res.status(403).json({ error: 'Forbidden' });

    if (activeTheme === 'custom' && !row.customTheme) {
      return res
        .status(422)
        .json({ error: 'Cannot activate custom theme: no customTheme configured' });
    }

    await db.query(`UPDATE sitethemes SET activeTheme = ? WHERE siteId = ?`, [
      activeTheme,
      siteId,
    ]);

    return res.json({
      siteId,
      activeTheme,
      effectiveTheme: activeTheme === 'custom' ? row.customTheme : row.defaultTheme,
    });
  } catch (err) {
    console.error('setActiveTheme error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// -------------------------------------------------------------------
// DELETE /sites/:siteId/theme/custom
// Resets to default: clears customTheme and forces activeTheme = 'default'.
// -------------------------------------------------------------------
exports.resetToDefault = async (req, res) => {
  const siteId = Number(req.params.siteId);
  const userForAuth = req.user || (req.siteAdmin ? { role: 'siteAdmin', userId: req.siteAdmin.userId } : null);

  try {
    const result = await loadOrCreateSiteTheme(siteId, userForAuth);
    if (result.status) {
      return res
        .status(result.status)
        .json({ error: result.status === 404 ? 'Site not found' : 'Forbidden' });
    }
    const { row } = result;
    if (!canManageSite(userForAuth, row)) return res.status(403).json({ error: 'Forbidden' });

    await db.query(
      `UPDATE sitethemes
          SET customTheme = NULL, activeTheme = 'default'
        WHERE siteId = ?`,
      [siteId]
    );

    return res.json({
      siteId,
      activeTheme: 'default',
      customTheme: null,
      effectiveTheme: row.defaultTheme,
    });
  } catch (err) {
    console.error('resetToDefault error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};