import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { getMaterialById, updateMaterial, deleteMaterial } from './material.controller.js';
import { updateMaterialSchema } from './material.validation.js';

const router = express.Router();

// GET /api/materials/:materialId - Get Material Detail
// Endpoint ini memisahkan detail materi dari list materi di course
// Untuk akses lebih fleksibel dan modular
router.get('/:materialId', authenticateToken, getMaterialById);

// PUT /api/materials/:materialId - Update Material (Dosen Only)
// Endpoint untuk mengupdate materi yang sudah ada
router.put(
  '/:materialId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(updateMaterialSchema),
  updateMaterial
);

// DELETE /api/materials/:materialId - Delete Material (Dosen Only)
// Endpoint untuk menghapus materi
router.delete(
  '/:materialId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  deleteMaterial
);

export default router;
