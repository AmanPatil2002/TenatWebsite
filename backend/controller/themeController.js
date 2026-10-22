const db = require("../config/db");

// GET /site/:siteId/themes
const listThemes = (req, res) => {
  db.query(
    "SELECT id, name, settings, type, isActive FROM siteThemes WHERE siteId = ? ORDER BY id",
    [req.params.siteId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

// POST /site/:siteId/themes
const createTheme = (req, res) => {
  const { name, settings, type = "custom" } = req.body;
  if (!name || !settings) {
    return res.status(400).json({ message: "name, settings required" });
  }
  db.query(
    `INSERT INTO siteThemes (siteId, adminId, name, settings, type, isActive)
     VALUES (?,?,?,?,?,0)`,
    [req.params.siteId, req.siteAdmin.adminId, name,
     JSON.stringify(settings), type],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ id: result.insertId });
    }
  );
};

// PUT /site/:siteId/themes/:themeId
const updateTheme = (req, res) => {
  const { name, settings } = req.body;
  db.query(
    `UPDATE siteThemes SET
       name = COALESCE(?, name),
       settings = COALESCE(?, settings)
     WHERE id = ? AND siteId = ?`,
    [name ?? null, settings ? JSON.stringify(settings) : null,
     req.params.themeId, req.params.siteId],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!result.affectedRows) return res.status(404).json({ message: "Not found" });
      res.json({ ok: true });
    }
  );
};

// PATCH /site/:siteId/themes/:themeId/activate
const activateTheme = (req, res) => {
  const { siteId, themeId } = req.params;
  db.query("UPDATE siteThemes SET isActive = 0 WHERE siteId = ?", [siteId], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    db.query(
      "UPDATE siteThemes SET isActive = 1 WHERE id = ? AND siteId = ?",
      [themeId, siteId],
      (err2, result) => {
        if (err2) return res.status(500).json({ message: err2.message });
        if (!result.affectedRows) return res.status(404).json({ message: "Not found" });
        res.json({ ok: true });
      }
    );
  });
};

module.exports = { listThemes, createTheme, updateTheme, activateTheme };