import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
import { getMaterialById, updateMaterial, deleteMaterial } from './material.controller.js';
import { updateMaterialSchema } from './material.validation.js';

const router = express.Router();

/**
 * GET /api/materials/:materialId
 * Retrieves the detailed content of a specific material.
 * Middleware: Auth Token.
 */
router.get('/:materialId', authenticateToken, getMaterialById);

/**
 * PUT /api/materials/:materialId
 * Updates an existing material.
 * Accepts multipart/form-data with an optional file field ('file').
 * Middleware: Auth Token, Role: DOSEN/ADMIN, Upload, Validation: updateMaterialSchema.
 */
router.put(
  '/:materialId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  upload.single('file'),
  validate(updateMaterialSchema),
  updateMaterial
);

/**
 * DELETE /api/materials/:materialId
 * Deletes a material.
 * Middleware: Auth Token, Role: DOSEN/ADMIN.
 */
router.delete(
  '/:materialId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  deleteMaterial
);

export default router;
