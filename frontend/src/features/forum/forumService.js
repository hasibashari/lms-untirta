import api from '../../services/apiService';

// ========== Thread CRUD ==========

export const getThreads = async (courseId) => {
  return api.get(`/courses/${courseId}/forum`);
};

export const getThread = async (threadId) => {
  return api.get(`/forum/threads/${threadId}`);
};

export const createThread = async (courseId, data) => {
  return api.post(`/courses/${courseId}/forum`, data);
};

export const updateThread = async (threadId, data) => {
  return api.put(`/forum/threads/${threadId}`, data);
};

export const deleteThread = async (threadId) => {
  return api.delete(`/forum/threads/${threadId}`);
};

export const togglePin = async (threadId) => {
  return api.patch(`/forum/threads/${threadId}/pin`);
};

// ========== Reply CRUD ==========

export const createReply = async (threadId, data) => {
  return api.post(`/forum/threads/${threadId}/replies`, data);
};

export const updateReply = async (replyId, data) => {
  return api.put(`/forum/replies/${replyId}`, data);
};

export const deleteReply = async (replyId) => {
  return api.delete(`/forum/replies/${replyId}`);
};
