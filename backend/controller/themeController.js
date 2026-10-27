const db = require("../config/db");

// Colours end up inside CSS later, so only accept hex values (#fff or #ffffff)
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const fail = (res, err) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
};

const listThemes = (req, res) => {
  db.query("SELECT * FROM theme ORDER BY createdAt DESC", (err, rows) => {
    if (err) return fail(res, err);
    res.json(rows);
  });
};

const createTheme = (req, res) => {
  const { name, color, background } = req.body;

  if (!name?.trim() || !color?.trim() || !background?.trim()) {
    return res
      .status(400)
      .json({ message: "Name, color and background are required" });
  }
  if (name.trim().length > 190) {
    return res
      .status(400)
      .json({ message: "Name must be 190 characters or fewer" });
  }
  if (!HEX.test(color.trim()) || !HEX.test(background.trim())) {
    return res
      .status(400)
      .json({ message: "Color and background must be hex values like #ffffff" });
  }

  // JWT payload is { userId, name, role }
  const createdBy = req.user.userId;

  db.query(
    `INSERT INTO theme (name, color, background, createdBy)
     VALUES (?, ?, ?, ?)`,
    [name.trim(), color.trim(), background.trim(), createdBy],
    (err, result) => {
      if (err) return fail(res, err);
      res.status(201).json({ id: result.insertId });
    },
  );
};

const updateTheme = (req, res) => {
  const { name, color, background } = req.body;

  if (name && name.trim().length > 190) {
    return res
      .status(400)
      .json({ message: "Name must be 190 characters or fewer" });
  }
  if (color && !HEX.test(color.trim())) {
    return res
      .status(400)
      .json({ message: "Color must be a hex value like #ffffff" });
  }
  if (background && !HEX.test(background.trim())) {
    return res
      .status(400)
      .json({ message: "Background must be a hex value like #121212" });
  }

  db.query(
    `UPDATE theme SET
       name = COALESCE(?, name),
       color = COALESCE(?, color),
       background = COALESCE(?, background)
     WHERE themeId = ?`,
    [
      name?.trim() || null,
      color?.trim() || null,
      background?.trim() || null,
      req.params.themeId,
    ],
    (err, result) => {
      if (err) return fail(res, err);
      if (!result.affectedRows) {
        return res.status(404).json({ message: "Not found" });
      }
      res.json({ ok: true });
    },
  );
};

const deleteTheme = (req, res) => {
  db.query(
    "DELETE FROM theme WHERE themeId = ?",
    [req.params.themeId],
    (err, result) => {
      if (err) return fail(res, err);
      if (!result.affectedRows) {
        return res.status(404).json({ message: "Not found" });
      }
      res.json({ message: "Theme deleted" });
    },
  );
};

module.exports = { listThemes, createTheme, updateTheme, deleteTheme };