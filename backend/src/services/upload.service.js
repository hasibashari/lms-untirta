import { promises as fs } from "fs";
import path from "path";
import redisClient from "../config/redis.js";
import logger from "../config/logger.js";

// Modul helper untuk menyimpan dan mengelola metadata upload file.
// Metadata disimpan di Redis dengan TTL sehingga file sementara bisa otomatis kadaluarsa.

// ── Konfigurasi ─────────────────────────────────────────────────────
const UPLOAD_PREFIX = "upload";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // 24 jam

// ── Pembantu key Redis ──────────────────────────────────────────────

// Buat key Redis unik per user dan file UUID (UUID diambil dari nama file yang disimpan)
const buildKey = (userId, uuid) => `${UPLOAD_PREFIX}:${userId}:${uuid}`;
const buildUserPattern = (userId) => `${UPLOAD_PREFIX}:${userId}:*`;

// ── API Publik ──────────────────────────────────────────────────────

// Simpan metadata upload ke Redis. Mengembalikan objek metadata beserta key Redis.
export const persistUploadMeta = async ({
  userId,
  file,
  ttl = DEFAULT_TTL_SECONDS,
}) => {
  // UUID diasumsikan ada di nama file yang disimpan (tanpa ekstensi)
  const fileNameOrKey = file.filename || file.key || "";
  const uuid = path.parse(fileNameOrKey).name;

  const metadata = {
    originalName: file.originalname,
    storedName: fileNameOrKey,
    size: String(file.size),
    mimetype: file.mimetype,
    path: file.path || file.location || "",
    userId: String(userId),
    timestamp: new Date().toISOString(),
  };

  const key = buildKey(userId, uuid);

  // Menyimpan sebagai hash di Redis; operasi hSet bersifat atomic untuk satu key
  await redisClient.hSet(key, metadata);

  // Jika TTL > 0, set expiry agar metadata (dan kemungkinan file sementara) otomatis dihapus
  if (ttl > 0) {
    await redisClient.expire(key, ttl);
  }

  return { key, ...metadata };
};

// Ambil metadata upload; kembalikan null jika tidak ditemukan.
export const getUploadMeta = async (userId, uuid) => {
  const key = buildKey(userId, uuid);
  const data = await redisClient.hGetAll(key);

  // Redis mengembalikan objek kosong untuk key yang tidak ada
  if (!data || Object.keys(data).length === 0) return null;
  return data;
};

// Hapus metadata dan coba hapus file fisik terkait. Mengembalikan true jika metadata terhapus.
export const deleteUpload = async (userId, uuid) => {
  const key = buildKey(userId, uuid);
  const meta = await redisClient.hGetAll(key);

  if (meta && meta.path && !meta.path.startsWith('http')) {
    try {
      await fs.unlink(meta.path);
    } catch (err) {
      // ENOENT: file sudah dihapus, itu bukan error kritis
      if (err.code !== "ENOENT") throw err;
    }
  }

  const deleted = await redisClient.del(key);
  return deleted > 0;
};

// Daftar semua key upload untuk user tertentu. Menggunakan SCAN agar tidak memblokir Redis.
export const listUserUploads = async (userId) => {
  const pattern = buildUserPattern(userId);
  const keys = [];

  for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    keys.push(key);
  }

  return keys;
};

// Hapus file fisik jika ada — digunakan untuk cleanup manual. Log jika gagal kecuali file sudah tidak ada.
export const cleanupFile = async (filePath) => {
  if (!filePath || filePath.startsWith('http')) return;
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      logger.warn({ filePath, err: err.message }, 'Failed to clean up file');
    }
  }
};


