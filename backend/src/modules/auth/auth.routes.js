import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, register, getMe } from './auth.controller.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import validate from '../../middlewares/validate.middleware.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Rate limiter for auth endpoints — prevents brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,                   // 15 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan, coba lagi dalam 15 menit.' },
});

/**
 * POST /api/auth/register
 * Registers a new user in the system.
 */
router.post('/register', authLimiter, validate(registerSchema), register);

/**
 * POST /api/auth/login
 * Authenticates a user and returns an access token.
 */
router.post('/login', authLimiter, validate(loginSchema), login);

/**
 * GET /api/auth/me
 * Retrieves the profile of the currently authenticated user.
 */
router.get('/me', authenticateToken, getMe);

export default router;
