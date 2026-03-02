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
 * @swagger
 * /api/grades/my-grades:
 *   get:
 *     summary: Get my finalized grades
 *     description: Retrieves all finalized grades for the authenticated student across all enrolled classes.
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student's finalized grades
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
 *                         $ref: '#/components/schemas/FinalGrade'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/my-grades',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getMyGrades
);

/**
 * @swagger
 * /api/grades/class/{classId}:
 *   get:
 *     summary: Get class students for grading
 *     description: Retrieves the list of enrolled students in a class with their current grade status. Used by lecturers for the grading interface.
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the class
 *     responses:
 *       200:
 *         description: Students with grade information
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
 *                           student:
 *                             $ref: '#/components/schemas/User'
 *                           finalGrade:
 *                             $ref: '#/components/schemas/FinalGrade'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/class/:classId',
  authenticateToken,
  authorizeRole('DOSEN'),
  getClassStudents
);

/**
 * @swagger
 * /api/grades/class/{classId}:
 *   post:
 *     summary: Input a single grade
 *     description: Inputs or updates the grade for a single student in a class.
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the class
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, letterGrade]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               letterGrade:
 *                 type: string
 *                 enum: ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'E']
 *               numericScore:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               note:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Grade saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FinalGrade'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/class/:classId',
  authenticateToken,
  authorizeRole('DOSEN'),
  validate(inputGradeSchema),
  inputGrade
);

/**
 * @swagger
 * /api/grades/class/{classId}/bulk:
 *   post:
 *     summary: Bulk input grades
 *     description: Inputs or updates grades for multiple students in a class in a single request. Maximum 100 grades per batch.
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the class
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grades]
 *             properties:
 *               grades:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   type: object
 *                   required: [studentId, letterGrade]
 *                   properties:
 *                     studentId:
 *                       type: string
 *                       format: uuid
 *                     letterGrade:
 *                       type: string
 *                       enum: ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'E']
 *                     numericScore:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                     note:
 *                       type: string
 *                       maxLength: 500
 *     responses:
 *       200:
 *         description: Grades saved successfully
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/class/:classId/bulk',
  authenticateToken,
  authorizeRole('DOSEN'),
  validate(bulkInputGradeSchema),
  bulkInputGrades
);

/**
 * @swagger
 * /api/grades/class/{classId}/finalize:
 *   patch:
 *     summary: Finalize class grades
 *     description: Finalizes all grades for a class, making them permanent and visible to students. This action cannot be undone.
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the class
 *     responses:
 *       200:
 *         description: Grades finalized successfully
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
router.patch(
  '/class/:classId/finalize',
  authenticateToken,
  authorizeRole('DOSEN'),
  validate(finalizeGradesSchema),
  finalizeGrades
);

export default router;
