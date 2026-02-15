import api from '../../services/apiService';

// ========== Assignment CRUD ==========

export const getAssignments = (courseId) => {
  return api.get(`/courses/${courseId}/assignments`);
};

export const getAssignmentDetail = (assignmentId) => {
  return api.get(`/assignments/${assignmentId}`);
};

export const createAssignment = (courseId, payload) => {
  return api.post(`/courses/${courseId}/assignments`, payload);
};

export const updateAssignment = (assignmentId, payload) => {
  return api.put(`/assignments/${assignmentId}`, payload);
};

export const deleteAssignment = (assignmentId) => {
  return api.delete(`/assignments/${assignmentId}`);
};

// ========== Submissions (Dosen) ==========

export const getSubmissions = (assignmentId) => {
  return api.get(`/assignments/${assignmentId}/submissions`);
};

export const gradeSubmission = (submissionId, payload) => {
  return api.patch(`/assignments/submissions/${submissionId}`, payload);
};

export const getRecentSubmissions = (limit = 10) => {
  return api.get(`/assignments/recent-submissions?limit=${limit}`);
};

// ========== Submissions (Mahasiswa) ==========

export const getMyAssignmentStatus = (assignmentId) => {
  return api.get(`/assignments/${assignmentId}/me`);
};

export const submitAssignment = (assignmentId, payload) => {
  return api.post(`/assignments/${assignmentId}/submit`, payload);
};

// ========== Grades (Mahasiswa) ==========

export const getAllMyGrades = () => {
  return api.get('/assignments/my-grades');
};

// ========== Dashboard Stats ==========

export const getTeacherDashboardStats = () => {
  return api.get('/assignments/teacher-stats');
};

export const getMyDashboardStats = () => {
  return api.get('/assignments/my-stats');
};
