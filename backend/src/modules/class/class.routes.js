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

/**
 * GET /api/classes/me
 * Retrieves classes taught by the authenticated lecturer.
 * Middleware: Auth Token, Role: DOSEN.
 */
router.get(
  '/me',
  authenticateToken,
  authorizeRole('DOSEN'),
  getMyClasses
);

/**
 * GET /api/classes/open
 * Retrieves classes that are open for enrollment (for KRS).
 * Middleware: Auth Token, Role: MAHASISWA/ADMIN.
 */
router.get(
  '/open',
  authenticateToken,
  authorizeRole('MAHASISWA', 'ADMIN'),
  getOpen
);

/**
 * GET /api/classes/course/:courseId
 * Retrieves class offerings for a specific course.
 * Middleware: Auth Token.
 */
router.get(
  '/course/:courseId',
  authenticateToken,
  getByCourse
);

// ========== CRUD ROUTES ==========

/**
 * GET /api/classes
 * Retrieves all class offerings.
 * Middleware: Auth Token, Role: ADMIN/DOSEN.
 */
router.get(
  '/',
  authenticateToken,
  authorizeRole('ADMIN', 'DOSEN'),
  getAll
);

/**
 * POST /api/classes
 * Creates a new class offering.
 * Middleware: Auth Token, Role: ADMIN, Validation: createClassSchema.
 */
router.post(
  '/',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(createClassSchema),
  create
);

// ========== PARAMETERIZED ROUTES (/:id) ==========

/**
 * GET /api/classes/:id
 * Retrieves details of a specific class offering.
 * Middleware: Auth Token.
 */
router.get(
  '/:id',
  authenticateToken,
  getById
);

/**
 * PUT /api/classes/:id
 * Updates an existing class offering.
 * Middleware: Auth Token, Role: ADMIN, Validation: updateClassSchema.
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(updateClassSchema),
  update
);

/**
 * PATCH /api/classes/:id/enrollment
 * Toggles the enrollment status of a class.
 * Middleware: Auth Token, Role: ADMIN, Validation: toggleEnrollmentSchema.
 */
router.patch(
  '/:id/enrollment',
  authenticateToken,
  authorizeRole('ADMIN'),
  validate(toggleEnrollmentSchema),
  toggleEnrollment
);

/**
 * DELETE /api/classes/:id
 * Deletes a class offering.
 * Middleware: Auth Token, Role: ADMIN.
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  remove
);

export default router;
