import express from 'express';
import { login, register } from '../controllers/authController.js';
import validate from '../middlewares/validate.js'; // Fungsi wrapper Zod
import registerSchema from '../validations/authValidation.js'; // Schema Zod

const router = express.Router();

// POST /api/auth/register
// Flow: Validate Input -> Controller -> Service -> DB
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login
// Kamu bisa buat loginSchema di Zod juga untuk validasi email & password tidak kosong
router.post('/login', login);

export default router;
