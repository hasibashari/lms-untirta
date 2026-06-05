import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  createClassSchema,
  updateClassSchema,
  toggleEnrollmentSchema,
} from './class.validation.js';
import {
  create,
  getAll,
  getById,
  getMyClasses,
  getByCourse,
  getOpen,
  update,
  toggleEnrollment,
  remove,
  getStats,
  getStudentsByClass,
  getAvailableStudentsForClass,
  getMyDashboardStats,
  getTeacherDashboardStats,
} from './class.controller.js';

const router = express.Router();

// ========================================================================
// CLASS ROUTES — /api/classes
// Semua route memerlukan autentikasi.
// CRUD oleh Admin. Dosen bisa melihat kelas yang diajarnya.
// Mahasiswa bisa melihat kelas yang buka pendaftaran.
// ========================================================================

// ========== SPECIFIC ROUTES (tanpa parameter, harus di atas /:id) ==========

/**
 * @swagger
 * /api/classes/me:
 *   get:
 *     summary: Get classes taught by the authenticated lecturer
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lecturer's classes
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
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
  '/me',
  authenticateToken,
  authorizeRole('DOSEN'),
  getMyClasses
);

/**
 * @swagger
 * /api/classes/open:
 *   get:
 *     summary: List classes open for enrollment
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Open class offerings
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
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
  '/open',
  authenticateToken,
  authorizeRole('MAHASISWA', 'ADMIN'),
  getOpen
);

router.get(
  '/stats',
  authenticateToken,
  authorizeRole('ADMIN'),
  getStats
);

router.get('/my-stats', authenticateToken, authorizeRole('MAHASISWA'), getMyDashboardStats);
router.get('/teacher-stats', authenticateToken, authorizeRole('DOSEN'), getTeacherDashboardStats);

/**
 * @swagger
 * /api/classes/course/{courseId}:
 *   get:
 *     summary: List class offerings for a course
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Classes for the course
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Class'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/course/:courseId',
  authenticateToken,
  getByCourse
);

// ========== CRUD ROUTES ==========

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: List all class offerings
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicSemesterId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Paginated class list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Class'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   post:
 *     summary: Create a new class offering
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, lecturerId, academicSemesterId, section, capacity]
 *             properties:
 *               courseId:
 *                 type: string
 *                 format: uuid
 *               lecturerId:
 *                 type: string
 *                 format: uuid
 *               academicSemesterId:
 *                 type: string
 *                 format: uuid
 *               section:
 *                 type: string
 *                 example: A
 *               schedule:
 *                 type: string
 *               room:
 *                 type: string
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Class created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Class'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/',
  authenticateToken,
  authorizeRole('ADMIN', 'DOSEN'),
  getAll
);

router.post(
  '/',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(createClassSchema),
  create
);

// ========== PARAMETERIZED ROUTES (/:id) ==========

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Get class details
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UuidIdParam'
 *     responses:
 *       200:
 *         description: Class details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Class'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Update a class offering
 *     tags: [Classes]
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
 *             properties:
 *               section:
 *                 type: string
 *               schedule:
 *                 type: string
 *               room:
 *                 type: string
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *               lecturerId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Class updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Class'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete a class offering
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UuidIdParam'
 *     responses:
 *       200:
 *         description: Class deleted
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
router.get(
  '/:id',
  authenticateToken,
  getById
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(updateClassSchema),
  update
);

/**
 * @swagger
 * /api/classes/{id}/enrollment:
 *   patch:
 *     summary: Toggle class enrollment status
 *     tags: [Classes]
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
 *             required: [isEnrollmentOpen]
 *             properties:
 *               isEnrollmentOpen:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Enrollment status toggled
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Class'
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
  '/:id/enrollment',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(toggleEnrollmentSchema),
  toggleEnrollment
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  remove
);

router.get(
  '/:id/students',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getStudentsByClass
);

router.get(
  '/:id/available-students',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getAvailableStudentsForClass
);

export default router;
