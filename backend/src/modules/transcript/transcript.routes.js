import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  transcriptQuerySchema,
  studentTranscriptParamsSchema,
} from './transcript.validation.js';
import {
  getStudyResults,
  getTranscriptByClass,
  getAcademicSummary,
  getStudentTranscript,
  getStudentList,
} from './transcript.controller.js';

const router = express.Router();


// ========== MAHASISWA ROUTES (specific routes first) ==========

/**
 * GET /api/transcript/summary
 * Retrieves a summary of the authenticated student's academic progress.
 * Middleware: Auth Token, Role: MAHASISWA.
 */
router.get(
  '/summary',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getAcademicSummary
);

/**
 * GET /api/transcript/study-results
 * Retrieves study results based on legacy course enrollments.
 * Middleware: Auth Token, Role: MAHASISWA, Validation: transcriptQuerySchema.
 */
router.get(
  '/study-results',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  validate(transcriptQuerySchema),
  getStudyResults
);

/**
 * GET /api/transcript/by-class
 * Retrieves the transcript based on modern class enrollments (KRS).
 * Middleware: Auth Token, Role: MAHASISWA, Validation: transcriptQuerySchema.
 */
router.get(
  '/by-class',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  validate(transcriptQuerySchema),
  getTranscriptByClass
);

// ========== DOSEN / ADMIN ROUTES ==========

/**
 * GET /api/transcript/students
 * Retrieves a list of all students for administrative purposes.
 * Middleware: Auth Token, Role: ADMIN.
 */
router.get(
  '/students',
  authenticateToken,
  authorizeRole('ADMIN'),
  getStudentList
);

/**
 * GET /api/transcript/student/:studentId
 * Retrieves the full transcript of a specific student.
 * Middleware: Auth Token, Role: DOSEN/ADMIN, Validation: studentTranscriptParamsSchema.
 */
router.get(
  '/student/:studentId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(studentTranscriptParamsSchema),
  getStudentTranscript
);

export default router;
