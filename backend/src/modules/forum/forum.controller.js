import * as forumService from './forum.service.js';
import { sendSuccess } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';

const getThreads = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await forumService.getThreads(courseId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: 'Daftar diskusi berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

const getThreadById = async (req, res) => {
  try {
    const { threadId } = req.params;
    const result = await forumService.getThreadById(threadId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: 'Detail diskusi berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

const createThread = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content } = req.body;
    const result = await forumService.createThread(courseId, req.user.id, { title, content });
    sendSuccess(res, { statusCode: 201, message: 'Diskusi berhasil dibuat', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { title, content } = req.body;
    const result = await forumService.updateThread(threadId, req.user.id, req.user.role, { title, content });
    sendSuccess(res, { statusCode: 200, message: 'Diskusi berhasil diperbarui', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const result = await forumService.deleteThread(threadId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: result.message });
  } catch (error) {
    return handleError(res, error);
  }
};

const togglePinThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const result = await forumService.togglePinThread(threadId, req.user.id, req.user.role);
    const msg = result.isPinned ? 'Thread berhasil di-pin' : 'Thread berhasil di-unpin';
    sendSuccess(res, { statusCode: 200, message: msg, data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

const createReply = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content, parentId } = req.body;
    const result = await forumService.createReply(threadId, req.user.id, { content, parentId });
    sendSuccess(res, { statusCode: 201, message: 'Balasan berhasil dikirim', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const { content } = req.body;
    const result = await forumService.updateReply(replyId, req.user.id, req.user.role, { content });
    sendSuccess(res, { statusCode: 200, message: 'Balasan berhasil diperbarui', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const result = await forumService.deleteReply(replyId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: result.message });
  } catch (error) {
    return handleError(res, error);
  }
};

export {
  getThreads,
  getThreadById,
  createThread,
  updateThread,
  deleteThread,
  togglePinThread,
  createReply,
  updateReply,
  deleteReply,
};
