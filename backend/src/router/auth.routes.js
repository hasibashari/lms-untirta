import express from 'express';
import { login, register, getMe } from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.js'; // Fungsi wrapper Zod
import registerSchema from '../validations/authValidation.js'; // Schema Zod
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// POST /api/auth/register
// Flow: Validate Input -> Controller -> Service -> DB
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login
// Kamu bisa buat loginSchema di Zod juga untuk validasi email & password tidak kosong
router.post('/login', login);

// GET /api/auth/me
router.get('/me', authenticateToken, getMe);

export default router;
