import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  createSemesterSchema,
  updateSemesterSchema,
  updateStatusSchema,
} from './academic.validation.js';
import {
  getAll,
  getActive,
  getById,
  create,
  update,
  updateStatus,
  getClosingReadiness,
  remove,
  getStudentSemesters,
} from './academic.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/academic-semesters:
 *   get:
 *     summary: Get all academic semesters
 *     description: Retrieves a list of all academic semesters with their status and date information.
 *     tags: [Academic Semesters]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of academic semesters
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
 *                         $ref: '#/components/schemas/AcademicSemester'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authenticateToken, getAll);

/**
 * @swagger
 * /api/academic-semesters/active:
 *   get:
 *     summary: Get active academic semester
 *     description: Retrieves the currently active academic semester (status = OPEN).
 *     tags: [Academic Semesters]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active semester details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AcademicSemester'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: No active semester found
 */
router.get('/active', authenticateToken, getActive);

/**
 * @swagger
 * /api/academic-semesters/student-semesters:
 *   get:
 *     summary: Get student's semesters
 *     description: Retrieves academic semesters relevant to the authenticated student based on their enrollment history.
 *     tags: [Academic Semesters]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student's relevant semesters
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
 *                         $ref: '#/components/schemas/AcademicSemester'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/student-semesters', authenticateToken, authorizeRole('MAHASISWA'), getStudentSemesters);

/**
 * @swagger
 * /api/academic-semesters/{id}:
 *   get:
 *     summary: Get semester by ID
 *     description: Retrieves detailed information about a specific academic semester.
 *     tags: [Academic Semesters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UuidIdParam'
 *     responses:
 *       200:
 *         description: Semester details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AcademicSemester'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authenticateToken, getById);

/**
 * @swagger
 * /api/academic-semesters:
 *   post:
 *     summary: Create academic semester
 *     description: Creates a new academic semester with DRAFT status. Only one semester of the same type can exist per academic year.
 *     tags: [Academic Semesters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [academicYear, semesterType]
 *             properties:
 *               academicYear:
 *                 type: string
 *                 pattern: '^\d{4}/\d{4}$'
 *                 example: '2025/2026'
 *                 description: Academic year in YYYY/YYYY format
 *               semesterType:
 *                 type: string
 *                 enum: [GANJIL, GENAP]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               maxSks:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 36
 *                 default: 24
 *                 description: Maximum SKS credits allowed per student
 *     responses:
 *       201:
 *         description: Semester created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AcademicSemester'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Semester already exists for this academic year and type
 */
router.post('/', authenticateToken, authorizeRole('ADMIN'), validate(createSemesterSchema), create);

/**
 * @swagger
 * /api/academic-semesters/{id}:
 *   put:
 *     summary: Update academic semester
 *     description: Updates dates and maximum SKS for an existing academic semester.
 *     tags: [Academic Semesters]
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
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               maxSks:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 36
 *     responses:
 *       200:
 *         description: Semester updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AcademicSemester'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authenticateToken, authorizeRole('ADMIN', 'DOSEN'), validate(updateSemesterSchema), update);

/**
 * @swagger
 * /api/academic-semesters/{id}/status:
 *   patch:
 *     summary: Update semester status
 *     description: Transitions the semester status (DRAFT → OPEN → CLOSED). Status transitions are validated server-side.
 *     tags: [Academic Semesters]
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
 *                 enum: [DRAFT, OPEN, CLOSED]
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AcademicSemester'
 *       400:
 *         description: Invalid status transition
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/status', authenticateToken, authorizeRole('ADMIN'), validate(updateStatusSchema), updateStatus);

/**
 * @swagger
 * /api/academic-semesters/{id}/closing-readiness:
 *   get:
 *     summary: Check closing readiness
 *     description: Checks if a semester is ready to be closed by verifying all grades are finalized and KRS enrollments are resolved.
 *     tags: [Academic Semesters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UuidIdParam'
 *     responses:
 *       200:
 *         description: Closing readiness report
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
 *                         isReady:
 *                           type: boolean
 *                         issues:
 *                           type: array
 *                           items:
 *                             type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/closing-readiness', authenticateToken, authorizeRole('ADMIN'), getClosingReadiness);

/**
 * @swagger
 * /api/academic-semesters/{id}:
 *   delete:
 *     summary: Delete a DRAFT semester
 *     description: Permanently deletes a semester. Only semesters with DRAFT status can be deleted.
 *     tags: [Academic Semesters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UuidIdParam'
 *     responses:
 *       200:
 *         description: Semester deleted
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
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), remove);

export default router;
