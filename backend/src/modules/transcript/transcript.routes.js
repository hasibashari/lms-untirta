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

// ========================================================================
// TRANSCRIPT ROUTES — /api/transcript
// ========================================================================

// ========== MAHASISWA ROUTES (specific routes first) ==========

// GET /api/transcript/summary — Ringkasan akademik mahasiswa
router.get(
  '/summary',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getAcademicSummary
);

// GET /api/transcript/study-results — Hasil studi (legacy, Course-based)
router.get(
  '/study-results',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  validate(transcriptQuerySchema),
  getStudyResults
);

// GET /api/transcript/by-class — Transkrip berdasarkan KRS (Class-based)
router.get(
  '/by-class',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  validate(transcriptQuerySchema),
  getTranscriptByClass
);

// ========== DOSEN / ADMIN ROUTES ==========

// GET /api/transcript/students — Daftar semua mahasiswa (Admin)
router.get(
  '/students',
  authenticateToken,
  authorizeRole('ADMIN'),
  getStudentList
);

// GET /api/transcript/student/:studentId — Lihat transkrip mahasiswa tertentu
router.get(
  '/student/:studentId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(studentTranscriptParamsSchema),
  getStudentTranscript
);

export default router;
