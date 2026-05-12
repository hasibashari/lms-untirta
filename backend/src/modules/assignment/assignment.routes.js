import express from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
} from './assignment.validation.js';
import {
  create,
  getAssignments,
  getAssignmentDetail,
  updateAssignment,
  deleteAssignment,
} from './assignment.controller.js';

const router = express.Router();

router.post(
  '/class/:classId',
  authenticateToken,
  authorizeRole('DOSEN'),
  validate(createAssignmentSchema),
  create,
);

router.get('/class/:classId', authenticateToken, getAssignments);

router.get(
  '/:assignmentId',
  authenticateToken,
  authorizeRole('DOSEN', 'MAHASISWA'),
  getAssignmentDetail,
);

router.put(
  '/:assignmentId',
  authenticateToken,
  authorizeRole('DOSEN'),
  validate(updateAssignmentSchema),
  updateAssignment,
);

router.delete(
  '/:assignmentId',
  authenticateToken,
  authorizeRole('DOSEN'),
  deleteAssignment,
);

export default router;
