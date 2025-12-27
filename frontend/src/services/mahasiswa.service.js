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

// Nilai terpusat - semua nilai dari semua kelas
export const getAllMyGrades = () => {
  return api.get('/assignments/my-grades');
};

// Dashboard stats - statistik untuk dashboard
export const getMyDashboardStats = () => {
  return api.get('/assignments/my-stats');
};
