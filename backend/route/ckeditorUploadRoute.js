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

const imageTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const fileTypes = {
  ...imageTypes,
  "application/pdf": ".pdf",
};

const videoTypes = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/ogg": ".ogv",
};

function createUploader({ types, maxSize, message }) {
  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDir),
    filename: (_req, file, callback) =>
      callback(null, `${crypto.randomUUID()}${types[file.mimetype]}`),
  });

  return multer({
    storage,
    limits: { fileSize: maxSize, files: 1 },
    fileFilter: (_req, file, callback) => {
      if (!types[file.mimetype]) return callback(new Error(message));
      callback(null, true);
    },
  });
}

const imageUpload = createUploader({
  types: fileTypes, // keeps your PDF support
  maxSize: 5 * 1024 * 1024,
  message: "Only JPG, PNG, WEBP, GIF and PDF files are allowed.",
});

const videoUpload = createUploader({
  types: videoTypes,
  maxSize: 100 * 1024 * 1024,
  message: "Only MP4, WEBM and OGG videos are allowed.",
});

function handleUpload(uploader) {
  return (req, res) => {
    uploader.single("upload")(req, res, (error) => {
      if (error) {
        const message =
          error.code === "LIMIT_FILE_SIZE"
            ? "File is too large."
            : error.message || "Upload failed.";
        return res.status(400).json({ uploaded: 0, error: { message } });
      }

      if (!req.file) {
        return res.status(400).json({
          uploaded: 0,
          error: { message: "No file was uploaded." },
        });
      }

      return res.json({
        uploaded: 1,
        fileName: req.file.originalname,
        url: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
      });
    });
  };
}

router.post("/ckeditor", handleUpload(imageUpload));
router.post("/ckeditor-video", handleUpload(videoUpload));

module.exports = router;