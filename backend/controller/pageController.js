const db = require("../config/db");

// GET /site/:siteId/pages
const listPages = (req, res) => {
  db.query(
    `SELECT id, parentId, title, slug, pageType, content, contentVersion,
            pageLink, isPublished, showInMenu, sortOrder
       FROM sitePages WHERE siteId = ?
      ORDER BY sortOrder, id`,
    [req.params.siteId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

// POST /site/:siteId/pages
const createPage = (req, res) => {
  const { title, slug, parentId = null, pageType = "custom",
          content = [], showInMenu = 1, sortOrder = 0 } = req.body;

  if (!title || !slug) {
    return res.status(400).json({ message: "title, slug required" });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ message: "slug must be lowercase a-z0-9-" });
  }

  db.query(
    `INSERT INTO sitePages
       (siteId, adminId, parentId, title, slug, pageType, content, showInMenu, sortOrder)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [req.params.siteId, req.siteAdmin.adminId, parentId, title, slug,
     pageType, JSON.stringify(content), showInMenu ? 1 : 0, sortOrder],
    (err, result) => {
      if (err?.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Slug already exists for this parent" });
      }
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ id: result.insertId });
    }
  );
};

// PUT /site/:siteId/pages/:pageId
const updatePage = (req, res) => {
  const { title, content, showInMenu, isPublished, sortOrder } = req.body;
  const { siteId, pageId } = req.params;

  // Snapshot previous content into revisions
  db.query(
    "SELECT content FROM sitePages WHERE id = ? AND siteId = ?",
    [pageId, siteId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!rows.length) return res.status(404).json({ message: "Not found" });

      const prev = rows[0].content;
      const doUpdate = () => {
        db.query(
          `UPDATE sitePages SET
             title = COALESCE(?, title),
             content = COALESCE(?, content),
             showInMenu = COALESCE(?, showInMenu),
             isPublished = COALESCE(?, isPublished),
             sortOrder = COALESCE(?, sortOrder)
           WHERE id = ? AND siteId = ?`,
          [
            title ?? null,
            content ? JSON.stringify(content) : null,
            showInMenu != null ? (showInMenu ? 1 : 0) : null,
            isPublished != null ? (isPublished ? 1 : 0) : null,
            sortOrder ?? null,
            pageId, siteId,
          ],
          (err2) => {
            if (err2) return res.status(500).json({ message: err2.message });
            res.json({ ok: true });
          }
        );
      };

      if (prev) {
        db.query(
          "INSERT INTO sitePageRevisions (pageId, adminId, content) VALUES (?,?,?)",
          [pageId, req.siteAdmin.adminId, prev],
          (errRev) => {
            if (errRev) return res.status(500).json({ message: errRev.message });
            doUpdate();
          }
        );
      } else {
        doUpdate();
      }
    }
  );
};

// DELETE /site/:siteId/pages/:pageId
const deletePage = (req, res) => {
  db.query(
    "DELETE FROM sitePages WHERE id = ? AND siteId = ?",
    [req.params.pageId, req.params.siteId],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ ok: true });
    }
  );
};

module.exports = { listPages, createPage, updatePage, deletePage };