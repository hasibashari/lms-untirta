import express from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
import {
  submitAssignmentSchema,
  gradeSubmissionSchema,
} from './submission.validation.js';
import {
  submit,
  getSubmissions,
  grade,
  getMyAssignment,
  getAllMyGrades,
  getMyGradesStats,
  getRecentSubmissions,
} from './submission.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/submissions/grades/stats/me:
 *   get:
 *     summary: Mendapatkan statistik nilai mahasiswa (Mahasiswa Only)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistik nilai berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         graded:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         submitted:
 *                           type: integer
 *                         overdue:
 *                           type: integer
 *                         averageGrade:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/grades/stats/me', authenticateToken, authorizeRole('MAHASISWA'), getMyGradesStats);

/**
 * @swagger
 * /api/submissions/grades/me:
 *   get:
 *     summary: Mendapatkan semua daftar nilai mahasiswa (Mahasiswa Only)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar nilai berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Submission'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/grades/me', authenticateToken, authorizeRole('MAHASISWA'), getAllMyGrades);



/**
 * @swagger
 * /api/submissions/recent-submissions:
 *   get:
 *     summary: Mendapatkan daftar pengumpulan tugas terbaru (Dosen Only)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar pengumpulan tugas terbaru berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           submittedAt:
 *                             type: string
 *                             format: date-time
 *                           assignmentTitle:
 *                             type: string
 *                             example: "Tugas Praktikum 1"
 *                           studentName:
 *                             type: string
 *                             example: "Budi Santoso"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/recent-submissions', authenticateToken, authorizeRole('DOSEN'), getRecentSubmissions);

/**
 * @swagger
 * /api/submissions/{assignmentId}/me:
 *   get:
 *     summary: Mendapatkan detail pengumpulan berkas mahasiswa sendiri untuk tugas tertentu (Mahasiswa Only)
 *     tags: [Submissions]
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
 *         description: Berhasil mendapatkan data pengumpulan berkas sendiri
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Submission'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:assignmentId/me', authenticateToken, authorizeRole('MAHASISWA'), getMyAssignment);

/**
 * @swagger
 * /api/submissions/{assignmentId}/submit:
 *   post:
 *     summary: Mengirimkan / mengunggah berkas pengumpulan tugas (Mahasiswa Only)
 *     tags: [Submissions]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "Berkas tugas (PDF/PNG/JPG/ZIP dll, maksimal 5MB)"
 *               note:
 *                 type: string
 *                 description: "Catatan opsional untuk dosen"
 *                 example: "Mohon maaf atas keterlambatan pengumpulan tugas."
 *     responses:
 *       201:
 *         description: Berkas tugas berhasil dikirimkan
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Submission'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/:assignmentId/submit',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  (req, res, next) => {
    req.uploadSubfolder = 'submission';
    next();
  },
  upload.single('file'),
  validate(submitAssignmentSchema),
  submit,
);

/**
 * @swagger
 * /api/submissions/{submissionId}:
 *   patch:
 *     summary: Memberikan penilaian & feedback untuk berkas pengumpulan mahasiswa (Dosen Only)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Pengumpulan (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grade]
 *             properties:
 *               grade:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 85
 *                 description: "Nilai angka (0-100)"
 *               feedback:
 *                 type: string
 *                 example: "Kerja bagus, pertahankan!"
 *                 description: "Umpan balik opsional dari dosen"
 *     responses:
 *       200:
 *         description: Penilaian berhasil disimpan
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Submission'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/:submissionId',
  authenticateToken,
  authorizeRole('DOSEN'),
  validate(gradeSubmissionSchema),
  grade,
);

/**
 * @swagger
 * /api/submissions/{assignmentId}/submissions:
 *   get:
 *     summary: Mengambil semua daftar berkas tugas yang dikumpulkan mahasiswa (Dosen Only)
 *     tags: [Submissions]
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
 *         description: Daftar berkas berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Submission'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/:assignmentId/submissions',
  authenticateToken,
  authorizeRole('DOSEN'),
  getSubmissions,
);

export default router;
