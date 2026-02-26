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

// --- Router Setup ---
const router = express.Router();


/**
 * GET /api/krs/available
 * Retrieves class offerings available for the student to enroll in.
 * Middleware: Auth Token, Role: MAHASISWA.
 */
router.get(
  '/available',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getAvailableClasses
);

/**
 * GET /api/krs/my-plan
 * Retrieves the authenticated student's current study plan (KRS).
 * Middleware: Auth Token, Role: MAHASISWA.
 */
router.get(
  '/my-plan',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getMyKRS
);

/**
 * GET /api/krs/sks-eligibility
 * Retrieves the student's SKS credit eligibility for the current/specified semester.
 * Middleware: Auth Token, Role: MAHASISWA.
 */
router.get(
  '/sks-eligibility',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getSksEligibility
);

/**
 * POST /api/krs/enroll
 * Enrolls the student in a class, adding it to their KRS.
 * Middleware: Auth Token, Role: MAHASISWA, Validation: enrollClassSchema.
 */
router.post(
  '/enroll',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  validate(enrollClassSchema),
  enrollClass
);

/**
 * DELETE /api/krs/drop/:classId
 * Drops a class from the student's KRS (only if not yet approved).
 * Middleware: Auth Token, Role: MAHASISWA.
 */
router.delete(
  '/drop/:classId',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  dropClass
);

/**
 * PATCH /api/krs/:id/revise
 * Resubmits a rejected KRS enrollment for approval.
 * Middleware: Auth Token, Role: MAHASISWA, Validation: reviseEnrollmentSchema.
 */
router.patch(
  '/:id/revise',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  validate(reviseEnrollmentSchema),
  reviseEnrollment
);

/**
 * GET /api/krs/:id/history
 * Retrieves the approval history for a specific KRS enrollment.
 * Middleware: Auth Token. (Authorization handled in service).
 */
router.get(
  '/:id/history',
  authenticateToken,
  getApprovalHistory
);

// ========== DOSEN PEMBIMBING (DOSPEM) ROUTES ==========

/**
 * GET /api/krs/advisory/students
 * Retrieves the list of advisees for the authenticated academic advisor.
 * Middleware: Auth Token, Role: DOSEN.
 */
router.get(
  '/advisory/students',
  authenticateToken,
  authorizeRole('DOSEN'),
  getAdvisoryStudents
);

/**
 * GET /api/krs/advisory/pending
 * Retrieves pending KRS submissions from the advisor's advisees.
 * Middleware: Auth Token, Role: DOSEN.
 */
router.get(
  '/advisory/pending',
  authenticateToken,
  authorizeRole('DOSEN'),
  getPendingKRS
);

/**
 * PATCH /api/krs/advisory/bulk-status
 * Bulk approves or rejects multiple KRS enrollments.
 * Middleware: Auth Token, Role: DOSEN/ADMIN, Validation: bulkUpdateStatusSchema.
 */
router.patch(
  '/advisory/bulk-status',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(bulkUpdateStatusSchema),
  bulkUpdateEnrollmentStatus
);

// ========== ADMIN MONITORING ROUTES ==========

/**
 * GET /api/krs/monitoring
 * Retrieves all KRS data for administrative monitoring.
 * Middleware: Auth Token, Role: ADMIN.
 */
router.get(
  '/monitoring',
  authenticateToken,
  authorizeRole('ADMIN'),
  getKrsMonitoring
);

/**
 * GET /api/krs/pending
 * Retrieves all pending KRS submissions across the system.
 * Middleware: Auth Token, Role: DOSEN/ADMIN.
 */
router.get(
  '/pending',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getPendingKRS
);

/**
 * PATCH /api/krs/:id/status
 * Approves or rejects a single KRS enrollment.
 * Middleware: Auth Token, Role: DOSEN/ADMIN, Validation: updateStatusSchema.
 */
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(updateStatusSchema),
  updateEnrollmentStatus
);

export default router;
