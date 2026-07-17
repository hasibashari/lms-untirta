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
  getMyTranscript,
  getStudentTranscript,
  getStudentList,
} from './transcript.controller.js';

const router = express.Router();


// ========== MAHASISWA ROUTES (specific routes first) ==========

/**
 * @swagger
 * /api/transcript/me:
 *   get:
 *     summary: Get my transcript
 *     description: Retrieves the full transcript of the authenticated student.
 *     tags: [Transcript]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student transcript data
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
 *                         student:
 *                           $ref: '#/components/schemas/User'
 *                         grades:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/FinalGrade'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/me',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getMyTranscript
);

/**
 * @swagger
 * /api/transcript/summary:
 *   get:
 *     summary: Get academic summary
 *     description: Retrieves a summary of the authenticated student's academic progress including cumulative GPA, total SKS, and semester-by-semester breakdown.
 *     tags: [Transcript]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Academic progress summary
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
 *                         cumulativeGpa:
 *                           type: number
 *                           format: float
 *                           example: 3.45
 *                         totalSks:
 *                           type: integer
 *                           example: 120
 *                         totalCourses:
 *                           type: integer
 *                           example: 40
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/summary',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getAcademicSummary
);

/**
 * @swagger
 * /api/transcript/study-results:
 *   get:
 *     summary: Get study results (legacy)
 *     description: Retrieves study results based on legacy course enrollments. Supports filtering by semester.
 *     tags: [Transcript]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *         description: Filter by course semester number (1-8)
 *       - in: query
 *         name: academicSemesterId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by academic semester ID
 *     responses:
 *       200:
 *         description: Study results
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
 *                           course:
 *                             $ref: '#/components/schemas/Course'
 *                           grade:
 *                             type: string
 *                             example: A
 *                           gradePoint:
 *                             type: number
 *                             format: float
 *                             example: 4.0
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/study-results',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  validate(transcriptQuerySchema),
  getStudyResults
);

/**
 * @swagger
 * /api/transcript/by-class:
 *   get:
 *     summary: Get transcript by class enrollment
 *     description: Retrieves the transcript based on modern class enrollments (KRS system). Supports filtering by semester.
 *     tags: [Transcript]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *         description: Filter by course semester number (1-8)
 *       - in: query
 *         name: academicSemesterId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by academic semester ID
 *     responses:
 *       200:
 *         description: Class-based transcript
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
 *                           class:
 *                             $ref: '#/components/schemas/Class'
 *                           finalGrade:
 *                             $ref: '#/components/schemas/FinalGrade'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
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
 * @swagger
 * /api/transcript/students:
 *   get:
 *     summary: Get student list for transcripts
 *     description: Retrieves a list of all students for administrative transcript management.
 *     tags: [Transcript]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students
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
  '/students',
  authenticateToken,
  authorizeRole('ADMIN'),
  getStudentList
);

/**
 * @swagger
 * /api/transcript/student/{studentId}:
 *   get:
 *     summary: Get student transcript
 *     description: Retrieves the full transcript of a specific student by their ID. Accessible by lecturers, admins, and the student themselves.
 *     tags: [Transcript]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the student
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *         description: Filter by course semester number
 *     responses:
 *       200:
 *         description: Student transcript data
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
 *                         student:
 *                           $ref: '#/components/schemas/User'
 *                         grades:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/FinalGrade'
 *                         summary:
 *                           type: object
 *                           properties:
 *                             cumulativeGpa:
 *                               type: number
 *                               format: float
 *                             totalSks:
 *                               type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/student/:studentId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN', 'MAHASISWA'),
  validate(studentTranscriptParamsSchema),
  getStudentTranscript
);

export default router;
