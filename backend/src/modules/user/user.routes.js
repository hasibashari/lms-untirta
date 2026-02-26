import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateDospemStatus,
  assignAdvisor,
  bulkAssignAdvisor,
  getAdvisorSummary,
  getAdvisorStudents,
} from './user.controller.js';
import { createUserSchema, updateDospemSchema, assignAdvisorSchema, bulkAssignAdvisorSchema } from './user.validation.js';

const router = express.Router();

// Logic: Hanya Admin yang boleh akses route di file ini
// Kita pasang middleware di level router agar berlaku untuk SEMUA endpoint di bawahnya
router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

/**
 * POST /api/users
 * Creates a new user (Admin/Dosen).
 * Middleware: Auth Token, Role: ADMIN, Validation: createUserSchema.
 */
router.post('/', validate(createUserSchema), createUser);

/**
 * GET /api/users
 * Retrieves a list of all users.
 * Middleware: Auth Token, Role: ADMIN.
 */
router.get('/', getAllUsers);

/**
 * GET /api/users/advisor-summary
 * Retrieves a summary of all academic advisors and their student counts.
 * Middleware: Auth Token, Role: ADMIN.
 */
router.get('/advisor-summary', getAdvisorSummary);

/**
 * GET /api/users/advisors/:dosenId/students
 * Retrieves the list of students assigned to a specific academic advisor.
 * Middleware: Auth Token, Role: ADMIN.
 */
router.get('/advisors/:dosenId/students', getAdvisorStudents);

/**
 * GET /api/users/:id
 * Retrieves detailed information about a specific user by ID.
 * Middleware: Auth Token, Role: ADMIN.
 */
router.get('/:id', getUserById);

/**
 * PATCH /api/users/:id/dospem-status
 * Updates the "Dospem" status for a lecturer.
 * Middleware: Auth Token, Role: ADMIN, Validation: updateDospemSchema.
 */
router.patch('/:id/dospem-status', validate(updateDospemSchema), updateDospemStatus);

/**
 * PATCH /api/users/:id/advisor
 * Assigns an advisor to a student.
 * Middleware: Auth Token, Role: ADMIN, Validation: assignAdvisorSchema.
 */
router.patch('/:id/advisor', validate(assignAdvisorSchema), assignAdvisor);

/**
 * PATCH /api/users/bulk-advisor
 * Bulk assigns an advisor to multiple students.
 * Middleware: Auth Token, Role: ADMIN, Validation: bulkAssignAdvisorSchema.
 */
router.patch('/bulk-advisor', validate(bulkAssignAdvisorSchema), bulkAssignAdvisor);

export default router;
