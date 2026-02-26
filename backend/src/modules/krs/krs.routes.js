import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  enrollClassSchema,
  updateStatusSchema,
  bulkUpdateStatusSchema,
  reviseEnrollmentSchema,
} from './krs.validation.js';
import {
  // New KRS (Class-based)
  getAvailableClasses,
  enrollClass,
  dropClass,
  getMyKRS,
  updateEnrollmentStatus,
  bulkUpdateEnrollmentStatus,
  getPendingKRS,
  getAdvisoryStudents,
  getKrsMonitoring,
  // Revise & History
  reviseEnrollment,
  getApprovalHistory,
  // SKS Eligibility
  getSksEligibility,
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

// GET /api/krs/sks-eligibility — Info kelayakan SKS berdasarkan IPK
router.get(
  '/sks-eligibility',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getSksEligibility
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

// PATCH /api/krs/:id/revise — Resubmit KRS yang ditolak (REJECTED → PENDING)
router.patch(
  '/:id/revise',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  validate(reviseEnrollmentSchema),
  reviseEnrollment
);

// GET /api/krs/:id/history — Riwayat approval KRS
router.get(
  '/:id/history',
  authenticateToken,
  getApprovalHistory
);

// ========== DOSEN PEMBIMBING (DOSPEM) ROUTES ==========

// GET /api/krs/advisory/students — Daftar mahasiswa bimbingan Dospem
router.get(
  '/advisory/students',
  authenticateToken,
  authorizeRole('DOSEN'),
  getAdvisoryStudents
);

// GET /api/krs/advisory/pending — KRS pending dari mahasiswa bimbingan
router.get(
  '/advisory/pending',
  authenticateToken,
  authorizeRole('DOSEN'),
  getPendingKRS
);

// PATCH /api/krs/advisory/bulk-status — Bulk approve/reject KRS (Dospem/Admin)
router.patch(
  '/advisory/bulk-status',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(bulkUpdateStatusSchema),
  bulkUpdateEnrollmentStatus
);

// ========== ADMIN MONITORING ROUTES ==========

// GET /api/krs/monitoring — Monitoring KRS (Admin read-only)
router.get(
  '/monitoring',
  authenticateToken,
  authorizeRole('ADMIN'),
  getKrsMonitoring
);

// GET /api/krs/pending — KRS yang menunggu persetujuan (Admin/Dospem)
router.get(
  '/pending',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getPendingKRS
);

// PATCH /api/krs/:id/status — Approve/reject satu KRS enrollment (Dospem/Admin)
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(updateStatusSchema),
  updateEnrollmentStatus
);

export default router;
