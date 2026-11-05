const db = require("../config/db");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const TYPES = ["bug", "error", "suggestion", "other"];
const SEVERITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["open", "in_progress", "resolved", "closed", "rejected"];
const FINAL_STATUSES = ["resolved", "closed", "rejected"];
const SCREENSHOT_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const SCREENSHOT_DIRECTORY = path.join(__dirname, "..", "uploads", "bugreports");
const MAX_PAGE_SIZE = 100;
const MAX_TEXT_FIELD_SIZE = 64 * 1024;
const MAX_DESCRIPTION_BYTES = 65535;

const isAdmin = (user) => user?.role === "admin";

// Accepts number, string, or bigint. Rejects things that can't safely be a
// unsigned 64-bit id without precision loss on the JS side.
const normalizeId = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") {
    return value > 0n && value <= 18446744073709551615n ? value.toString() : null;
  }
  const str = String(value);
  if (!/^[1-9]\d{0,19}$/.test(str)) return null;
  try {
    if (BigInt(str) > 18446744073709551615n) return null;
  } catch {
    return null;
  }
  return str;
};

const isId = (value) => normalizeId(value) !== null;

// Serialize DB ids as strings so JSON clients (e.g. JS Number) never lose
// precision for BIGINT UNSIGNED ids above Number.MAX_SAFE_INTEGER.
const toStr = (value) => (value === null || value === undefined ? null : String(value));

const getPagination = (query) => {
  const pageValue = query.page ?? "1";
  const limitValue = query.limit ?? "20";
  if (
    !/^[1-9]\d*$/.test(String(pageValue)) ||
    !/^[1-9]\d*$/.test(String(limitValue))
  ) {
    return null;
  }

  const page = Number(pageValue);
  const requestedLimit = Number(limitValue);
  if (
    !Number.isSafeInteger(page) ||
    !Number.isSafeInteger(requestedLimit) ||
    requestedLimit > MAX_PAGE_SIZE ||
    !Number.isSafeInteger((page - 1) * requestedLimit)
  ) {
    return null;
  }

  return { page, limit: requestedLimit, offset: (page - 1) * requestedLimit };
};

const isValidScreenshotUrl = (value) => {
  if (value === null) return true;
  if (typeof value !== "string" || !value.trim()) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

const screenshotUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) =>
      fs.mkdir(SCREENSHOT_DIRECTORY, { recursive: true }, (err) =>
        callback(err, SCREENSHOT_DIRECTORY),
      ),
    filename: (_req, file, callback) =>
      callback(
        null,
        `${crypto.randomBytes(16).toString("hex")}${SCREENSHOT_TYPES[file.mimetype]}`,
      ),
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    // Extra headroom so adding a new text field doesn't silently 500.
    fields: 10,
    fieldSize: MAX_TEXT_FIELD_SIZE,
  },
  fileFilter: (_req, file, callback) =>
    SCREENSHOT_TYPES[file.mimetype]
      ? callback(null, true)
      : callback(new Error("Only JPG, PNG, WEBP or GIF screenshots are allowed")),
});

const uploadScreenshot = (req, res, next) => {
  screenshotUpload.single("screenshot")(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "Screenshot must be 5 MB or smaller"
            : err.code === "LIMIT_FIELD_VALUE"
              ? "A report field is too long"
              : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
                ? "Only one screenshot may be uploaded"
                : err.code === "LIMIT_FIELD_COUNT"
                  ? "Too many fields in the report"
                  : err.message,
      });
    }
    if (err.message === "Only JPG, PNG, WEBP or GIF screenshots are allowed") {
      return res.status(400).json({ message: err.message });
    }
    return next(err);
  });
};

const removeUploadedScreenshot = (req) => {
  if (!req.file) return;
  fs.unlink(req.file.path, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Could not remove rejected bug-report screenshot:", err);
    }
  });
};

// Coerce DB row into a response shape with string ids.
const serializeReport = (row, { includeReporterEmail = true } = {}) => {
  const out = {
    id: toStr(row.id),
    reportedBy: toStr(row.reportedBy),
    reporterName: row.reporterName ?? null,
    siteId: toStr(row.siteId),
    siteName: row.siteName ?? null,
    title: row.title,
    description: row.description,
    screenshotUrl: row.screenshotUrl ?? null,
    type: row.type,
    severity: row.severity,
    status: row.status,
    adminNote: row.adminNote ?? null,
    resolvedBy: toStr(row.resolvedBy),
    resolvedAt: row.resolvedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  if (includeReporterEmail) out.reporterEmail = row.reporterEmail ?? null;
  return out;
};

// ---------------------------------------------------------------------
// POST /bugreports   (any logged-in user)
// ---------------------------------------------------------------------
const createBugReport = (req, res) => {
  const { userId } = req.user;
  const {
    title,
    description,
    type = "bug",
    severity = "medium",
    siteId: rawSiteId = null,
    screenshotUrl = null,
  } = req.body ?? {};

  const reportScreenshotUrl = req.file
    ? `/uploads/bugreports/${req.file.filename}`
    : screenshotUrl;

  const reject = (status, message) => {
    removeUploadedScreenshot(req);
    return res.status(status).json({ message });
  };

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof description !== "string" ||
    !description.trim()
  ) {
    return reject(400, "Title and description are required");
  }
  if (Buffer.byteLength(description.trim(), "utf8") > MAX_DESCRIPTION_BYTES) {
    return reject(400, "Description must be 65535 bytes or fewer");
  }
  if (title.trim().length > 190) {
    return reject(400, "Title must be 190 characters or less");
  }
  if (!TYPES.includes(type)) {
    return reject(400, "Invalid type");
  }
  if (!SEVERITIES.includes(severity)) {
    return reject(400, "Invalid severity");
  }
  if (!isValidScreenshotUrl(reportScreenshotUrl)) {
    return reject(400, "Invalid screenshot URL");
  }
  if (reportScreenshotUrl && reportScreenshotUrl.length > 500) {
    return reject(400, "Screenshot URL is too long");
  }

  // Normalize siteId: empty string / undefined -> null; otherwise must be a valid id.
  let siteId = null;
  if (rawSiteId !== null && rawSiteId !== undefined && rawSiteId !== "") {
    siteId = normalizeId(rawSiteId);
    if (siteId === null) {
      return reject(400, "Invalid site id");
    }
  }

  const insertReport = () => {
    const sql = `
      INSERT INTO bugreports
        (reportedBy, siteId, title, description, screenshotUrl, type, severity)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(
      sql,
      [
        String(userId),
        siteId,
        title.trim(),
        description.trim(),
        reportScreenshotUrl,
        type,
        severity,
      ],
      (err, result) => {
        if (err) {
          console.error("createBugReport:", err);
          removeUploadedScreenshot(req);
          return res.status(500).json({ message: "Failed to submit report" });
        }
        res.status(201).json({ message: "Report submitted", id: String(result.insertId) });
      }
    );
  };

  if (siteId) {
    const siteSql = isAdmin(req.user)
      ? "SELECT id FROM sites WHERE id = ?"
      : "SELECT id FROM sites WHERE id = ? AND userId = ?";
    const siteParams = isAdmin(req.user) ? [siteId] : [siteId, String(userId)];

    db.query(siteSql, siteParams, (err, rows) => {
      if (err) {
        console.error("createBugReport site check:", err);
        removeUploadedScreenshot(req);
        return res.status(500).json({ message: "Server error" });
      }
      if (rows.length === 0) {
        removeUploadedScreenshot(req);
        return res.status(403).json({ message: "You do not have access to this site" });
      }
      insertReport();
    });
  } else {
    insertReport();
  }
};

// ---------------------------------------------------------------------
// GET /bugreports/my
// ---------------------------------------------------------------------
const getMyBugReports = (req, res) => {
  const { userId } = req.user;
  const { status } = req.query;
  const pagination = getPagination(req.query);
  if (!pagination) {
    return res.status(400).json({ message: "Invalid page or limit" });
  }
  const { page, limit, offset } = pagination;

  const where = ["reportedBy = ?"];
  const params = [String(userId)];
  if (status) {
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    where.push("status = ?");
    params.push(status);
  }

  const countSql = `
    SELECT COUNT(*) AS total
      FROM bugreports
     WHERE ${where.join(" AND ")}`;
  const sql = `
    SELECT id, reportedBy, siteId, title, description, screenshotUrl, type, severity,
           status, adminNote, resolvedBy, resolvedAt, createdAt, updatedAt
      FROM bugreports
     WHERE ${where.join(" AND ")}
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`;

  db.query(countSql, params, (countErr, countRows) => {
    if (countErr) {
      console.error("getMyBugReports count:", countErr);
      return res.status(500).json({ message: "Failed to fetch reports" });
    }
    db.query(sql, [...params, limit, offset], (err, rows) => {
      if (err) {
        console.error("getMyBugReports:", err);
        return res.status(500).json({ message: "Failed to fetch reports" });
      }
      res.json({
        page,
        limit,
        total: Number(countRows[0].total),
        data: rows.map((r) => serializeReport(r)),
      });
    });
  });
};

// ---------------------------------------------------------------------
// GET /bugreports   (admin)
// ---------------------------------------------------------------------
const getAllBugReports = (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const { status, severity, type, siteId: rawSiteId } = req.query;
  const pagination = getPagination(req.query);
  if (!pagination) {
    return res.status(400).json({ message: "Invalid page or limit" });
  }
  const { page, limit, offset } = pagination;

  const where = [];
  const params = [];

  if (status) {
    if (!STATUSES.includes(status)) return res.status(400).json({ message: "Invalid status" });
    where.push("b.status = ?");
    params.push(status);
  }
  if (severity) {
    if (!SEVERITIES.includes(severity)) return res.status(400).json({ message: "Invalid severity" });
    where.push("b.severity = ?");
    params.push(severity);
  }
  if (type) {
    if (!TYPES.includes(type)) return res.status(400).json({ message: "Invalid type" });
    where.push("b.type = ?");
    params.push(type);
  }
  if (rawSiteId) {
    const siteId = normalizeId(rawSiteId);
    if (siteId === null) {
      return res.status(400).json({ message: "Invalid site id" });
    }
    where.push("b.siteId = ?");
    params.push(siteId);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countSql = `SELECT COUNT(*) AS total FROM bugreports b ${whereSql}`;
  const dataSql = `
    SELECT b.id, b.reportedBy, u.name AS reporterName, u.email AS reporterEmail,
           b.siteId, s.name AS siteName, b.title, b.description, b.screenshotUrl,
           b.type, b.severity, b.status, b.adminNote,
           b.resolvedBy, b.resolvedAt, b.createdAt, b.updatedAt
      FROM bugreports b
      JOIN users u ON u.userId = b.reportedBy
      LEFT JOIN sites s ON s.id = b.siteId
      ${whereSql}
     ORDER BY FIELD(b.status, 'open', 'in_progress', 'resolved', 'closed', 'rejected'),
              FIELD(b.severity, 'critical', 'high', 'medium', 'low'),
              b.createdAt DESC
     LIMIT ? OFFSET ?`;

  db.query(countSql, params, (err, countRows) => {
    if (err) {
      console.error("getAllBugReports count:", err);
      return res.status(500).json({ message: "Failed to fetch reports" });
    }
    db.query(dataSql, [...params, limit, offset], (err2, rows) => {
      if (err2) {
        console.error("getAllBugReports:", err2);
        return res.status(500).json({ message: "Failed to fetch reports" });
      }
      res.json({
        page,
        limit,
        total: Number(countRows[0].total),
        data: rows.map((r) => serializeReport(r)),
      });
    });
  });
};

// ---------------------------------------------------------------------
// GET /bugreports/:id   (owner or admin)
// ---------------------------------------------------------------------
const getBugReportById = (req, res) => {
  const id = normalizeId(req.params.id);
  if (id === null) {
    return res.status(400).json({ message: "Invalid report id" });
  }

  const sql = `
    SELECT b.id, b.reportedBy, u.name AS reporterName, u.email AS reporterEmail,
           b.siteId, s.name AS siteName, b.title, b.description, b.screenshotUrl,
           b.type, b.severity, b.status, b.adminNote,
           b.resolvedBy, b.resolvedAt, b.createdAt, b.updatedAt
      FROM bugreports b
      JOIN users u ON u.userId = b.reportedBy
      LEFT JOIN sites s ON s.id = b.siteId
     WHERE b.id = ?`;

  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error("getBugReportById:", err);
      return res.status(500).json({ message: "Failed to fetch report" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }
    const report = rows[0];
    const isOwner = String(report.reportedBy) === String(req.user.userId);
    if (!isAdmin(req.user) && !isOwner) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(serializeReport(report, { includeReporterEmail: isAdmin(req.user) }));
  });
};

// ---------------------------------------------------------------------
// PUT /bugreports/:id
// ---------------------------------------------------------------------
const updateBugReport = (req, res) => {
  const id = normalizeId(req.params.id);
  const { userId } = req.user;
  const admin = isAdmin(req.user);
  if (id === null) {
    return res.status(400).json({ message: "Invalid report id" });
  }

  db.query("SELECT * FROM bugreports WHERE id = ?", [id], (err, rows) => {
    if (err) {
      console.error("updateBugReport fetch:", err);
      return res.status(500).json({ message: "Server error" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    const report = rows[0];
    const fields = [];
    const params = [];

    if (admin) {
      const { status, adminNote, severity } = req.body ?? {};

      if (status !== undefined) {
        if (!STATUSES.includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }
        fields.push("status = ?");
        params.push(status);

        if (FINAL_STATUSES.includes(status)) {
          fields.push("resolvedBy = ?", "resolvedAt = NOW()");
          params.push(String(userId));
        } else {
          fields.push("resolvedBy = NULL", "resolvedAt = NULL");
        }
      }
      if (adminNote !== undefined) {
        if (adminNote !== null && typeof adminNote !== "string") {
          return res.status(400).json({ message: "Invalid admin note" });
        }
        const trimmedNote = typeof adminNote === "string" ? adminNote : null;
        if (trimmedNote && Buffer.byteLength(trimmedNote, "utf8") > MAX_DESCRIPTION_BYTES) {
          return res.status(400).json({ message: "Admin note is too long" });
        }
        fields.push("adminNote = ?");
        params.push(trimmedNote && trimmedNote.length ? trimmedNote : null);
      }
      if (severity !== undefined) {
        if (!SEVERITIES.includes(severity)) {
          return res.status(400).json({ message: "Invalid severity" });
        }
        fields.push("severity = ?");
        params.push(severity);
      }
    } else {
      if (String(report.reportedBy) !== String(userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (report.status !== "open") {
        return res
          .status(409)
          .json({ message: "This report is being handled and can no longer be edited" });
      }

      const { title, description, type, severity, screenshotUrl } = req.body ?? {};

      if (title !== undefined) {
        if (typeof title !== "string" || !title.trim() || title.trim().length > 190) {
          return res.status(400).json({ message: "Title must be 1-190 characters" });
        }
        fields.push("title = ?");
        params.push(title.trim());
      }
      if (description !== undefined) {
        if (typeof description !== "string" || !description.trim()) {
          return res.status(400).json({ message: "Description cannot be empty" });
        }
        if (Buffer.byteLength(description.trim(), "utf8") > MAX_DESCRIPTION_BYTES) {
          return res
            .status(400)
            .json({ message: "Description must be 65535 bytes or fewer" });
        }
        fields.push("description = ?");
        params.push(description.trim());
      }
      if (type !== undefined) {
        if (!TYPES.includes(type)) return res.status(400).json({ message: "Invalid type" });
        fields.push("type = ?");
        params.push(type);
      }
      if (severity !== undefined) {
        if (!SEVERITIES.includes(severity)) {
          return res.status(400).json({ message: "Invalid severity" });
        }
        fields.push("severity = ?");
        params.push(severity);
      }
      if (screenshotUrl !== undefined) {
        if (!isValidScreenshotUrl(screenshotUrl)) {
          return res.status(400).json({ message: "Invalid screenshot URL" });
        }
        if (screenshotUrl && screenshotUrl.length > 500) {
          return res.status(400).json({ message: "Screenshot URL is too long" });
        }
        fields.push("screenshotUrl = ?");
        params.push(screenshotUrl || null);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    db.query(
      `UPDATE bugreports SET ${fields.join(", ")} WHERE id = ?`,
      [...params, id],
      (err2) => {
        if (err2) {
          console.error("updateBugReport:", err2);
          return res.status(500).json({ message: "Failed to update report" });
        }
        res.json({ message: "Report updated" });
      }
    );
  });
};

module.exports = {
  uploadScreenshot,
  createBugReport,
  getMyBugReports,
  getAllBugReports,
  getBugReportById,
  updateBugReport,
};