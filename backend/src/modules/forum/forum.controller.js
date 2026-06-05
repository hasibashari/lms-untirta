import * as forumService from './forum.service.js';
import { sendSuccess } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';

export const getThreads = async (req, res) => {
  try {
    const { classId } = req.params;
    const result = await forumService.getThreads(classId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: 'Daftar diskusi berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getThreadById = async (req, res) => {
  try {
    const { threadId } = req.params;
    const result = await forumService.getThreadById(threadId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: 'Detail diskusi berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

export const createThread = async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, content } = req.body;
    const result = await forumService.createThread(classId, req.user.id, req.user.role, { title, content });
    sendSuccess(res, { statusCode: 201, message: 'Diskusi berhasil dibuat', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { title, content } = req.body;
    const result = await forumService.updateThread(threadId, req.user.id, req.user.role, { title, content });
    sendSuccess(res, { statusCode: 200, message: 'Diskusi berhasil diperbarui', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const result = await forumService.deleteThread(threadId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: result.message });
  } catch (error) {
    return handleError(res, error);
  }
};

export const togglePinThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const result = await forumService.togglePinThread(threadId, req.user.id, req.user.role);
    const msg = result.isPinned ? 'Thread berhasil di-pin' : 'Thread berhasil di-unpin';
    sendSuccess(res, { statusCode: 200, message: msg, data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

export const createReply = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content, parentId } = req.body;
    const result = await forumService.createReply(threadId, req.user.id, { content, parentId });
    sendSuccess(res, { statusCode: 201, message: 'Balasan berhasil dikirim', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const { content } = req.body;
    const result = await forumService.updateReply(replyId, req.user.id, req.user.role, { content });
    sendSuccess(res, { statusCode: 200, message: 'Balasan berhasil diperbarui', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const result = await forumService.deleteReply(replyId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: result.message });
  } catch (error) {
    return handleError(res, error);
  }
};


