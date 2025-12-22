import express from 'express';
import validate from '../middlewares/validate.js';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddlewareJWT.js';
import { createCourseSchema, enrollStudentSchema } from '../validations/courseValidation.js';
import {
  createCourse,
  enrollStudent,
  getCourses,
  getMyCourses,
  getStudentsByCourse,
} from '../controllers/courseController.js';

import { createMaterial, getMaterials } from '../controllers/materialController.js';
import { createMaterialSchema } from '../validations/materialValidation.js';
import { create, getAssignments } from '../controllers/assignmentController.js';
import { createAssignmentSchema } from '../validations/assignmentValidation.js';

// --- Router Setup ---

const router = express.Router();

// --- API Routes ---
// PENTING: Route spesifik (/me) harus di atas route umum (/) untuk menghindari konflik

// 1. Route My Courses (Dynamic based on role) - Harus di atas route GET /
// - MAHASISWA: Return kelas yang diikuti (enrolled courses)
// - DOSEN: Return kelas yang diajar (teaching courses)
// - ADMIN: Return semua kelas
router.get('/me', authenticateToken, getMyCourses);

// 2. Route Get All Courses (umum)
router.get('/', authenticateToken, getCourses);

// 3. GET /api/courses/:id/students - Get Students in a Course (Dosen Only)
router.get(
  '/:id/students',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  getStudentsByCourse
);

// 4. Protected Route - Create Course (Hanya Dosen & Admin)
router.post(
  '/',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(createCourseSchema), // Validasi input body
  createCourse
);

// POST /api/courses/:id/enroll
// Artinya: Tambahkan mahasiswa ke course dengan ID tertentu
router.post(
  '/:id/enroll',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'), // Hanya Dosen & Admin yg boleh nambahin murid
  validate(enrollStudentSchema), // Cek format email
  enrollStudent
);

// --- MATERIAL ROUTES ---
// 1. Create Material (Dosen Only)
// URL: POST /api/courses/:courseId/materials

router.post(
  '/:courseId/materials',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(createMaterialSchema),
  createMaterial
);

// 2. Get Materials (Mahasiswa Enrolled & Dosen)
// URL: GET /api/courses/:courseId/materials
router.get(
  '/:courseId/materials',
  authenticateToken,
  getMaterials // Middleware auth sudah handle di dalam service
);

// --- ASSIGNMENT ROUTES ---
// 1. Create Assignment (Dosen Only)
// URL: POST /api/courses/:courseId/assignments
router.post(
  '/:courseId/assignments',
  authenticateToken,
  authorizeRole('DOSEN', 'ADMIN'),
  validate(createAssignmentSchema),
  create
);

// 2. Get Assignments (Mahasiswa Enrolled & Dosen)
// URL: GET /api/courses/:courseId/assignments
router.get(
  '/:courseId/assignments',
  authenticateToken,
  getAssignments // Middleware auth sudah handle di dalam service
);

export default router;
