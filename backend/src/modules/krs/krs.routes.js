import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  enrollClassSchema,
  submitKrsSchema,
  updateStatusSchema,
} from './krs.validation.js';
import {
  // New KRS (Class-based)
  getAvailableClasses,
  enrollClass,
  dropClass,
  getMyKRS,
  submitKRS,
  updateEnrollmentStatus,
  getPendingKRS,
  // Legacy compat
  getAvailableCoursesForKRS,
  selfEnrollCourse,
  selfUnenrollCourse,
  getMyKRSLegacy,
} from './krs.controller.js';

const router = express.Router();

// ========================================================================
// KRS ROUTES — /api/krs
// ========================================================================

// ========== MAHASISWA ROUTES ==========

// GET /api/krs/available — Kelas offering yang tersedia untuk KRS
router.get(
  '/available',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getAvailableClasses
);

// GET /api/krs/my-plan — KRS mahasiswa (enrolled classes)
router.get(
  '/my-plan',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getMyKRS
);

// POST /api/krs/enroll — Tambah kelas ke KRS
router.post(
  '/enroll',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  validate(enrollClassSchema),
  enrollClass
);

// DELETE /api/krs/drop/:classId — Drop kelas dari KRS
router.delete(
  '/drop/:classId',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  dropClass
);

// POST /api/krs/submit — Submit KRS untuk persetujuan
router.post(
  '/submit',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  validate(submitKrsSchema),
  submitKRS
);

// ========== DOSEN / ADMIN ROUTES ==========

// GET /api/krs/pending — KRS yang menunggu persetujuan
router.get(
  '/pending',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getPendingKRS
);

// PATCH /api/krs/:id/status — Approve/reject satu KRS enrollment
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(updateStatusSchema),
  updateEnrollmentStatus
);

// ========================================================================
// LEGACY ROUTES — /api/krs/legacy/*
// Menjaga kompatibilitas dengan frontend lama yang masih pakai /courses/*
// Route ini juga di-mount di course.routes.js
// ========================================================================

// GET /api/krs/legacy/available
router.get(
  '/legacy/available',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getAvailableCoursesForKRS
);

// GET /api/krs/legacy/my-krs
router.get(
  '/legacy/my-krs',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getMyKRSLegacy
);

// POST /api/krs/legacy/:id/enroll-self
router.post(
  '/legacy/:id/enroll-self',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  selfEnrollCourse
);

// DELETE /api/krs/legacy/:id/unenroll-self
router.delete(
  '/legacy/:id/unenroll-self',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  selfUnenrollCourse
);

export default router;
