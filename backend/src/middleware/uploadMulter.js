// backend/src/middleware/uploadMulter.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");

/**
 * ==========================================
 * ROOT UPLOAD DIRECTORIES (GIỮ NGUYÊN)
 * ==========================================
 */
const UPLOAD_ROOT = path.join(__dirname, "../../uploads");
const SRC_DIR = path.join(UPLOAD_ROOT, "videos", "sources");
const POSTER_DIR = path.join(UPLOAD_ROOT, "videos", "posters");

/**
 * ==========================================
 * 🎵 EVENT MUSIC DIRECTORIES (TÁCH RIÊNG)
 * ==========================================
 */
const CHRISTMAS_MUSIC_DIR = path.join(UPLOAD_ROOT, "events", "christmas");
const BIRTHDAY_MUSIC_DIR = path.join(UPLOAD_ROOT, "events", "birthday");

/**
 * ==========================================
 * ENSURE DIRECTORIES EXIST
 * ==========================================
 */
for (const d of [
  UPLOAD_ROOT,
  SRC_DIR,
  POSTER_DIR,
  CHRISTMAS_MUSIC_DIR,
  BIRTHDAY_MUSIC_DIR,
]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

/**
 * ==========================================
 * FILE FILTER
 * ==========================================
 */
function fileFilter(req, file, cb) {
  // 🎥 Video
  if (file.fieldname === "video") {
    if (/mp4|mpeg4/.test(file.mimetype) || /\.mp4$/i.test(file.originalname)) {
      return cb(null, true);
    }
    return cb(new Error("Video must be MP4"), false);
  }

  // 🖼 Thumbnail
  if (file.fieldname === "thumb") {
    if (/image\/(png|jpe?g)/.test(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("Thumb must be PNG/JPG"), false);
  }

  // 🎵 Music (MP3)
  if (file.fieldname === "music") {
    if (file.mimetype === "audio/mpeg") {
      return cb(null, true);
    }
    return cb(new Error("Music must be MP3"), false);
  }

  cb(new Error("Invalid upload field"), false);
}

/**
 * ==========================================
 * STORAGE CONFIG
 * ==========================================
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 🎥 Video
    if (file.fieldname === "video") return cb(null, SRC_DIR);

    // 🖼 Thumbnail
    if (file.fieldname === "thumb") return cb(null, POSTER_DIR);

    // 🎵 Event music (PHÂN THEO EVENT)
    if (file.fieldname === "music") {
      const eventKey = req.body.eventKey;

      if (eventKey === "birthday") {
        return cb(null, BIRTHDAY_MUSIC_DIR);
      }

      // default: christmas
      return cb(null, CHRISTMAS_MUSIC_DIR);
    }

    cb(new Error("Invalid upload destination"), null);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const base = path
      .basename(file.originalname || "upload", ext)
      .replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

/**
 * ==========================================
 * MULTER INSTANCE
 * ==========================================
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB
  },
});

module.exports = {
  upload,
  UPLOAD_ROOT,
  SRC_DIR,
  POSTER_DIR,
  CHRISTMAS_MUSIC_DIR,
  BIRTHDAY_MUSIC_DIR,
};
