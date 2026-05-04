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

// ========== MAHASISWA ROUTES ==========

/**
 * @swagger
 * /api/krs/available:
 *   get:
 *     summary: Get available classes for enrollment
 *     description: Retrieves class offerings available for the authenticated student to enroll in during the active semester.
 *     tags: [KRS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicSemesterId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by academic semester ID
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *         description: Filter by course semester number
 *     responses:
 *       200:
 *         description: List of available classes
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Class'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/available',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getAvailableClasses
);

/**
 * @swagger
 * /api/krs/my-krs:
 *   get:
 *     summary: Get my KRS
 *     description: Retrieves the authenticated student's current KRS enrollments for the active semester.
 *     tags: [KRS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student's KRS plan
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         enrollments:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/KrsEnrollment'
 *                         totalSks:
 *                           type: integer
 *                           example: 20
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/my-krs',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getMyKRS
);

/**
 * @swagger
 * /api/krs/sks-eligibility:
 *   get:
 *     summary: Get SKS credit eligibility
 *     description: Retrieves the student's maximum SKS credits allowed based on their previous semester GPA.
 *     tags: [KRS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SKS eligibility information
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         maxSks:
 *                           type: integer
 *                           example: 24
 *                         currentSks:
 *                           type: integer
 *                           example: 18
 *                         remainingSks:
 *                           type: integer
 *                           example: 6
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/sks-eligibility',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getSksEligibility
);

/**
 * @swagger
 * /api/krs/enroll:
 *   post:
 *     summary: Enroll in a class
 *     description: Adds a class to the student's KRS. The enrollment will be pending advisor approval.
 *     tags: [KRS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId]
 *             properties:
 *               classId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the class to enroll in
 *     responses:
 *       201:
 *         description: Successfully enrolled
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/KrsEnrollment'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Already enrolled in this class or SKS limit exceeded
 */
router.post(
  '/enroll',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  validate(enrollClassSchema),
  enrollClass
);

/**
 * @swagger
 * /api/krs/drop/{classId}:
 *   delete:
 *     summary: Drop a class from KRS
 *     description: Removes a class from the student's KRS. Only allowed for enrollments that are not yet approved.
 *     tags: [KRS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the class to drop
 *     responses:
 *       200:
 *         description: Class dropped successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/drop/:classId',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  dropClass
);

/**
 * @swagger
 * /api/krs/{id}/revise:
 *   patch:
 *     summary: Revise a rejected KRS enrollment
 *     description: Resubmits a previously rejected KRS enrollment for advisor approval.
 *     tags: [KRS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UuidIdParam'
 *     responses:
 *       200:
 *         description: Enrollment resubmitted for approval
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/KrsEnrollment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/:id/revise',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  validate(reviseEnrollmentSchema),
  reviseEnrollment
);

/**
 * @swagger
 * /api/krs/{id}/history:
 *   get:
 *     summary: Get approval history for a KRS enrollment
 *     description: Retrieves the full approval/rejection history log for a specific KRS enrollment.
 *     tags: [KRS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UuidIdParam'
 *     responses:
 *       200:
 *         description: Approval history entries
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           status:
 *                             type: string
 *                             enum: [PENDING, APPROVED, REJECTED]
 *                           note:
 *                             type: string
 *                           changedBy:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id/history',
  authenticateToken,
  getApprovalHistory
);

// ========== DOSEN PEMBIMBING (DOSPEM) ROUTES ==========

/**
 * @swagger
 * /api/krs/advisory/students:
 *   get:
 *     summary: Get advisory students
 *     description: Retrieves the list of students assigned to the authenticated academic advisor (dosen pembimbing).
 *     tags: [KRS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of advisee students
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/advisory/students',
  authenticateToken,
  authorizeRole('DOSEN'),
  getAdvisoryStudents
);

/**
 * @swagger
 * /api/krs/advisory/pending:
 *   get:
 *     summary: Get pending KRS from advisees
 *     description: Retrieves pending KRS enrollment submissions from the advisor's assigned students.
 *     tags: [KRS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending KRS enrollments from advisees
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/KrsEnrollment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/advisory/pending',
  authenticateToken,
  authorizeRole('DOSEN'),
  getPendingKRS
);

/**
 * @swagger
 * /api/krs/advisory/bulk-status:
 *   patch:
 *     summary: Bulk approve/reject KRS enrollments
 *     description: Approves or rejects multiple KRS enrollments in a single request.
 *     tags: [KRS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enrollmentIds, status]
 *             properties:
 *               enrollmentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 maxItems: 50
 *                 description: Array of KRS enrollment IDs to update
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               note:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional note for the decision
 *     responses:
 *       200:
 *         description: Enrollments updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
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
 * @swagger
 * /api/krs/monitoring:
 *   get:
 *     summary: KRS monitoring (Admin)
 *     description: Retrieves all KRS data across the system for administrative monitoring and reporting.
 *     tags: [KRS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: KRS monitoring data
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/KrsEnrollment'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/monitoring',
  authenticateToken,
  authorizeRole('ADMIN'),
  getKrsMonitoring
);

/**
 * @swagger
 * /api/krs/pending:
 *   get:
 *     summary: Get all pending KRS submissions
 *     description: Retrieves all pending KRS enrollment submissions across the system.
 *     tags: [KRS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All pending KRS enrollments
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/KrsEnrollment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/pending',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getPendingKRS
);

/**
 * @swagger
 * /api/krs/{id}/status:
 *   patch:
 *     summary: Update KRS enrollment status
 *     description: Approves or rejects a single KRS enrollment by its ID.
 *     tags: [KRS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UuidIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               note:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional note for the decision
 *     responses:
 *       200:
 *         description: Enrollment status updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/KrsEnrollment'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(updateStatusSchema),
  updateEnrollmentStatus
);

export default router;
