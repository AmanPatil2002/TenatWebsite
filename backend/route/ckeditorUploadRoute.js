
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },

  filename: (_req, file, callback) => {
    const extension = allowedTypes[file.mimetype];

    callback(
      null,
      `${crypto.randomUUID()}${extension}`
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes[file.mimetype]) {
      return callback(
        new Error("Only JPG, PNG, WEBP, GIF and PDF files are allowed.")
      );
    }

    callback(null, true);
  },
});

router.post("/ckeditor", (req, res) => {
  upload.single("upload")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        uploaded: 0,
        error: {
          message: error.message || "Upload failed.",
        },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        uploaded: 0,
        error: {
          message: "No file was uploaded.",
        },
      });
    }

    const fileUrl =
      `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    return res.json({
      uploaded: 1,
      fileName: req.file.originalname,
      url: fileUrl,
    });
  });
});

module.exports = router;
