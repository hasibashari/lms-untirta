import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  inputGradeSchema,
  bulkInputGradeSchema,
  finalizeGradesSchema,
} from './grade.validation.js';
import {
  getClassStudents,
  inputGrade,
  bulkInputGrades,
  finalizeGrades,
  getMyGrades,
} from './grade.controller.js';

const router = express.Router();

/**
 * GET /api/grades/my-grades
 * Retrieves the authenticated student's finalized grades.
 * Middleware: Auth Token, Role: MAHASISWA.
 */
router.get(
  '/my-grades',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getMyGrades
);

/**
 * GET /api/grades/class/:classId
 * Retrieves the list of students in a class for grading (Lecturer).
 * Middleware: Auth Token, Role: DOSEN.
 */
router.get(
  '/class/:classId',
  authenticateToken,
  authorizeRole('DOSEN'),
  getClassStudents
);

/**
 * POST /api/grades/class/:classId
 * Inputs or updates a grade for a single student.
 * Middleware: Auth Token, Role: DOSEN, Validation: inputGradeSchema.
 */
router.post(
  '/class/:classId',
  authenticateToken,
  authorizeRole('DOSEN'),
  validate(inputGradeSchema),
  inputGrade
);

/**
 * POST /api/grades/class/:classId/bulk
 * Inputs or updates grades for multiple students.
 * Middleware: Auth Token, Role: DOSEN, Validation: bulkInputGradeSchema.
 */
router.post(
  '/class/:classId/bulk',
  authenticateToken,
  authorizeRole('DOSEN'),
  validate(bulkInputGradeSchema),
  bulkInputGrades
);

/**
 * PATCH /api/grades/class/:classId/finalize
 * Finalizes grades for a class.
 * Middleware: Auth Token, Role: DOSEN.
 */
router.patch(
  '/class/:classId/finalize',
  authenticateToken,
  authorizeRole('DOSEN'),
  finalizeGrades
);

export default router;
