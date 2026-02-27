import express from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import {
  createAssignmentSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
  updateAssignmentSchema,
} from './assignment.validation.js';
import {
  create,
  submit,
  getAssignments,
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
} from './assignment.controller.js';

const router = express.Router();

/**
 * GET /api/assignments/my-grades
 * Retrieves all grades for the authenticated student across all enrolled courses.
 * Middleware: Auth Token, Role: MAHASISWA.
 */
router.get('/my-grades', authenticateToken, authorizeRole('MAHASISWA'), getAllMyGrades);

/**
 * GET /api/assignments/my-stats
 * Retrieves dashboard statistics for the authenticated student.
 * Middleware: Auth Token, Role: MAHASISWA.
 */
router.get('/my-stats', authenticateToken, authorizeRole('MAHASISWA'), getMyDashboardStats);

/**
 * GET /api/assignments/teacher-stats
 * Retrieves dashboard statistics for the authenticated teacher.
 * Middleware: Auth Token, Role: DOSEN.
 */
router.get('/teacher-stats', authenticateToken, authorizeRole('DOSEN'), getTeacherDashboardStats);

/**
 * GET /api/assignments/recent-submissions
 * Retrieves recent submissions for the teacher's courses.
 * Middleware: Auth Token, Role: DOSEN.
 */
router.get('/recent-submissions', authenticateToken, authorizeRole('DOSEN'), getRecentSubmissions);

/**
 * POST /api/assignments/course/:courseId
 * Creates a new assignment for a specific course.
 * Middleware: Auth Token, Role: DOSEN, Validation: createAssignmentSchema.
 */
router.post(
  '/course/:courseId',
  authenticateToken,
  authorizeRole('DOSEN'),
  validate(createAssignmentSchema),
  create
);

/**
 * GET /api/assignments/course/:courseId
 * Retrieves all assignments for a specific course.
 * Middleware: Auth Token.
 */
router.get('/course/:courseId', authenticateToken, getAssignments);

/**
 * GET /api/assignments/:assignmentId/me
 * Retrieves assignment details along with the student's submission status.
 * Middleware: Auth Token, Role: MAHASISWA.
 */
router.get('/:assignmentId/me', authenticateToken, authorizeRole('MAHASISWA'), getMyAssignment);

/**
 * POST /api/assignments/:assignmentId/submit
 * Submits an assignment for the authenticated student.
 * Middleware: Auth Token, Role: MAHASISWA, Validation: submitAssignmentSchema.
 */
router.post(
  '/:assignmentId/submit',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  validate(submitAssignmentSchema),
  submit
);

/**
 * PATCH /api/assignments/submissions/:submissionId
 * Grades a specific submission (updates grade and feedback).
 * Middleware: Auth Token, Role: DOSEN/ADMIN, Validation: gradeSubmissionSchema.
 */
router.patch(
  '/submissions/:submissionId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(gradeSubmissionSchema),
  grade
);

/**
 * GET /api/assignments/:assignmentId/submissions
 * Retrieves all submissions for a specific assignment.
 * Middleware: Auth Token, Role: DOSEN/ADMIN.
 */
router.get(
  '/:assignmentId/submissions',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getSubmissions
);

/**
 * GET /api/assignments/:assignmentId
 * Retrieves assignment details (used for edit form or general view).
 * Middleware: Auth Token, Role: DOSEN/ADMIN/MAHASISWA.
 */
router.get(
  '/:assignmentId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN', 'MAHASISWA'),
  getAssignmentDetail
);

/**
 * PUT /api/assignments/:assignmentId
 * Updates an existing assignment.
 * Middleware: Auth Token, Role: DOSEN/ADMIN, Validation: updateAssignmentSchema.
 */
router.put(
  '/:assignmentId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(updateAssignmentSchema),
  updateAssignment
);

/**
 * DELETE /api/assignments/:assignmentId
 * Deletes an assignment and all related submissions.
 * Middleware: Auth Token, Role: DOSEN/ADMIN.
 */
router.delete(
  '/:assignmentId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  deleteAssignment
);

export default router;
