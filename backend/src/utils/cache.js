import redisClient from '../config/redis.js';
import logger from '../config/logger.js';

/**
 * Generic caching utility for Redis.
 * Supports "Cache-Aside" pattern.
 */

const DEFAULT_TTL = 3600; // 1 hour

/**
 * Get data from cache or fetch from source and save to cache.
 * @param {string} key - Redis key
 * @param {Function} fetchFn - Function to fetch data if cache miss (must return a promise)
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>}
 */
export const getOrSet = async (key, fetchFn, ttl = DEFAULT_TTL) => {
  if (process.env.DISABLE_CACHE === 'true' || !redisClient.isOpen) {
    logger.warn('Cache bypassed');
    return await fetchFn();
  }

  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      logger.debug({ key }, 'Cache hit');
      return JSON.parse(cachedData);
    }
  } catch (error) {
    logger.error({ err: error, key }, 'Error reading from Redis cache');
  }

  logger.debug({ key }, 'Cache miss, fetching from source');
  const freshData = await fetchFn();

  if (freshData !== null && freshData !== undefined) {
    try {
      await redisClient.set(key, JSON.stringify(freshData), {
        EX: ttl,
      });
    } catch (error) {
      logger.error({ err: error, key }, 'Error writing to Redis cache');
    }
  }

  return freshData;
};

/**
 * Invalidate a specific cache key.
 * @param {string} key 
 */
export const invalidate = async (key) => {
  if (!redisClient.isOpen) return;
  try {
    await redisClient.del(key);
    logger.debug({ key }, 'Cache invalidated');
  } catch (error) {
    logger.error({ err: error, key }, 'Error invalidating Redis cache');
  }
};

/**
 * Invalidate multiple keys matching a pattern.
 * Use with caution (uses SCAN).
 * @param {string} pattern - e.g. "course:123:*"
 */
export const invalidatePattern = async (pattern) => {
  if (!redisClient.isOpen) return;
  try {
    let count = 0;
    for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      await redisClient.del(key);
      count++;
    }
    logger.debug({ pattern, count }, 'Cache pattern invalidated');
  } catch (error) {
    logger.error({ err: error, pattern }, 'Error invalidating Redis cache pattern');
  }
};

export default {
  getOrSet,
  invalidate,
  invalidatePattern,
};
