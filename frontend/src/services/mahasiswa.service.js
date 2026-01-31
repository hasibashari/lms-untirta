import api from './api.service';

export const getMyCourses = () => {
  return api.get('/courses/me');
};

export const getAssignments = courseId => {
  return api.get(`/courses/${courseId}/assignments`);
};

// Ambil detail assignment (title, description, dueDate)
export const getAssignmentDetail = assignmentId => {
  return api.get(`/assignments/${assignmentId}`);
};

export const getMyAssignmentStatus = assignmentId => {
  return api.get(`/assignments/${assignmentId}/me`);
};

export const submitAssignment = (assignmentId, payload) => {
  return api.post(`/assignments/${assignmentId}/submit`, payload);
};

// Nilai terpusat - semua nilai dari semua kelas

// Dashboard stats - statistik untuk dashboard
export const getMyDashboardStats = () => {
  return api.get('/assignments/my-stats');
};

// ========== KRS (Kartu Rencana Studi) ==========

// Get available courses for a specific semester (courses not yet enrolled)
export const getAvailableCourses = (semester) => {
  const params = semester ? `?semester=${semester}` : '';
  return api.get(`/courses/available${params}`);
};

// Get my KRS (enrolled courses list)
export const getMyKRS = () => {
  return api.get('/courses/my-krs');
};

// Enroll to a course
export const enrollCourse = (courseId) => {
  return api.post(`/courses/${courseId}/enroll-self`);
};

// Unenroll from a course (Drop KRS)
export const unenrollCourse = (courseId) => {
  return api.delete(`/courses/${courseId}/unenroll-self`);
};

// ========== Hasil Studi ==========

// Get study results (grades per semester)
export const getStudyResults = (semester) => {
  const params = semester ? `?semester=${semester}` : '';
  return api.get(`/courses/study-results${params}`);
};
