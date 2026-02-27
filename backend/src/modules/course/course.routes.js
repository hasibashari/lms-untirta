import express from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
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
 * GET /api/courses/me
 * Retrieves courses relevant to the authenticated user based on their role.
 * Middleware: Auth Token.
 */
router.get('/me', authenticateToken, getMyCourses);

/**
 * GET /api/courses
 * Retrieves all courses available in the system.
 * Middleware: Auth Token.
 */
router.get('/', authenticateToken, getCourses);

/**
 * GET /api/courses/study-results
 * Retrieves the study results (transcript) for the authenticated student.
 * Middleware: Auth Token, Role: MAHASISWA.
 */

router.get(
  '/study-results',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getStudyResults
);


/**
 * GET /api/courses/admin/all
 * Retrieves all courses with detailed administrative info.
 * Middleware: Auth Token, Role: ADMIN.
 */
router.get(
  '/admin/all',
  authenticateToken,
  authorizeRole('ADMIN'),
  adminGetAllCourses
);

/**
 * POST /api/courses/admin
 * Creates a new course (Admin).
 * Middleware: Auth Token, Role: ADMIN, Validation: createCourseSchema.
 */
router.post(
  '/admin',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(createCourseSchema),
  adminCreateCourse
);

/**
 * PUT /api/courses/admin/:id
 * Updates an existing course (Admin).
 * Middleware: Auth Token, Role: ADMIN, Validation: updateCourseSchema.
 */
router.put(
  '/admin/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(updateCourseSchema),
  adminUpdateCourse
);

/**
 * DELETE /api/courses/admin/:id
 * Deletes a course (Admin).
 * Middleware: Auth Token, Role: ADMIN.
 */
router.delete(
  '/admin/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  adminDeleteCourse
);

/**
 * PATCH /api/courses/admin/:id/assign-teacher
 * Assigns a teacher to a course.
 * Middleware: Auth Token, Role: ADMIN, Validation: assignTeacherSchema.
 */
router.patch(
  '/admin/:id/assign-teacher',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(assignTeacherSchema),
  adminAssignTeacher
);


/**
 * GET /api/courses/:id/students
 * Retrieves students enrolled in a course.
 * Middleware: Auth Token, Role: DOSEN/ADMIN.
 */
router.get(
  '/:id/students',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getStudentsByCourse
);

/**
 * GET /api/courses/:id/available-students
 * Retrieves students not yet enrolled in a course.
 * Middleware: Auth Token, Role: DOSEN/ADMIN.
 */
router.get(
  '/:id/available-students',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getAvailableStudents
);

/**
 * POST /api/courses
 * Creates a new course (Teacher/Admin).
 * Middleware: Auth Token, Role: DOSEN/ADMIN, Validation: createCourseSchema.
 */
router.post(
  '/',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(createCourseSchema),
  createCourse
);

/**
 * POST /api/courses/:id/enroll
 * Enrolls a student in a course.
 * Middleware: Auth Token, Role: DOSEN/ADMIN, Validation: enrollStudentSchema.
 */
router.post(
  '/:id/enroll',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(enrollStudentSchema),
  enrollStudent
);

/**
 * POST /api/courses/:courseId/materials
 * Creates a new material for a course.
 * Middleware: Auth Token, Role: DOSEN/ADMIN, Validation: createMaterialSchema.
 */
router.post(
  '/:courseId/materials',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(createMaterialSchema),
  createMaterial
);

/**
 * GET /api/courses/:courseId/materials
 * Retrieves materials for a course.
 * Middleware: Auth Token.
 */
router.get(
  '/:courseId/materials',
  authenticateToken,
  getMaterials
);

export default router;
