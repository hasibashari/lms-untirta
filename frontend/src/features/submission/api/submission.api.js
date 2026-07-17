import api from '@/shared/api/apiService';

// ========== Submissions (Dosen) ==========

export const getSubmissions = (assignmentId) => {
  return api.get(`/submissions/${assignmentId}/submissions`);
};

export const gradeSubmission = (submissionId, payload) => {
  return api.patch(`/submissions/${submissionId}`, payload);
};

export const getRecentSubmissions = (params = {}) => {
  const query = new URLSearchParams();
  const limit = params.limit || 10;
  query.append('limit', limit);
  if (params.academicSemesterId) {
    query.append('academicSemesterId', params.academicSemesterId);
  }
  const qs = query.toString();
  return api.get(`/submissions/recent-submissions?${qs}`);
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
  return api.get('/submissions/grades/me');
};

export const getMyGradesStats = (params = {}) => {
  const query = new URLSearchParams();
  if (params.academicSemesterId) {
    query.append('academicSemesterId', params.academicSemesterId);
  }
  const qs = query.toString();
  return api.get(`/submissions/grades/stats/me${qs ? `?${qs}` : ''}`);
};

