import api from '../../services/apiService';

// ========== Submissions (Dosen) ==========

export const getSubmissions = (assignmentId) => {
  return api.get(`/submissions/${assignmentId}/submissions`);
};

export const gradeSubmission = (submissionId, payload) => {
  return api.patch(`/submissions/${submissionId}`, payload);
};

export const getRecentSubmissions = (limit = 10) => {
  return api.get(`/submissions/recent-submissions?limit=${limit}`);
};

// ========== Submissions (Mahasiswa) ==========

export const getMyAssignmentStatus = (assignmentId) => {
  return api.get(`/submissions/${assignmentId}/me`);
};

export const submitAssignment = (assignmentId, payload) => {
  return api.post(`/submissions/${assignmentId}/submit`, payload);
};

// ========== Grades (Mahasiswa) ==========

export const getAllMyGrades = () => {
  return api.get('/submissions/my-grades');
};

// ========== Dashboard Stats ==========

export const getTeacherDashboardStats = () => {
  return api.get('/submissions/teacher-stats');
};

export const getMyDashboardStats = () => {
  return api.get('/submissions/my-stats');
};
