import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  createSemesterSchema,
  updateSemesterSchema,
  updateStatusSchema,
  setActiveSchema,
} from './academic-semester.validation.js';
import {
  getAll,
  getActive,
  getById,
  create,
  update,
  updateStatus,
  getClosingReadiness,
  setActive,
  remove,
  getStatusLogs,
} from './academic-semester.controller.js';

const router = express.Router();

// ========== PUBLIC (authenticated) ==========
// All authenticated users can see semesters (needed for KRS filters, etc.)
router.get('/', authenticateToken, getAll);
router.get('/active', authenticateToken, getActive);

// ========== ADMIN ONLY ==========
// Semester by ID (must be after static routes)
router.get('/:id', authenticateToken, getById);

router.post('/', authenticateToken, authorizeRole('ADMIN'), validate(createSemesterSchema), create);
router.put('/:id', authenticateToken, authorizeRole('ADMIN'), validate(updateSemesterSchema), update);
router.patch('/:id/status', authenticateToken, authorizeRole('ADMIN'), validate(updateStatusSchema), updateStatus);
router.get('/:id/closing-readiness', authenticateToken, authorizeRole('ADMIN'), getClosingReadiness);
router.patch('/:id/activate', authenticateToken, authorizeRole('ADMIN'), setActive);
router.get('/:id/status-logs', authenticateToken, authorizeRole('ADMIN'), getStatusLogs);
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), remove);

export default router;
