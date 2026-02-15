import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import {
  getStudyResults,
  getTranscriptByClass,
  getAcademicSummary,
  getStudentTranscript,
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
  getStudyResults
);

// GET /api/transcript/by-class — Transkrip berdasarkan KRS (Class-based)
router.get(
  '/by-class',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getTranscriptByClass
);

// ========== DOSEN / ADMIN ROUTES ==========

// GET /api/transcript/student/:studentId — Lihat transkrip mahasiswa tertentu
router.get(
  '/student/:studentId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getStudentTranscript
);

export default router;
