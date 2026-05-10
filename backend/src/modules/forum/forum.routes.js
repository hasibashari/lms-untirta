import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
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
forumRouter.get('/class/:classId', authenticateToken, getThreads);
forumRouter.post('/class/:classId', authenticateToken, validate(createThreadSchema), createThread);

// Thread detail, update, delete, pin
forumRouter.get('/threads/:threadId', authenticateToken, getThreadById);
forumRouter.put('/threads/:threadId', authenticateToken, validate(updateThreadSchema), updateThread);
forumRouter.delete('/threads/:threadId', authenticateToken, deleteThread);
forumRouter.patch('/threads/:threadId/pin', authenticateToken, togglePinThread);

// Reply CRUD
forumRouter.post('/threads/:threadId/replies', authenticateToken, validate(createReplySchema), createReply);
forumRouter.put('/replies/:replyId', authenticateToken, validate(updateReplySchema), updateReply);
forumRouter.delete('/replies/:replyId', authenticateToken, deleteReply);

export { forumRouter };
