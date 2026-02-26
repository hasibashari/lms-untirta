import express from 'express';
import { login, register, getMe } from './auth.controller.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import validate from '../../middlewares/validate.middleware.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Registers a new user in the system.
 * Middleware: Validates request body against registerSchema.
 */
router.post('/register', validate(registerSchema), register);

/**
 * POST /api/auth/login
 * Authenticates a user and returns an access token.
 * Middleware: Validates request body against loginSchema.
 */
router.post('/login', validate(loginSchema), login);

/**
 * GET /api/auth/me
 * Retrieves the profile of the currently authenticated user.
 * Middleware: Requires a valid JWT token.
 */
router.get('/me', authenticateToken, getMe);

export default router;
