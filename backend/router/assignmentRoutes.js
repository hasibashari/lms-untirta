import express from 'express';
import validate from '../middlewares/validate.js';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddlewareJWT.js';
import {
  submitAssignmentSchema,
  gradeSubmissionSchema,
} from '../validations/assignmentValidation.js';
import {
  create,
  submit,
  getSubmissions,
  grade,
  getMyAssignment,
} from '../controllers/assignmentController.js';

const router = express.Router();

// GET ASSIGNMENT DETAIL with MY SUBMISSION (Mahasiswa)
// URL: GET /api/assignments/:assignmentId/me
// Endpoint untuk mahasiswa melihat detail tugas + status submission mereka
router.get('/:assignmentId/me', authenticateToken, authorizeRole('MAHASISWA'), getMyAssignment);

// Route untuk SUBMIT TUGAS (Student)
// URL: POST /api/assignments/:assignmentId/submit
router.post(
  '/:assignmentId/submit',
  authenticateToken,
  authorizeRole('MAHASISWA'), // Hanya mahasiswa
  validate(submitAssignmentSchema),
  submit
);

// 1. GET SUBMISSIONS (Dosen melihat siapa yang sudah kumpul di tugas tertentu)
// URL: GET /api/assignments/:assignmentId/submissions
router.get(
  '/:assignmentId/submissions',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getSubmissions
);

// 2. GRADE SUBMISSION (Dosen memberi nilai pada submission tertentu)
// URL: PATCH /api/assignments/submissions/:submissionId
// Note: Kita pakai PATCH karena hanya mengupdate sebagian data (grade & feedback)
router.patch(
  '/submissions/:submissionId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(gradeSubmissionSchema),
  grade
);

export default router;
