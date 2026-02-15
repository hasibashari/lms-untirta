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

// KRS legacy routes — delegated to krs module controllers
import {
  getAvailableCoursesForKRS,
  selfEnrollCourse,
  selfUnenrollCourse,
  getMyKRSLegacy,
} from '../krs/krs.controller.js';

// Transcript legacy route — delegated to transcript module controller
import { getStudyResults } from '../transcript/transcript.controller.js';

import { createMaterial, getMaterials } from '../material/material.controller.js';
import { createMaterialSchema } from '../material/material.validation.js';
import { create, getAssignments } from '../assignment/assignment.controller.js';
import { createAssignmentSchema } from '../assignment/assignment.validation.js';

// --- Router Setup ---

const router = express.Router();

// --- API Routes ---
// PENTING: Route spesifik harus di atas route dengan parameter (/:id) untuk menghindari konflik

// ========== SPECIFIC ROUTES (tanpa parameter) ==========

// 1. Route My Courses (Dynamic based on role)
router.get('/me', authenticateToken, getMyCourses);

// 2. Route Get All Courses
router.get('/', authenticateToken, getCourses);

// ========== KRS ROUTES (Legacy — delegated to krs module) ==========
// Tetap di-mount di /api/courses/* agar frontend lama tidak rusak.

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
  getMyKRSLegacy
);

// GET /api/courses/study-results - Get Study Results (delegated to transcript)
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
