import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  createClassSchema,
  updateClassSchema,
  toggleEnrollmentSchema,
} from './class.validation.js';
import {
  create,
  getAll,
  getById,
  getMyClasses,
  getByCourse,
  getOpen,
  update,
  toggleEnrollment,
  remove,
} from './class.controller.js';

const router = express.Router();

// ========================================================================
// CLASS ROUTES — /api/classes
// Semua route memerlukan autentikasi.
// CRUD oleh Admin. Dosen bisa melihat kelas yang diajarnya.
// Mahasiswa bisa melihat kelas yang buka pendaftaran.
// ========================================================================

// ========== SPECIFIC ROUTES (tanpa parameter, harus di atas /:id) ==========

// GET /api/classes/me — Kelas yang diajar oleh dosen yang login
router.get(
  '/me',
  authenticateToken,
  authorizeRole('DOSEN'),
  getMyClasses
);

// GET /api/classes/open — Kelas yang buka pendaftaran (untuk KRS)
router.get(
  '/open',
  authenticateToken,
  authorizeRole('MAHASISWA', 'ADMIN'),
  getOpen
);

// GET /api/classes/course/:courseId — Kelas offering berdasarkan mata kuliah
router.get(
  '/course/:courseId',
  authenticateToken,
  getByCourse
);

// ========== CRUD ROUTES ==========

// GET /api/classes — Daftar semua kelas offering (Admin & Dosen)
router.get(
  '/',
  authenticateToken,
  authorizeRole('ADMIN', 'DOSEN'),
  getAll
);

// POST /api/classes — Buat kelas offering baru (Admin only)
router.post(
  '/',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(createClassSchema),
  create
);

// ========== PARAMETERIZED ROUTES (/:id) ==========

// GET /api/classes/:id — Detail satu kelas offering
router.get(
  '/:id',
  authenticateToken,
  getById
);

// PUT /api/classes/:id — Update kelas offering (Admin only)
router.put(
  '/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(updateClassSchema),
  update
);

// PATCH /api/classes/:id/enrollment — Buka/tutup pendaftaran (Admin only)
router.patch(
  '/:id/enrollment',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(toggleEnrollmentSchema),
  toggleEnrollment
);

// DELETE /api/classes/:id — Hapus kelas offering (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  remove
);

export default router;
