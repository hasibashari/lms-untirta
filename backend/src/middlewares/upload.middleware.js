// src/middlewares/upload.middleware.js
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { AppError } from "../config/errors.js";
import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";

// ── S3 Configuration ──────────────────────────────────────────────────
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});
const useS3 = process.env.STORAGE_PROVIDER === "s3";

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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const localStorageEngine = multer.diskStorage({
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

const s3StorageEngine = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_S3_BUCKET_NAME || "bucket-s3-lms",
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, cb) {
    const subfolder = req.uploadSubfolder || "";
    const ext =
      ALLOWED_TYPES[file.mimetype] ||
      path.extname(file.originalname).toLowerCase();
    
    const sanitizedOriginalName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.\-_]/g, "");

    const storedName = `${uuidv4()}-${sanitizedOriginalName}`;
    // Simpan dalam format folder di bucket: uploads/subfolder/file
    const fullPath = subfolder ? `uploads/${subfolder}/${storedName}` : `uploads/${storedName}`;
    cb(null, fullPath);
  }
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
  storage: useS3 ? s3StorageEngine : localStorageEngine,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const buildFileUrl = (req, file, subfolder = "") => {
  if (file.location) {
    // Jika S3, multer-s3 otomatis memberikan field `location`
    return file.location;
  }
  const protocol = req.protocol;
  const host = req.get("host");
  const pathPart = subfolder ? `uploads/${subfolder}/${file.filename}` : `uploads/${file.filename}`;
  return `${protocol}://${host}/${pathPart}`;
};

export { ALLOWED_TYPES, MAX_FILE_SIZE };