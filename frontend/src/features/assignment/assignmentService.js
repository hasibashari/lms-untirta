import api from '../../services/apiService';

// ========== Assignment CRUD ==========

export const getAssignments = (courseId) => {
  return api.get(`/assignments/course/${courseId}`);
};

export const getAssignmentDetail = (assignmentId) => {
  return api.get(`/assignments/${assignmentId}`);
};

export const createAssignment = (courseId, payload) => {
  return api.post(`/assignments/course/${courseId}`, payload);
};

export const updateAssignment = (assignmentId, payload) => {
  return api.put(`/assignments/${assignmentId}`, payload);
};

export const deleteAssignment = (assignmentId) => {
  return api.delete(`/assignments/${assignmentId}`);
};
