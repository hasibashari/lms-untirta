import api from './api';

export const getMyCourses = async () => {
  return api.get('/courses/me');
};

export const createCourse = async payload => {
  return api.post('/courses', payload);
};

export const enrollStudent = async (courseId, payload) => {
  return api.post(`/courses/${courseId}/enroll`, payload);
};

export const createMaterial = async (courseId, payload) => {
  return api.post(`/courses/${courseId}/materials`, payload);
}

export const getCourseStudents = async courseId => {
  return api.get(`/courses/${courseId}/students`);
}

export const getMaterials = async courseId => {
  return api.get(`/courses/${courseId}/materials`);
}

export const getMaterialDetail = async materialId => {
  return api.get(`/materials/${materialId}`);
}

export const getAssignments = courseId => {
  return api.get(`/courses/${courseId}/assignments`);
};

export const createAssignment = (courseId, payload) => {
  return api.post(`/courses/${courseId}/assignments`, payload);
};

export const getSubmissions = assignmentId => {
  return api.get(`/assignments/${assignmentId}/submissions`);
};

export const gradeSubmission = (submissionId, payload) => {
  return api.patch(`/assignments/submissions/${submissionId}`, payload);
};

// Dashboard stats untuk dosen
export const getTeacherDashboardStats = () => {
  return api.get('/assignments/teacher-stats');
};

// Recent submissions untuk notifikasi
export const getRecentSubmissions = (limit = 10) => {
  return api.get(`/assignments/recent-submissions?limit=${limit}`);
};
