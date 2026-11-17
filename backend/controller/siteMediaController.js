const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const db = require("../config/db").promise();
const { HttpError, sendError } = require("../utils/tx");
const { tn } = require("../config/provisionSite");
const siteData = require("./siteDataController");

const ID_PATTERN = /^[1-9]\d{0,19}$/;
const isId = (value) =>
  ID_PATTERN.test(String(value ?? "")) &&
  BigInt(value) <= 18446744073709551615n;

const UPLOAD_ROOT = path.join(__dirname, "..", "uploads");

const IMAGE_EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const localImageRegex = (siteId) =>
  new RegExp(`^/uploads/sites/${siteId}/([a-f0-9]{32}\.(?:jpg|png|webp|gif))$`);

const isHttpUrl = (value) => {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

// const isImageUrl = (value, siteId) =>
//   localImageRegex(siteId).test(value) || isHttpUrl(value);

const isImageStillUsed = async (siteId, dbName, url) => {
  const [[row]] = await db.query(
    `SELECT (SELECT COUNT(*) FROM ${tn(siteId, "news", dbName)}      WHERE imageUrl = ?)
          + (SELECT COUNT(*) FROM ${tn(siteId, "galleries", dbName)} WHERE imageUrl = ?)
          + (SELECT COUNT(*) FROM ${tn(siteId, "slider", dbName)}    WHERE imageUrl = ?) AS used`,
    [url, url, url],
  );
  return Number(row.used) > 0;
};

// const removeLocalImage = async (siteId, dbName, url) => {
//   try {
//     if (!url) return;
//     const match = localImageRegex(siteId).exec(url);
//     if (!match) return;
//     if (await isImageStillUsed(siteId, dbName, url)) return;
//     await fs.promises.unlink(
//       path.join(UPLOAD_ROOT, "sites", String(siteId), match[1]),
//     );
//   } catch {
//   }
// };

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(UPLOAD_ROOT, "sites", String(req.params.siteId));
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) =>
      cb(null, crypto.randomBytes(16).toString("hex") + IMAGE_EXT[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    IMAGE_EXT[file.mimetype]
      ? cb(null, true)
      : cb(new HttpError(400, "Only JPG, PNG, WEBP or GIF images are allowed")),
});

const ensureActiveSite = async (siteId) => {
  const [[site]] = await db.query(
    `SELECT s.id, s.dbName
       FROM sites s
       JOIN payments p ON p.id = s.paymentId
      WHERE s.id = ? AND s.status = 'active'
        AND s.expiresAt > CURRENT_TIMESTAMP
        AND p.status = 'captured'`,
    [siteId],
  );
  if (!site) throw new HttpError(403, "Site is inactive or expired");
  return site;
};

const getSiteId = (req) => {
  const { siteId } = req.params;
  if (!isId(siteId)) throw new HttpError(400, "Invalid site id");
  if (req.siteAdmin && String(req.siteAdmin.siteId) !== String(siteId)) {
    throw new HttpError(403, "This login is not assigned to the requested site");
  }
  return siteId;
};

const createHandlers = (type) => {
  return {
    list: async (req, res) => {
        req.params.resource = type;
        return siteData.list(req, res);
    },
    create: async (req, res) => {
        req.params.resource = type;
        return siteData.create(req, res);
    },
    update: async (req, res) => {
        req.params.resource = type;
        req.params.id = req.params.itemId;
        return siteData.update(req, res);
    },
    remove: async (req, res) => {
        req.params.resource = type;
        req.params.id = req.params.itemId;
        return siteData.remove(req, res);
    }
  };
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

    const site = await ensureActiveSite(siteId);
    const [news, galleries, slider] = await Promise.all([
      db.query(
        `SELECT id, title, imageUrl, content, createdAt
           FROM ${tn(siteId, "news", site.dbName)}
          WHERE status = 'active'
          ORDER BY createdAt DESC, id DESC`
      ),
      db.query(
        `SELECT id, title, imageUrl, caption, altText, sortOrder
           FROM ${tn(siteId, "galleries", site.dbName)}
          WHERE status = 'active'
          ORDER BY sortOrder, id`
      ),
      db.query(
        `SELECT id, title, imageUrl, sortOrder
           FROM ${tn(siteId, "slider", site.dbName)}
          WHERE status = 'active'
          ORDER BY sortOrder, id`
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

const uploadImage = [
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
