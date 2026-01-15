import express from 'express';
import validate from '../middlewares/validate.js';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddlewareJWT.js';
import {
  submitAssignmentSchema,
  gradeSubmissionSchema,
  updateAssignmentSchema,
} from '../validations/assignmentValidation.js';
import {
  create,
  submit,
  getSubmissions,
  grade,
  getMyAssignment,
  getAllMyGrades,
  getMyDashboardStats,
  getTeacherDashboardStats,
  getRecentSubmissions,
  getAssignmentDetail,
  updateAssignment,
  deleteAssignment,
} from '../controllers/assignmentController.js';

const router = express.Router();

// GET ALL MY GRADES (Mahasiswa) - Nilai terpusat dari semua kelas
// URL: GET /api/assignments/my-grades
router.get('/my-grades', authenticateToken, authorizeRole('MAHASISWA'), getAllMyGrades);

// GET DASHBOARD STATS (Mahasiswa) - Statistik untuk dashboard
// URL: GET /api/assignments/my-stats
router.get('/my-stats', authenticateToken, authorizeRole('MAHASISWA'), getMyDashboardStats);

// GET DASHBOARD STATS (Dosen) - Statistik untuk dashboard dosen
// URL: GET /api/assignments/teacher-stats
router.get('/teacher-stats', authenticateToken, authorizeRole('DOSEN'), getTeacherDashboardStats);

// GET RECENT SUBMISSIONS (Dosen) - Submissions terbaru untuk notifikasi
// URL: GET /api/assignments/recent-submissions
router.get('/recent-submissions', authenticateToken, authorizeRole('DOSEN'), getRecentSubmissions);

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

// --- ASSIGNMENT CRUD ROUTES ---

// GET /api/assignments/:assignmentId - Get Assignment Detail (untuk edit form & mahasiswa view)
router.get(
  '/:assignmentId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN', 'MAHASISWA'),
  getAssignmentDetail
);

// PUT /api/assignments/:assignmentId - Update Assignment (Dosen Only)
router.put(
  '/:assignmentId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(updateAssignmentSchema),
  updateAssignment
);

// DELETE /api/assignments/:assignmentId - Delete Assignment (Dosen Only)
// CATATAN: Ini juga akan menghapus semua submission terkait
router.delete(
  '/:assignmentId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  deleteAssignment
);

export default router;
