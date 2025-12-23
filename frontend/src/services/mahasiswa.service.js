import api from './api';

export const getMyCourses = () => {
  return api.get('/courses/me');
};

export const getAssignments = courseId => {
  return api.get(`/courses/${courseId}/assignments`);
};

export const getMyAssignmentStatus = assignmentId => {
  return api.get(`/assignments/${assignmentId}/me`);
};

export const submitAssignment = (assignmentId, payload) => {
  return api.post(`/assignments/${assignmentId}/submit`, payload);
};
