import express from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
import {
  createAssignmentSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
  updateAssignmentSchema,
} from './assignment.validation.js';
import {
  create,
  submit,
  getAssignments,
  getSubmissions,
  grade,
  getMyAssignment,
  getAllMyGrades,
  getMyDashboardStats,
  getTeacherDashboardStats,
  getRecentSubmissions,
  getAssignmentDetail,
  updateAssignment,
  deleteAssignment,
} from './assignment.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/assignments/my-grades:
 *   get:
 *     summary: Get all my assignment grades
 *     description: Retrieves all grades for the authenticated student across all enrolled courses.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student's assignment grades
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
 *                           assignmentId:
 *                             type: string
 *                             format: uuid
 *                           title:
 *                             type: string
 *                           grade:
 *                             type: number
 *                             nullable: true
 *                           feedback:
 *                             type: string
 *                             nullable: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/my-grades', authenticateToken, authorizeRole('MAHASISWA'), getAllMyGrades);

/**
 * @swagger
 * /api/assignments/my-stats:
 *   get:
 *     summary: Get student dashboard stats
 *     description: Retrieves dashboard statistics for the authenticated student including assignment counts, average grades, and submission status.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/my-stats', authenticateToken, authorizeRole('MAHASISWA'), getMyDashboardStats);

/**
 * @swagger
 * /api/assignments/teacher-stats:
 *   get:
 *     summary: Get teacher dashboard stats
 *     description: Retrieves dashboard statistics for the authenticated teacher including total assignments, pending submissions, and grading progress.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/teacher-stats', authenticateToken, authorizeRole('DOSEN'), getTeacherDashboardStats);

/**
 * @swagger
 * /api/assignments/recent-submissions:
 *   get:
 *     summary: Get recent submissions
 *     description: Retrieves the most recent submissions across the teacher's courses for quick review.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent submissions list
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
 *                         $ref: '#/components/schemas/Submission'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/recent-submissions', authenticateToken, authorizeRole('DOSEN'), getRecentSubmissions);

/**
 * @swagger
 * /api/assignments/course/{courseId}:
 *   post:
 *     summary: Create assignment for a course
 *     description: Creates a new assignment within a specific course. Only the course instructor can create assignments.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Course UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, dueDate]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: ISO 8601 date-time for the submission deadline
 *     responses:
 *       201:
 *         description: Assignment created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Assignment'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Course not found
 */
router.post(
  '/course/:courseId',
  authenticateToken,
  authorizeRole('DOSEN'),
  validate(createAssignmentSchema),
  create
);

/**
 * @swagger
 * /api/assignments/course/{courseId}:
 *   get:
 *     summary: Get assignments for a course
 *     description: Retrieves all assignments for a specific course.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Course UUID
 *     responses:
 *       200:
 *         description: List of assignments
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
 *                         $ref: '#/components/schemas/Assignment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Course not found
 */
router.get('/course/:courseId', authenticateToken, getAssignments);

/**
 * @swagger
 * /api/assignments/{assignmentId}/me:
 *   get:
 *     summary: Get my assignment details
 *     description: Retrieves assignment details along with the authenticated student's submission status and grade.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment UUID
 *     responses:
 *       200:
 *         description: Assignment with student submission
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Assignment'
 *                         - type: object
 *                           properties:
 *                             submission:
 *                               $ref: '#/components/schemas/Submission'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:assignmentId/me', authenticateToken, authorizeRole('MAHASISWA'), getMyAssignment);

/**
 * @swagger
 * /api/assignments/{assignmentId}/submit:
 *   post:
 *     summary: Submit an assignment
 *     description: Submits an assignment for the authenticated student. Accepts multipart/form-data with a required file upload.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment UUID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Submission file attachment
 *               note:
 *                 type: string
 *                 description: Optional note for the submission
 *     responses:
 *       201:
 *         description: Submission created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Submission'
 *       400:
 *         description: Already submitted or past due date
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/:assignmentId/submit',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  upload.single('file'),
  validate(submitAssignmentSchema),
  submit
);

/**
 * @swagger
 * /api/assignments/submissions/{submissionId}:
 *   patch:
 *     summary: Grade a submission
 *     description: Grades a specific student submission by providing a score and optional feedback.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Submission UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grade]
 *             properties:
 *               grade:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Numeric grade (0-100)
 *               feedback:
 *                 type: string
 *                 description: Optional feedback for the student
 *     responses:
 *       200:
 *         description: Submission graded
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Submission'
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
  '/submissions/:submissionId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(gradeSubmissionSchema),
  grade
);

/**
 * @swagger
 * /api/assignments/{assignmentId}/submissions:
 *   get:
 *     summary: Get submissions for an assignment
 *     description: Retrieves all student submissions for a specific assignment including grades and file URLs.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment UUID
 *     responses:
 *       200:
 *         description: Submissions list
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
 *                         $ref: '#/components/schemas/Submission'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Assignment not found
 */
router.get(
  '/:assignmentId/submissions',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getSubmissions
);

/**
 * @swagger
 * /api/assignments/{assignmentId}:
 *   get:
 *     summary: Get assignment detail
 *     description: Retrieves detailed information about a specific assignment.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment UUID
 *     responses:
 *       200:
 *         description: Assignment details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Assignment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:assignmentId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN', 'MAHASISWA'),
  getAssignmentDetail
);

/**
 * @swagger
 * /api/assignments/{assignmentId}:
 *   put:
 *     summary: Update an assignment
 *     description: Updates the title, description, or due date of an existing assignment.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Assignment updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Assignment'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  '/:assignmentId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(updateAssignmentSchema),
  updateAssignment
);

/**
 * @swagger
 * /api/assignments/{assignmentId}:
 *   delete:
 *     summary: Delete an assignment
 *     description: Permanently deletes an assignment and all related submissions.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment UUID
 *     responses:
 *       200:
 *         description: Assignment deleted
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
  '/:assignmentId',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  deleteAssignment
);

export default router;
