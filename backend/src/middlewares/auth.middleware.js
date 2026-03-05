import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import redisClient from '../config/redis.js';
import logger from '../config/logger.js';
import { sendError } from '../utils/response.js';

const USER_CACHE_TTL = 300; // 5 minutes in seconds

/**
 * Middleware to authenticate users via JWT.
 * Checks Redis cache first, falls back to DB, and caches the result.
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, { statusCode: 401, message: 'Token tidak ditemukan' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const cacheKey = `user:${decoded.userId}`;

    // Try Redis cache first
    let user = null;
    try {
      if (redisClient.isOpen) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          user = JSON.parse(cached);
        }
      }
    } catch (cacheErr) {
      logger.warn({ err: cacheErr }, 'Redis cache read failed, falling back to DB');
    }

    // Cache miss — query DB
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isDospem: true,
          advisorId: true,
        },
      });

      if (!user) {
        return sendError(res, { statusCode: 401, message: 'User tidak ditemukan' });
      }

      // Cache for next requests (fire-and-forget)
      try {
        if (redisClient.isOpen) {
          await redisClient.set(cacheKey, JSON.stringify(user), { EX: USER_CACHE_TTL });
        }
      } catch (cacheErr) {
        logger.warn({ err: cacheErr }, 'Redis cache write failed');
      }
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, { statusCode: 401, message: 'Token telah kadaluwarsa' });
    }
    return sendError(res, { statusCode: 401, message: 'Token tidak valid' });
  }
};
