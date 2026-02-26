import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  createSemesterSchema,
  updateSemesterSchema,
  updateStatusSchema,
} from './academic-semester.validation.js';
import {
  getAll,
  getActive,
  getById,
  create,
  update,
  updateStatus,
  getClosingReadiness,
  remove,
  getStudentSemesters,
} from './academic-semester.controller.js';

const router = express.Router();

/**
 * GET /api/academic-semesters
 * Retrieves all academic semesters.
 * Middleware: Auth Token.
 */
router.get('/', authenticateToken, getAll);

/**
 * GET /api/academic-semesters/active
 * Retrieves the currently active academic semester.
 * Middleware: Auth Token.
 */
router.get('/active', authenticateToken, getActive);

/**
 * GET /api/academic-semesters/student-semesters
 * Retrieves semesters relevant to the authenticated student.
 * Middleware: Auth Token, Role: MAHASISWA.
 */
router.get('/student-semesters', authenticateToken, authorizeRole('MAHASISWA'), getStudentSemesters);

/**
 * GET /api/academic-semesters/:id
 * Retrieves details of a specific semester.
 * Middleware: Auth Token.
 */
router.get('/:id', authenticateToken, getById);

/**
 * POST /api/academic-semesters
 * Creates a new academic semester.
 * Middleware: Auth Token, Role: ADMIN, Validation: createSemesterSchema.
 */
router.post('/', authenticateToken, authorizeRole('ADMIN'), validate(createSemesterSchema), create);

/**
 * PUT /api/academic-semesters/:id
 * Updates an existing academic semester.
 * Middleware: Auth Token, Role: ADMIN, Validation: updateSemesterSchema.
 */
router.put('/:id', authenticateToken, authorizeRole('ADMIN'), validate(updateSemesterSchema), update);

/**
 * PATCH /api/academic-semesters/:id/status
 * Updates the status of a semester (e.g., to OPEN or CLOSED).
 * Middleware: Auth Token, Role: ADMIN, Validation: updateStatusSchema.
 */
router.patch('/:id/status', authenticateToken, authorizeRole('ADMIN'), validate(updateStatusSchema), updateStatus);

/**
 * GET /api/academic-semesters/:id/closing-readiness
 * Checks if a semester is ready to be closed.
 * Middleware: Auth Token, Role: ADMIN.
 */
router.get('/:id/closing-readiness', authenticateToken, authorizeRole('ADMIN'), getClosingReadiness);

/**
 * DELETE /api/academic-semesters/:id
 * Deletes a DRAFT semester.
 * Middleware: Auth Token, Role: ADMIN.
 */
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), remove);

export default router;
