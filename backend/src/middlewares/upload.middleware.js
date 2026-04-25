// src/middlewares/upload.middleware.js
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { AppError } from "../config/errors.js";

// ── Upload directory ──────────────────────────────────────────────────
const UPLOAD_ROOT = "public/uploads/";
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

// ── Allowed MIME types ────────────────────────────────────────────────
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
  destination(req, _file, cb) {
    // Support dynamic subfolders via req.uploadSubfolder
    const subfolder = req.uploadSubfolder || "";
    const dest = path.join(UPLOAD_ROOT, subfolder);

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },

  filename(_req, file, cb) {
    const ext =
      ALLOWED_TYPES[file.mimetype] ||
      path.extname(file.originalname).toLowerCase();
    
    const sanitizedOriginalName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.\-_]/g, "");

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

// 
export const buildFileUrl = (req, filename, subfolder = "") => {
  const protocol = req.protocol;
  const host = req.get("host");
  const pathPart = subfolder ? `uploads/${subfolder}/${filename}` : `uploads/${filename}`;
  return `${protocol}://${host}/${pathPart}`;
};

export { ALLOWED_TYPES, MAX_FILE_SIZE };