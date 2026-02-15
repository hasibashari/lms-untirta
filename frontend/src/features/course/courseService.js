import api from '../../services/apiService';

// ========== Course - Dosen ==========

export const getMyCourses = async () => {
  return api.get('/courses/me');
};

// Single API call dengan stats (menghindari N+1 query)
export const getMyCoursesWithStats = async () => {
  return api.get('/courses/me?includeStats=true');
};

export const getCourseStudents = async (courseId) => {
  return api.get(`/courses/${courseId}/students`);
};

// ========== Course Management (Admin) ==========

export const getAllCourses = () => {
  return api.get('/courses/admin/all');
};

export const createCourse = (payload) => {
  return api.post('/courses/admin', payload);
};

export const updateCourse = (courseId, payload) => {
  return api.put(`/courses/admin/${courseId}`, payload);
};

export const deleteCourse = (courseId) => {
  return api.delete(`/courses/admin/${courseId}`);
};

export const assignTeacher = (courseId, teacherId) => {
  return api.patch(`/courses/admin/${courseId}/assign-teacher`, { teacherId });
};
