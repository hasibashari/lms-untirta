// src/config/redis.js
import { createClient } from "redis";
import logger from "./logger.js";

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error("Redis: max reconnection attempts reached");
        return new Error("Redis max retries exceeded");
      }
      // Exponential backoff: 2^retries * 100ms, capped at 30s
      return Math.min(2 ** retries * 100, 30_000);
    },
  },
});

redisClient.on("connect", () => {
  logger.info("Redis client connected");
});

redisClient.on("reconnecting", () => {
  logger.warn("Redis client reconnecting...");
});

redisClient.on("error", (err) => {
  logger.error({ err }, "Redis Client Error");
});

/**
 * Connect the Redis client. Call once during server bootstrap.
 * Throws if the initial connection fails so the process can exit cleanly.
 */
export const initRedis = async () => {
  try {
    await redisClient.connect();
    logger.info("Redis connected successfully");
  } catch (error) {
    logger.error({ err: error }, "Redis connection error");
    throw error;
  }
};

/**
 * Gracefully close the Redis connection.
 */
export const closeRedis = async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
    logger.info("Redis connection closed");
  }
};

/**
 * Quick health check — resolves true if Redis responds to PING.
 * @returns {Promise<boolean>}
 */
export const isRedisHealthy = async () => {
  try {
    const pong = await redisClient.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
};

export default redisClient;