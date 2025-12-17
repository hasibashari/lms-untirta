import express from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddlewareJWT.js';
import validate from '../middlewares/validate.js';
import { createCourseSchema, enrollStudentSchema } from '../validations/courseValidation.js';
import {
  createCourse,
  enrollStudent,
  getCourses,
  getMyCourses,
} from '../controllers/courseController.js';

import { createMaterial, getMaterials } from '../services/materialService.js';
import { createMaterialSchema } from '../validations/materialValidation.js';

const router = express.Router();

// --- API Routes ---
// PENTING: Route spesifik (/me) harus di atas route umum (/) untuk menghindari konflik

// 1. Route Dashboard Mahasiswa (Spesifik) - Harus di atas route GET /
router.get('/me', authenticateToken, authorizeRoles('MAHASISWA'), getMyCourses);

// 2. Route Get All Courses (umum)
router.get('/', authenticateToken, getCourses);

// 3. Protected Route - Create Course (Hanya Dosen & Admin)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('DOSEN', 'ADMIN'),
  validate(createCourseSchema), // Validasi input body
  createCourse
);

// POST /api/courses/:id/enroll
// Artinya: Tambahkan mahasiswa ke course dengan ID tertentu
router.post(
  '/:id/enroll',
  authenticateToken,
  authorizeRoles('DOSEN', 'ADMIN'), // Hanya Dosen & Admin yg boleh nambahin murid
  validate(enrollStudentSchema), // Cek format email
  enrollStudent
);

export default router;
