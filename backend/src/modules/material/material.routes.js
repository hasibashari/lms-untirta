import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
import { createMaterial, getMaterials, getMaterialById, updateMaterial, deleteMaterial } from './material.controller.js';
import { createMaterialSchema, updateMaterialSchema } from './material.validation.js';

const router = express.Router();

router.post(
  '/class/:classId',
  authenticateToken,
  authorizeRole('DOSEN'),
  upload.single('file'),
  validate(createMaterialSchema),
  createMaterial
);

router.get(
  '/class/:classId',
  authenticateToken,
  getMaterials
);

/**
 * @swagger
 * /api/materials/{materialId}:
 *   get:
 *     summary: Get material by ID
 *     description: Retrieves the detailed content of a specific material including file URL and video link.
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Material UUID
 *     responses:
 *       200:
 *         description: Material details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Material'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:materialId', authenticateToken, getMaterialById);

/**
 * @swagger
 * /api/materials/{materialId}:
 *   put:
 *     summary: Update a material
 *     description: Updates an existing material. Accepts multipart/form-data with an optional file upload to replace the current attachment.
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Material UUID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *               content:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *                 format: uri
 *               order:
 *                 type: integer
 *                 minimum: 1
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Replacement file attachment
 *     responses:
 *       200:
 *         description: Material updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Material'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  '/:materialId',
  authenticateToken,
  authorizeRole('DOSEN'),
  upload.single('file'),
  validate(updateMaterialSchema),
  updateMaterial
);

/**
 * @swagger
 * /api/materials/{materialId}:
 *   delete:
 *     summary: Delete a material
 *     description: Permanently deletes a material and its associated file from storage.
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Material UUID
 *     responses:
 *       200:
 *         description: Material deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/:materialId',
  authenticateToken,
  authorizeRole('DOSEN'),
  deleteMaterial
);

export default router;
