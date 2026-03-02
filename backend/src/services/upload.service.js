// src/services/upload.service.js
//
// Thin service layer that bridges Multer's file output with Redis metadata
// storage. Keeps middleware and Redis logic decoupled.

import { promises as fs } from "fs";
import path from "path";
import redisClient from "../config/redis.js";
import logger from "../config/logger.js";

// ── Configuration ─────────────────────────────────────────────────────
const UPLOAD_PREFIX = "upload";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // 24 hours

// ── Key helpers ───────────────────────────────────────────────────────

/**
 * Build a namespaced Redis key for a single upload.
 * Pattern: `upload:{userId}:{uuid}`
 *
 * @param {string|number} userId
 * @param {string} uuid - The UUID portion of the stored filename (without ext).
 * @returns {string}
 */
const buildKey = (userId, uuid) => `${UPLOAD_PREFIX}:${userId}:${uuid}`;

/**
 * Build a scan pattern that matches all uploads for a given user.
 * @param {string|number} userId
 * @returns {string}
 */
const buildUserPattern = (userId) => `${UPLOAD_PREFIX}:${userId}:*`;

// ── Public API ────────────────────────────────────────────────────────

/**
 * Persist upload metadata to Redis after Multer has written the file.
 *
 * @param {object} params
 * @param {string|number} params.userId   - Authenticated user ID.
 * @param {object}        params.file     - The `req.file` object from Multer.
 * @param {number}        [params.ttl]    - TTL in seconds (default 24 h).
 * @returns {Promise<object>} The metadata that was stored.
 * @throws If Redis SET fails.
 */
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

/**
 * Retrieve upload metadata from Redis.
 *
 * @param {string|number} userId
 * @param {string} uuid
 * @returns {Promise<object|null>} Metadata hash or null if expired / not found.
 */
export const getUploadMeta = async (userId, uuid) => {
  const key = buildKey(userId, uuid);
  const data = await redisClient.hGetAll(key);

  // hGetAll returns {} for non-existent keys.
  if (!data || Object.keys(data).length === 0) return null;
  return data;
};

/**
 * Delete upload metadata from Redis **and** remove the file from disk.
 * Silently ignores missing files (already cleaned up or expired).
 *
 * @param {string|number} userId
 * @param {string} uuid
 * @returns {Promise<boolean>} true if the key existed and was deleted.
 */
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

/**
 * List all upload metadata keys for a given user (paginated via SCAN).
 * Use sparingly — primarily for admin dashboards or cleanup jobs.
 *
 * @param {string|number} userId
 * @returns {Promise<string[]>} Array of Redis keys.
 */
export const listUserUploads = async (userId) => {
  const pattern = buildUserPattern(userId);
  const keys = [];

  for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    keys.push(key);
  }

  return keys;
};

/**
 * Safely remove the physical file when an error occurs after Multer has
 * already written it to disk. Call this in controller catch blocks.
 *
 * @param {string|undefined} filePath - Absolute or relative path to the file.
 */
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
