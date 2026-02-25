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

// POST /api/users
// Digunakan Admin untuk membuat Dosen/Admin baru
router.post('/', validate(createUserSchema), createUser);

// GET /api/users
router.get('/', getAllUsers);

// GET /api/users/advisor-summary — Daftar semua Dospem dengan jumlah mahasiswa
router.get('/advisor-summary', getAdvisorSummary);

// GET /api/users/advisors/:dosenId/students — Mahasiswa bimbingan seorang Dospem
router.get('/advisors/:dosenId/students', getAdvisorStudents);

// GET /api/users/:id
// Digunakan Admin untuk melihat detail user berdasarkan ID
router.get('/:id', getUserById);

// PATCH /api/users/:id/dospem-status — Grant/revoke Dospem permission
router.patch('/:id/dospem-status', validate(updateDospemSchema), updateDospemStatus);

// PATCH /api/users/:id/advisor — Assign advisor ke mahasiswa
router.patch('/:id/advisor', validate(assignAdvisorSchema), assignAdvisor);

// PATCH /api/users/bulk-advisor — Bulk assign advisor
router.patch('/bulk-advisor', validate(bulkAssignAdvisorSchema), bulkAssignAdvisor);

export default router;
