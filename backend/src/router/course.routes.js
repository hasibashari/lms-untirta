import express from 'express';
import validate from '../middlewares/validate.js';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddleware.js';
import { createCourseSchema, enrollStudentSchema, updateCourseSchema, assignTeacherSchema } from '../validations/courseValidation.js';
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
  // KRS (Self Enrollment)
  getAvailableCoursesForKRS,
  selfEnrollCourse,
  selfUnenrollCourse,
  getMyKRS,
  getStudyResults,
} from '../controllers/course.controller.js';

import { createMaterial, getMaterials } from '../controllers/material.controller.js';
import { createMaterialSchema } from '../validations/materialValidation.js';
import { create, getAssignments } from '../controllers/assignment.controller.js';
import { createAssignmentSchema } from '../validations/assignmentValidation.js';

// --- Router Setup ---

const router = express.Router();

// --- API Routes ---
// PENTING: Route spesifik harus di atas route dengan parameter (/:id) untuk menghindari konflik

// ========== SPECIFIC ROUTES (tanpa parameter) ==========

// 1. Route My Courses (Dynamic based on role)
router.get('/me', authenticateToken, getMyCourses);

// 2. Route Get All Courses
router.get('/', authenticateToken, getCourses);

// ========== KRS ROUTES (Mahasiswa) - HARUS DI ATAS /:id ==========

// GET /api/courses/available - Get Available Courses for Enrollment
router.get(
  '/available',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getAvailableCoursesForKRS
);

// GET /api/courses/my-krs - Get My KRS (Enrolled Courses)
router.get(
  '/my-krs',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getMyKRS
);

// GET /api/courses/study-results - Get Study Results (Hasil Studi)
router.get(
  '/study-results',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getStudyResults
);

// ========== ADMIN ROUTES ==========

// GET /api/courses/admin/all - Get All Courses (Admin Only)
router.get(
  '/admin/all',
  authenticateToken,
  authorizeRole('ADMIN'),
  adminGetAllCourses
);

// POST /api/courses/admin - Create Course (Admin Only)
router.post(
  '/admin',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(createCourseSchema),
  adminCreateCourse
);

// PUT /api/courses/admin/:id - Update Course (Admin Only)
router.put(
  '/admin/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(updateCourseSchema),
  adminUpdateCourse
);

// DELETE /api/courses/admin/:id - Delete Course (Admin Only)
router.delete(
  '/admin/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  adminDeleteCourse
);

// PATCH /api/courses/admin/:id/assign-teacher - Assign Teacher (Admin Only)
router.patch(
  '/admin/:id/assign-teacher',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(assignTeacherSchema),
  adminAssignTeacher
);

// ========== PARAMETERIZED ROUTES (/:id) ==========

// 3. GET /api/courses/:id/students - Get Students in a Course (Dosen Only)
router.get(
  '/:id/students',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getStudentsByCourse
);

// 4. GET /api/courses/:id/available-students - Get Available Students for Enrollment
router.get(
  '/:id/available-students',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getAvailableStudents
);

// 5. Protected Route - Create Course (Hanya Dosen & Admin)
router.post(
  '/',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(createCourseSchema),
  createCourse
);

// POST /api/courses/:id/enroll - Tambahkan mahasiswa ke course (Dosen/Admin)
router.post(
  '/:id/enroll',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(enrollStudentSchema),
  enrollStudent
);

// POST /api/courses/:id/enroll-self - Self Enroll to Course (Mahasiswa)
router.post(
  '/:id/enroll-self',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  selfEnrollCourse
);

// DELETE /api/courses/:id/unenroll-self - Self Unenroll from Course (Mahasiswa)
router.delete(
  '/:id/unenroll-self',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  selfUnenrollCourse
);

// --- MATERIAL ROUTES ---
router.post(
  '/:courseId/materials',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(createMaterialSchema),
  createMaterial
);

router.get(
  '/:courseId/materials',
  authenticateToken,
  getMaterials
);

// --- ASSIGNMENT ROUTES ---
router.post(
  '/:courseId/assignments',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(createAssignmentSchema),
  create
);

router.get(
  '/:courseId/assignments',
  authenticateToken,
  getAssignments
);

export default router;
