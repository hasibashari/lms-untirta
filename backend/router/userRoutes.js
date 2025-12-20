import express from 'express';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddlewareJWT.js';
import { createUser, getAllUsers } from '../controllers/userController.js';


const router = express.Router();

// Logic: Hanya Admin yang boleh akses route di file ini
// Kita pasang middleware di level router agar berlaku untuk SEMUA endpoint di bawahnya
router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

// POST /api/users
// Digunakan Admin untuk membuat Dosen/Admin baru
router.post('/', createUser);

// GET /api/users
router.get('/', getAllUsers);

export default router;
