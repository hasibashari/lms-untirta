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

// ========== PUBLIC (authenticated) ==========
router.get('/', authenticateToken, getAll);
router.get('/active', authenticateToken, getActive);

// ========== MAHASISWA ==========
router.get('/student-semesters', authenticateToken, authorizeRole('MAHASISWA'), getStudentSemesters);

// ========== ADMIN ONLY ==========
router.get('/:id', authenticateToken, getById);
router.post('/', authenticateToken, authorizeRole('ADMIN'), validate(createSemesterSchema), create);
router.put('/:id', authenticateToken, authorizeRole('ADMIN'), validate(updateSemesterSchema), update);
router.patch('/:id/status', authenticateToken, authorizeRole('ADMIN'), validate(updateStatusSchema), updateStatus);
router.get('/:id/closing-readiness', authenticateToken, authorizeRole('ADMIN'), getClosingReadiness);
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), remove);

export default router;
