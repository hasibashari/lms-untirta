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
  getMyDashboardStats,
  getTeacherDashboardStats,
  getRecentSubmissions,
} from './submission.controller.js';

const router = express.Router();

router.get('/my-grades', authenticateToken, authorizeRole('MAHASISWA'), getAllMyGrades);
router.get('/my-stats', authenticateToken, authorizeRole('MAHASISWA'), getMyDashboardStats);
router.get('/teacher-stats', authenticateToken, authorizeRole('DOSEN'), getTeacherDashboardStats);
router.get('/recent-submissions', authenticateToken, authorizeRole('DOSEN'), getRecentSubmissions);

router.get('/:assignmentId/me', authenticateToken, authorizeRole('MAHASISWA'), getMyAssignment);

router.post(
  '/:assignmentId/submit',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  upload.single('file'),
  validate(submitAssignmentSchema),
  submit,
);

router.patch(
  '/:submissionId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(gradeSubmissionSchema),
  grade,
);

router.get(
  '/:assignmentId/submissions',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getSubmissions,
);

export default router;
