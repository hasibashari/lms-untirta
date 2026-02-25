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
  getCompletionReadiness,
  getRollbackImpact,
  getAutoApprovalDashboard,
  getAutoApprovalLog,
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
// Auto-approval monitoring (must be before /:id to avoid param capture)
router.get('/auto-approval/stats', authenticateToken, authorizeRole('ADMIN'), getAutoApprovalDashboard);
router.get('/auto-approval/logs/:logId', authenticateToken, authorizeRole('ADMIN'), getAutoApprovalLog);

// Semester by ID (must be after static routes)
router.get('/:id', authenticateToken, getById);

router.post('/', authenticateToken, authorizeRole('ADMIN'), validate(createSemesterSchema), create);
router.put('/:id', authenticateToken, authorizeRole('ADMIN'), validate(updateSemesterSchema), update);
router.patch('/:id/status', authenticateToken, authorizeRole('ADMIN'), validate(updateStatusSchema), updateStatus);
router.get('/:id/completion-readiness', authenticateToken, authorizeRole('ADMIN'), getCompletionReadiness);
router.get('/:id/rollback-impact', authenticateToken, authorizeRole('ADMIN'), getRollbackImpact);
router.patch('/:id/activate', authenticateToken, authorizeRole('ADMIN'), setActive);
router.get('/:id/status-logs', authenticateToken, authorizeRole('ADMIN'), getStatusLogs);
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), remove);

export default router;
