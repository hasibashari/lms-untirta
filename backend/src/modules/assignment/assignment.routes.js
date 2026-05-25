import express from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
} from './assignment.validation.js';
import {
  create,
  getAssignments,
  getAssignmentDetail,
  updateAssignment,
  deleteAssignment,
} from './assignment.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/assignments/class/{classId}:
 *   post:
 *     summary: Membuat tugas baru untuk suatu kelas (Dosen Only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Kelas (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, dueDate]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 example: "Tugas Praktikum 1: Swagger"
 *                 description: "Judul tugas"
 *               description:
 *                 type: string
 *                 example: "Lakukan instalasi dan dokumentasikan rute API Anda."
 *                 description: "Deskripsi instruksi tugas"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-30T23:59:59Z"
 *                 description: "Waktu tenggat pengumpulan (Format ISO 8601)"
 *     responses:
 *       201:
 *         description: Tugas berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Assignment'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Mendapatkan semua daftar tugas dari suatu kelas
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Kelas (UUID)
 *     responses:
 *       200:
 *         description: Daftar tugas berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Assignment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/class/:classId',
  authenticateToken,
  authorizeRole('DOSEN'),
  validate(createAssignmentSchema),
  create,
);

router.get('/class/:classId', authenticateToken, getAssignments);

/**
 * @swagger
 * /api/assignments/{assignmentId}:
 *   get:
 *     summary: Mendapatkan detail tugas berdasarkan ID tugas
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Tugas (UUID)
 *     responses:
 *       200:
 *         description: Detail tugas berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Assignment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     summary: Mengubah data tugas berdasarkan ID tugas (Dosen Only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Tugas (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 example: "Tugas Praktikum 1: Swagger (Updated)"
 *               description:
 *                 type: string
 *                 example: "Instruksi diperbarui..."
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-01T23:59:59Z"
 *     responses:
 *       200:
 *         description: Tugas berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Assignment'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Menghapus tugas berdasarkan ID tugas (Dosen Only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Tugas (UUID)
 *     responses:
 *       200:
 *         description: Tugas berhasil dihapus
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
router.get(
  '/:assignmentId',
  authenticateToken,
  authorizeRole('DOSEN', 'MAHASISWA'),
  getAssignmentDetail,
);

router.put(
  '/:assignmentId',
  authenticateToken,
  authorizeRole('DOSEN'),
  validate(updateAssignmentSchema),
  updateAssignment,
);

router.delete(
  '/:assignmentId',
  authenticateToken,
  authorizeRole('DOSEN'),
  deleteAssignment,
);

export default router;
