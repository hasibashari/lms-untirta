import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  inputGradeSchema,
  bulkInputGradeSchema,
  finalizeGradesSchema,
} from './grade.validation.js';
import {
  getClassStudents,
  inputGrade,
  bulkInputGrades,
  finalizeGrades,
  getMyGrades,
} from './grade.controller.js';

const router = express.Router();

// ========== MAHASISWA: View my finalized grades ==========
router.get(
  '/my-grades',
  authenticateToken,
  authorizeRole('MAHASISWA'),
  getMyGrades
);

// ========== DOSEN: Grade management ==========
router.get(
  '/class/:classId',
  authenticateToken,
  authorizeRole('DOSEN'),
  getClassStudents
);

router.post(
  '/class/:classId',
  authenticateToken,
  authorizeRole('DOSEN'),
  validate(inputGradeSchema),
  inputGrade
);

router.post(
  '/class/:classId/bulk',
  authenticateToken,
  authorizeRole('DOSEN'),
  validate(bulkInputGradeSchema),
  bulkInputGrades
);

router.patch(
  '/class/:classId/finalize',
  authenticateToken,
  authorizeRole('DOSEN'),
  finalizeGrades
);

export default router;
