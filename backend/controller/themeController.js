const db = require("../config/db");

const NAME_MIN = 2;
const NAME_MAX = 100;
const THEME_TYPES = ["default", "dark", "custom"];
const MAX_SETTINGS_BYTES = 50 * 1024;

// Log the real error, send a generic message to the client
const fail = (res, err) => {
  console.error(err);
  return res.status(500).json({ message: "Server error" });
};

const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

// Returns an error message, or null if valid
const checkName = (name) => {
  if (typeof name !== "string") return "name must be a string";
  const n = name.trim();
  if (n.length < NAME_MIN || n.length > NAME_MAX) {
    return `name must be ${NAME_MIN}–${NAME_MAX} characters`;
  }
  return null;
};

const checkSettings = (settings) => {
  if (!isPlainObject(settings)) return "settings must be a JSON object";
  if (Buffer.byteLength(JSON.stringify(settings)) > MAX_SETTINGS_BYTES) {
    return "settings is too large";
  }
  return null;
};

// GET /site/:siteId/themes
const listThemes = (req, res) => {
  db.query(
    "SELECT id, name, settings, type, isActive FROM siteThemes WHERE siteId = ? ORDER BY id",
    [req.params.siteId],
    (err, rows) => {
      if (err) return fail(res, err);
      res.json(rows);
    }
  );
};

// POST /site/:siteId/themes
const createTheme = (req, res) => {
  const { name, settings, type = "custom" } = req.body;

  const nameErr = checkName(name);
  if (nameErr) return res.status(400).json({ message: nameErr });

  const settingsErr = checkSettings(settings);
  if (settingsErr) return res.status(400).json({ message: settingsErr });

  const cleanType = typeof type === "string" ? type.trim() : "";
  if (!THEME_TYPES.includes(cleanType)) {
    return res.status(400).json({ message: "type must be default, dark, or custom" });
  }

  db.query(
    `INSERT INTO siteThemes (siteId, adminId, name, settings, type, isActive)
     VALUES (?,?,?,?,?,0)`,
    [
      req.params.siteId,
      req.siteAdmin.adminId,
      name.trim(),
      JSON.stringify(settings),
      cleanType,
    ],
    (err, result) => {
      if (err) return fail(res, err);
      res.status(201).json({ id: result.insertId });
    }
  );
};

// PUT /site/:siteId/themes/:themeId
// name and settings are both optional, but at least one must be sent.
const updateTheme = (req, res) => {
  const { name, settings } = req.body;

  let cleanName = null;
  if (name !== undefined) {
    const nameErr = checkName(name);
    if (nameErr) return res.status(400).json({ message: nameErr });
    cleanName = name.trim();
  }

  let settingsJson = null;
  if (settings !== undefined) {
    const settingsErr = checkSettings(settings);
    if (settingsErr) return res.status(400).json({ message: settingsErr });
    settingsJson = JSON.stringify(settings);
  }

  if (cleanName === null && settingsJson === null) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  db.query(
    `UPDATE siteThemes SET
       name = COALESCE(?, name),
       settings = COALESCE(?, settings)
     WHERE id = ? AND siteId = ?`,
    [cleanName, settingsJson, req.params.themeId, req.params.siteId],
    (err, result) => {
      if (err) return fail(res, err);
      if (!result.affectedRows) {
        return res.status(404).json({ message: "Not found" });
      }
      res.json({ ok: true });
    }
  );
};

// PATCH /site/:siteId/themes/:themeId/activate
// 1) make sure the theme exists for this site, 2) switch in ONE statement.
// The old version deactivated every theme first, so a wrong themeId left the
// site with no active theme at all.
const activateTheme = async (req, res) => {
  const { siteId, themeId } = req.params;
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT id FROM siteThemes WHERE id = ? AND siteId = ?",
      [themeId, siteId]
    );
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Not found" });
    }
    await connection.execute("UPDATE siteThemes SET isActive = 0 WHERE siteId = ?", [siteId]);
    await connection.execute(
      "UPDATE siteThemes SET isActive = 1 WHERE id = ? AND siteId = ?",
      [themeId, siteId]
    );
    await connection.commit();
    res.json({ ok: true });
  } catch (error) {
    await connection.rollback();
    fail(res, error);
  } finally {
    connection.release();
  }
};

const deleteTheme = (req, res) => {
  db.query(
    "DELETE FROM siteThemes WHERE id = ? AND siteId = ? AND isActive = 0",
    [req.params.themeId, req.params.siteId],
    (err, result) => {
      if (err) return fail(res, err);
      if (result.affectedRows) return res.json({ message: "Theme deleted" });
      db.query(
        "SELECT id, isActive FROM siteThemes WHERE id = ? AND siteId = ?",
        [req.params.themeId, req.params.siteId],
        (findErr, rows) => {
          if (findErr) return fail(res, findErr);
          if (!rows.length) return res.status(404).json({ message: "Not found" });
          res.status(409).json({ message: "Activate another theme before deleting this one" });
        }
      );
    }
  );
};

module.exports = { listThemes, createTheme, updateTheme, activateTheme, deleteTheme };