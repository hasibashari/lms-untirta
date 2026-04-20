// src/services/upload.service.js
//
// Service untuk mengelola metadata upload file menggunakan Redis. Metadata mencakup informasi seperti nama asli, nama yang disimpan, ukuran, tipe MIME, path, dan timestamp. Metadata disimpan dengan TTL untuk otomatis kedaluwarsa. Service ini juga menyediakan fungsi untuk mengambil metadata, menghapus upload (termasuk file fisik), dan daftar semua upload untuk pengguna tertentu.

import { promises as fs } from "fs";
import path from "path";
import redisClient from "../config/redis.js";
import logger from "../config/logger.js";

// ── Configuration ─────────────────────────────────────────────────────
const UPLOAD_PREFIX = "upload";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // 24 hours

// ── Key helpers ───────────────────────────────────────────────────────

// Membuat key Redis untuk metadata upload berdasarkan userId dan UUID file.
const buildKey = (userId, uuid) => `${UPLOAD_PREFIX}:${userId}:${uuid}`;

/**
 * Build a scan pattern that matches all uploads for a given user.
 * @param {string|number} userId
 * @returns {string}
 */
const buildUserPattern = (userId) => `${UPLOAD_PREFIX}:${userId}:*`;

// ── Public API ────────────────────────────────────────────────────────

// Simpan metadata upload ke Redis dengan TTL. Metadata mencakup nama asli, nama yang disimpan, ukuran, tipe MIME, path, dan timestamp.
export const persistUploadMeta = async ({
  userId,
  file,
  ttl = DEFAULT_TTL_SECONDS,
}) => {
  // Extract the UUID from the stored filename (filename without extension).
  const uuid = path.parse(file.filename).name;

  const metadata = {
    originalName: file.originalname,
    storedName: file.filename,
    size: String(file.size),
    mimetype: file.mimetype,
    path: file.path,
    userId: String(userId),
    timestamp: new Date().toISOString(),
  };

  const key = buildKey(userId, uuid);

  // HSET is atomic at the Redis level — all fields are written in one round-trip.
  await redisClient.hSet(key, metadata);

  if (ttl > 0) {
    await redisClient.expire(key, ttl);
  }

  return { key, ...metadata };
};

// Ambil metadata upload dari Redis berdasarkan userId dan UUID. Mengembalikan null jika tidak ditemukan atau sudah kedaluwarsa.
export const getUploadMeta = async (userId, uuid) => {
  const key = buildKey(userId, uuid);
  const data = await redisClient.hGetAll(key);

  // hGetAll returns {} for non-existent keys.
  if (!data || Object.keys(data).length === 0) return null;
  return data;
};

// Hapus metadata upload dari Redis dan coba hapus file fisiknya. Mengembalikan true jika metadata berhasil dihapus, false jika tidak ditemukan.
export const deleteUpload = async (userId, uuid) => {
  const key = buildKey(userId, uuid);
  const meta = await redisClient.hGetAll(key);

  if (meta && meta.path) {
    try {
      await fs.unlink(meta.path);
    } catch (err) {
      // ENOENT is acceptable — file already removed.
      if (err.code !== "ENOENT") throw err;
    }
  }

  const deleted = await redisClient.del(key);
  return deleted > 0;
};

// Daftar semua metadata upload untuk pengguna tertentu. Menggunakan SCAN untuk iterasi yang efisien, mengembalikan array kunci yang cocok.
export const listUserUploads = async (userId) => {
  const pattern = buildUserPattern(userId);
  const keys = [];

  for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    keys.push(key);
  }

  return keys;
};

// Bersihkan file fisik yang terkait dengan metadata upload. Digunakan untuk pembersihan manual atau penanganan kesalahan. Tidak mempengaruhi metadata Redis.
export const cleanupFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      logger.warn({ filePath, err: err.message }, 'Failed to clean up file');
    }
  }
};

export default {
  persistUploadMeta,
  getUploadMeta,
  deleteUpload,
  listUserUploads,
  cleanupFile,
};
