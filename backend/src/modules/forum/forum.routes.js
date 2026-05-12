import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  getThreads,
  createThread,
  getThreadById,
  updateThread,
  deleteThread,
  togglePinThread,
  createReply,
  updateReply,
  deleteReply,
} from './forum.controller.js';
import {
  updateThreadSchema,
  createReplySchema,
  updateReplySchema,
  createThreadSchema,
} from './forum.validation.js';

// Router untuk thread-level endpoints
// Dipasang di: /api/forum
const forumRouter = express.Router();

// Class-based forum routes
forumRouter.get('/class/:classId', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), getThreads);
forumRouter.post('/class/:classId', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), validate(createThreadSchema), createThread);

// Thread detail, update, delete, pin
forumRouter.get('/threads/:threadId', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), getThreadById);
forumRouter.put('/threads/:threadId', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), validate(updateThreadSchema), updateThread);
forumRouter.delete('/threads/:threadId', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), deleteThread);
forumRouter.patch('/threads/:threadId/pin', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), togglePinThread);

// Reply CRUD
forumRouter.post('/threads/:threadId/replies', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), validate(createReplySchema), createReply);
forumRouter.put('/replies/:replyId', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), validate(updateReplySchema), updateReply);
forumRouter.delete('/replies/:replyId', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), deleteReply);

export { forumRouter };
