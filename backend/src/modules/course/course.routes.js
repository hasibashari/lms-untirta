import express from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
import { createCourseSchema, enrollStudentSchema, updateCourseSchema, assignTeacherSchema } from './course.validation.js';
import {
  createCourse,
  enrollStudent,
  getCourses,
  getMyCourses,
  getStudentsByCourse,
  getAvailableStudents,
  // Admin Course Management
  adminGetAllCourses,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  adminAssignTeacher,
} from './course.controller.js';

// Transcript legacy route — delegated to transcript module controller
import { getStudyResults } from '../transcript/transcript.controller.js';

import { createMaterial, getMaterials } from '../material/material.controller.js';
import { createMaterialSchema } from '../material/material.validation.js';

// --- Router Setup ---
const router = express.Router();

/**
 * @swagger
 * /api/courses/me:
 *   get:
 *     summary: Get my courses (role-aware)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Courses relevant to the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', authenticateToken, getMyCourses);

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: List all courses
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Paginated course list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authenticateToken, getCourses);

/**
 * @swagger
 * /api/courses/study-results:
 *   get:
 *     summary: Get study results (student transcript legacy)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Study results for the authenticated student
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/study-results',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getStudyResults
);


/**
 * @swagger
 * /api/courses/admin/all:
 *   get:
 *     summary: List all courses (admin detail view)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or code
 *     responses:
 *       200:
 *         description: Paginated admin course list with teacher info
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/admin/all',
  authenticateToken,
  authorizeRole('ADMIN'),
  adminGetAllCourses
);

/**
 * @swagger
 * /api/courses/admin:
 *   post:
 *     summary: Create a course (admin)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, code, sks]
 *             properties:
 *               title:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               semester:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 8
 *               sks:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 6
 *               teacherId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Course created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/admin',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(createCourseSchema),
  adminCreateCourse
);

/**
 * @swagger
 * /api/courses/admin/{id}:
 *   put:
 *     summary: Update a course (admin)
 *     tags: [Courses]
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
 *               title:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               semester:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 8
 *               sks:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 6
 *     responses:
 *       200:
 *         description: Course updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
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
  '/admin/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(updateCourseSchema),
  adminUpdateCourse
);

/**
 * @swagger
 * /api/courses/admin/{id}:
 *   delete:
 *     summary: Delete a course (admin)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UuidIdParam'
 *     responses:
 *       200:
 *         description: Course deleted
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
  '/admin/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  adminDeleteCourse
);

/**
 * @swagger
 * /api/courses/admin/{id}/assign-teacher:
 *   patch:
 *     summary: Assign a teacher to a course
 *     tags: [Courses]
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
 *             required: [teacherId]
 *             properties:
 *               teacherId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Teacher assigned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
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
  '/admin/:id/assign-teacher',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(assignTeacherSchema),
  adminAssignTeacher
);


/**
 * @swagger
 * /api/courses/{id}/students:
 *   get:
 *     summary: List students enrolled in a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UuidIdParam'
 *     responses:
 *       200:
 *         description: Enrolled students
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id/students',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getStudentsByCourse
);

/**
 * @swagger
 * /api/courses/{id}/available-students:
 *   get:
 *     summary: List students not yet enrolled in a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/UuidIdParam'
 *     responses:
 *       200:
 *         description: Available students
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id/available-students',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getAvailableStudents
);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a course (teacher / admin)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, code, sks]
 *             properties:
 *               title:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               semester:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 8
 *               sks:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 6
 *     responses:
 *       201:
 *         description: Course created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(createCourseSchema),
  createCourse
);

/**
 * @swagger
 * /api/courses/{id}/enroll:
 *   post:
 *     summary: Enroll a student in a course
 *     tags: [Courses]
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
 *             required: [studentId]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Student enrolled
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
 *       409:
 *         description: Student already enrolled
 */
router.post(
  '/:id/enroll',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(enrollStudentSchema),
  enrollStudent
);

/**
 * @swagger
 * /api/courses/{courseId}/materials:
 *   post:
 *     summary: Create a material for a course
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *                 format: uri
 *               order:
 *                 type: integer
 *               isPublished:
 *                 type: boolean
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Material created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Material'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   get:
 *     summary: List materials for a course
 *     tags: [Materials]
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
 *         description: Course materials
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Material'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/:courseId/materials',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  upload.single('file'),
  validate(createMaterialSchema),
  createMaterial
);

router.get(
  '/:courseId/materials',
  authenticateToken,
  getMaterials
);

export default router;
