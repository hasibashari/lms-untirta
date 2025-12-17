import express from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddlewareJWT.js';
import { createUser } from '../controllers/userController.js';

const router = express.Router();

// Logic: Hanya Admin yang boleh akses route di file ini
// Kita pasang middleware di level router agar berlaku untuk SEMUA endpoint di bawahnya
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

// POST /api/users
// Digunakan Admin untuk membuat Dosen/Admin baru
router.post('/', createUser);

export default router;
