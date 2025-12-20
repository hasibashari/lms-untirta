import express from 'express';
import { authenticateToken } from '../middlewares/authMiddlewareJWT.js';
import { getMaterialById } from '../controllers/materialController.js';

const router = express.Router();

// GET /api/materials/:materialId - Get Material Detail
// Endpoint ini memisahkan detail materi dari list materi di course
// Untuk akses lebih fleksibel dan modular
router.get('/:materialId', authenticateToken, getMaterialById);

export default router;
