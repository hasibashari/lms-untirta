// src/middlewares/upload.middleware.js
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { AppError } from "../config/errors.js";

// ── Upload directory ──────────────────────────────────────────────────
const UPLOAD_DIR = "public/uploads/";
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Allowed MIME types ────────────────────────────────────────────────
// Extend this map as needed. The key is the trusted MIME type,
// the value is the canonical extension written to disk.
const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ── Storage engine ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, "public/uploads/");
  },

  filename(_req, file, cb) {
    // Derive extension from the allowlist (never trust the client filename).
    // Fallback to path.extname only for types already validated by fileFilter.
    const ext =
      ALLOWED_TYPES[file.mimetype] ||
      path.extname(file.originalname).toLowerCase();
    // Sanitize original name: replace spaces with dashes, remove non-alphanumeric chars (except dots, dashes, underscores)
    const sanitizedOriginalName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.\-_]/g, "");

    // Recommendation: Combine UUID for uniqueness with sanitized name for readability
    const storedName = `${uuidv4()}-${sanitizedOriginalName}`;
    cb(null, storedName);
  },
});

// ── File filter ───────────────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_TYPES[file.mimetype]) {
    return cb(
      new AppError(
        400,
        `File type "${file.mimetype}" is not allowed. Accepted: ${Object.keys(ALLOWED_TYPES).join(", ")}`
      )
    );
  }
  cb(null, true);
};

// ── Multer instance ───────────────────────────────────────────────────
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// Re-export constants so other modules (e.g. upload service) can reference them.
export { ALLOWED_TYPES, MAX_FILE_SIZE };