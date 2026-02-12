import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { createUser, getAllUsers, getUserById } from './user.controller.js';
import { createUserSchema } from './user.validation.js';

const router = express.Router();

// Logic: Hanya Admin yang boleh akses route di file ini
// Kita pasang middleware di level router agar berlaku untuk SEMUA endpoint di bawahnya
router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

// POST /api/users
// Digunakan Admin untuk membuat Dosen/Admin baru
router.post('/', validate(createUserSchema), createUser);

// GET /api/users
router.get('/', getAllUsers);

// GET /api/users/:id
// Digunakan Admin untuk melihat detail user berdasarkan ID
router.get('/:id', getUserById);

export default router;
