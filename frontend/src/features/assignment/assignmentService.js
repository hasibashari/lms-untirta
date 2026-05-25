import api from '@/shared/api/apiService';

// ========== Assignment CRUD ==========

export const getAssignments = (classId) => {
  return api.get(`/assignments/class/${classId}`);
};

export const getAssignmentDetail = (assignmentId) => {
  return api.get(`/assignments/${assignmentId}`);
};

export const createAssignment = (classId, payload) => {
  return api.post(`/assignments/class/${classId}`, payload);
};

export const updateAssignment = (assignmentId, payload) => {
  return api.put(`/assignments/${assignmentId}`, payload);
};

export const deleteAssignment = (assignmentId) => {
  return api.delete(`/assignments/${assignmentId}`);
};
