const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const db = require("../config/db").promise();
const { HttpError, sendError } = require("../utils/tx");

const ID_PATTERN = /^[1-9]\d{0,19}$/;
const isId = (value) =>
  ID_PATTERN.test(String(value ?? "")) &&
  BigInt(value) <= 18446744073709551615n;

/* ------------------------------------------------------------------ */
/* Image handling: local upload or pasted URL                          */
/* ------------------------------------------------------------------ */

// Serve this folder in app.js:
//   app.use("/uploads", express.static(UPLOAD_ROOT, {
//     setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
//   }));
const UPLOAD_ROOT = path.join(__dirname, "..", "uploads");

const IMAGE_EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

// Local uploads for a site look exactly like /uploads/sites/<siteId>/<32 hex>.<ext>
const localImageRegex = (siteId) =>
  new RegExp(`^/uploads/sites/${siteId}/([a-f0-9]{32}\\.(?:jpg|png|webp|gif))$`);

const isHttpUrl = (value) => {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

const isImageUrl = (value, siteId) =>
  localImageRegex(siteId).test(value) || isHttpUrl(value);

const isLinkUrl = (value) =>
  isHttpUrl(value) ||
  (value.startsWith("/") && !value.startsWith("//")) ||
  value.startsWith("#");

const isImageStillUsed = async (siteId, url) => {
  const [[row]] = await db.query(
    `SELECT (SELECT COUNT(*) FROM sitenews      WHERE siteId = ? AND imageUrl = ?)
          + (SELECT COUNT(*) FROM sitegalleries WHERE siteId = ? AND imageUrl = ?)
          + (SELECT COUNT(*) FROM siteslider    WHERE siteId = ? AND imageUrl = ?) AS used`,
    [siteId, url, siteId, url, siteId, url],
  );
  return Number(row.used) > 0;
};

// Best-effort cleanup of a replaced/deleted local upload. Never throws.
const removeLocalImage = async (siteId, url) => {
  try {
    if (!url) return;
    const match = localImageRegex(siteId).exec(url);
    if (!match) return; // remote URL or not ours
    if (await isImageStillUsed(siteId, url)) return;
    await fs.promises.unlink(
      path.join(UPLOAD_ROOT, "sites", String(siteId), match[1]),
    );
  } catch {
    /* ignore: file already gone or not removable */
  }
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(UPLOAD_ROOT, "sites", String(req.params.siteId));
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    // random name + extension from the verified mimetype, never the client's filename
    filename: (req, file, cb) =>
      cb(null, crypto.randomBytes(16).toString("hex") + IMAGE_EXT[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    IMAGE_EXT[file.mimetype]
      ? cb(null, true)
      : cb(new HttpError(400, "Only JPG, PNG, WEBP or GIF images are allowed")),
});

/* ------------------------------------------------------------------ */
/* Content types                                                       */
/* ------------------------------------------------------------------ */

const mediaTypes = {
  news: {
    table: "sitenews",
    orderBy: "createdAt DESC, id DESC",
    fields: [
      { name: "title", maxLength: 150, required: true },
      { name: "imageUrl", maxLength: 500 },
      { name: "content", maxLength: 65535, required: true },
      // { name: "publishedAt", dateTime: true },
    ],
  },
  galleries: {
    table: "sitegalleries",
    orderBy: "sortOrder, id",
    fields: [
      { name: "title", maxLength: 150 },
      { name: "imageUrl", maxLength: 500, required: true },
      { name: "caption", maxLength: 500 },
      { name: "altText", maxLength: 255 },
      { name: "sortOrder", integer: true },
    ],
  },
  slider: {
    table: "siteslider",
    orderBy: "sortOrder, id",
    fields: [
      { name: "title", maxLength: 150 },
      { name: "imageUrl", maxLength: 500, required: true },
      { name: "sortOrder", integer: true },
    ],
  },
};

const getSiteId = (req) => {
  const { siteId } = req.params;
  if (!isId(siteId)) throw new HttpError(400, "Invalid site id");
  if (String(req.siteAdmin.siteId) !== String(siteId)) {
    throw new HttpError(403, "This login is not assigned to the requested site");
  }
  return siteId;
};

const ensureActiveSite = async (siteId) => {
  const [[site]] = await db.query(
    `SELECT s.id
       FROM sites s
       JOIN payments p ON p.id = s.paymentId
      WHERE s.id = ? AND s.status = 'active'
        AND s.expiresAt > CURRENT_TIMESTAMP
        AND p.status = 'captured'`,
    [siteId],
  );
  if (!site) throw new HttpError(403, "Site is inactive or expired");
};

const readRecord = (type, body, siteId) => {
  const values = [];
  let imageUrl = null;

  for (const field of mediaTypes[type].fields) {
    let value = body[field.name];
    if (field.integer) {
      value = value === "" || value === undefined ? 0 : Number(value);
      if (!Number.isInteger(value) || value < 0 || value > 4294967295) {
        return {
          error: "Display order must be a whole number from 0 to 4,294,967,295",
        };
      }
    } else if (field.dateTime) {
      if (value === "" || value === null || value === undefined) {
        value = null;
      } else if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value) ||
        Number.isNaN(Date.parse(value))
      ) {
        return { error: "Enter a valid publish date and time" };
      } else {
        value = value.replace("T", " ");
        if (value.length === 16) value += ":00";
      }
    } else {
      if (value === undefined || value === null) value = "";
      if (typeof value !== "string") {
        return { error: `${field.name} must be text` };
      }
      value = value.trim();
      if (field.required && !value) return { error: `${field.name} is required` };
      if (value.length > field.maxLength) {
        return {
          error: `${field.name} must be ${field.maxLength} characters or fewer`,
        };
      }
      if (field.name === "content" && Buffer.byteLength(value, "utf8") > 65535) {
        return { error: "Content is too large to store" };
      }
      if (value && field.name === "imageUrl" && !isImageUrl(value, siteId)) {
        return {
          error: "Image must be an uploaded image or a valid http(s) URL",
        };
      }
      if (value && field.name === "buttonUrl" && !isLinkUrl(value)) {
        return {
          error: "Button link must be a valid URL or a path starting with /",
        };
      }
      if (!value) value = null;
      if (field.name === "imageUrl") imageUrl = value;
    }
    values.push(value);
  }

  const status = body.status ?? "active";
  if (!["active", "inactive"].includes(status)) {
    return { error: "Status must be active or inactive" };
  }
  values.push(status);
  return { values, imageUrl };
};

/* ------------------------------------------------------------------ */
/* CRUD handlers                                                       */
/* ------------------------------------------------------------------ */

const createHandlers = (type) => {
  const config = mediaTypes[type];
  const columns = [...config.fields.map(({ name }) => name), "status"];

  const list = async (req, res) => {
    try {
      const siteId = getSiteId(req);
      await ensureActiveSite(siteId);
      const [rows] = await db.query(
        `SELECT id, ${columns.join(", ")}, createdAt, updatedAt
           FROM ${config.table}
          WHERE siteId = ?
          ORDER BY ${config.orderBy}`,
        [siteId],
      );
      return res.json(rows);
    } catch (error) {
      return sendError(res, error);
    }
  };

  const create = async (req, res) => {
    try {
      const siteId = getSiteId(req);
      await ensureActiveSite(siteId);
      const record = readRecord(type, req.body ?? {}, siteId);
      if (record.error) return res.status(400).json({ message: record.error });

      const placeholders = columns.map(() => "?").join(", ");
      const [result] = await db.query(
        `INSERT INTO ${config.table} (siteId, ${columns.join(", ")})
         VALUES (?, ${placeholders})`,
        [siteId, ...record.values],
      );
      return res
        .status(201)
        .json({ id: result.insertId, message: "Content created" });
    } catch (error) {
      return sendError(res, error);
    }
  };

  const update = async (req, res) => {
    if (!isId(req.params.itemId)) {
      return res.status(400).json({ message: "Invalid content id" });
    }
    try {
      const siteId = getSiteId(req);
      await ensureActiveSite(siteId);
      const record = readRecord(type, req.body ?? {}, siteId);
      if (record.error) return res.status(400).json({ message: record.error });

      const [[existing]] = await db.query(
        `SELECT id, imageUrl FROM ${config.table} WHERE id = ? AND siteId = ?`,
        [req.params.itemId, siteId],
      );
      if (!existing) throw new HttpError(404, "Content not found");

      const assignments = columns.map((column) => `${column} = ?`).join(", ");
      await db.query(
        `UPDATE ${config.table}
            SET ${assignments}
          WHERE id = ? AND siteId = ?`,
        [...record.values, req.params.itemId, siteId],
      );

      if (existing.imageUrl && existing.imageUrl !== record.imageUrl) {
        await removeLocalImage(siteId, existing.imageUrl);
      }
      return res.json({ message: "Content updated" });
    } catch (error) {
      return sendError(res, error);
    }
  };

  const remove = async (req, res) => {
    if (!isId(req.params.itemId)) {
      return res.status(400).json({ message: "Invalid content id" });
    }
    try {
      const siteId = getSiteId(req);
      await ensureActiveSite(siteId);

      const [[existing]] = await db.query(
        `SELECT id, imageUrl FROM ${config.table} WHERE id = ? AND siteId = ?`,
        [req.params.itemId, siteId],
      );
      if (!existing) throw new HttpError(404, "Content not found");

      await db.query(
        `DELETE FROM ${config.table} WHERE id = ? AND siteId = ?`,
        [req.params.itemId, siteId],
      );
      await removeLocalImage(siteId, existing.imageUrl);
      return res.json({ message: "Content deleted" });
    } catch (error) {
      return sendError(res, error);
    }
  };

  return { list, create, update, remove };
};

const listPublishedMedia = async (req, res) => {
  const { siteId } = req.params;
  if (!isId(siteId)) {
    return res.status(400).json({ message: "Invalid site id" });
  }

  try {
    if (req.siteAdmin) {
      if (String(req.siteAdmin.siteId) !== String(siteId)) {
        throw new HttpError(403, "This login is not assigned to the requested site");
      }
    } else {
      const [[site]] = await db.query(
        `SELECT s.id
           FROM sites s
           JOIN payments p ON p.id = s.paymentId
          WHERE s.id = ? AND s.userId = ?`,
        [siteId, req.user.userId],
      );
      if (!site) throw new HttpError(404, "Site not found");
    }

    await ensureActiveSite(siteId);
    const [news, galleries, slider] = await Promise.all([
      db.query(
        `SELECT id, title, imageUrl, content, createdAt
           FROM sitenews
          WHERE siteId = ? AND status = 'active'
          ORDER BY createdAt DESC, id DESC`,
        [siteId],
      ),
      db.query(
        `SELECT id, title, imageUrl, caption, altText, sortOrder
           FROM sitegalleries
          WHERE siteId = ? AND status = 'active'
          ORDER BY sortOrder, id`,
        [siteId],
      ),
      db.query(
        `SELECT id, title, imageUrl, sortOrder
           FROM siteslider
          WHERE siteId = ? AND status = 'active'
          ORDER BY sortOrder, id`,
        [siteId],
      ),
    ]);

    return res.json({
      news: news[0],
      galleries: galleries[0],
      slider: slider[0],
    });
  } catch (error) {
    return sendError(res, error);
  }
};

/* ------------------------------------------------------------------ */
/* Upload endpoint: POST /sites/:siteId/media/upload  (field: "image") */
/* ------------------------------------------------------------------ */

const uploadImage = [
  // Verify site ownership and status BEFORE multer writes anything to disk
  async (req, res, next) => {
    try {
      await ensureActiveSite(getSiteId(req));
      next();
    } catch (error) {
      sendError(res, error);
    }
  },
  (req, res, next) =>
    upload.single("image")(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          message:
            err.code === "LIMIT_FILE_SIZE"
              ? "Image must be 5 MB or smaller"
              : err.message,
        });
      }
      return sendError(res, err);
    }),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }
    return res.status(201).json({
      imageUrl: `/uploads/sites/${req.params.siteId}/${req.file.filename}`,
    });
  },
];

module.exports = {
  news: createHandlers("news"),
  galleries: createHandlers("galleries"),
  slider: createHandlers("slider"),
  listPublishedMedia,
  uploadImage,
  UPLOAD_ROOT,
};