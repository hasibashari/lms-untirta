import api from './api';

export const createUser = async payload => {
  return api.post('/users', payload);
};

export const getDosen = async () => {
  return api.get('/users?role=DOSEN');
};

export const getMahasiswa = async () => {
  return api.get('/users?role=MAHASISWA');
};

export const getUsers = () => {
  return api.get('/users');
};

// ========== Course Management (Admin) ==========

// Get all courses with stats
export const getAllCourses = () => {
  return api.get('/courses/admin/all');
};

// Create new course
export const createCourse = (payload) => {
  return api.post('/courses/admin', payload);
};

// Update course
export const updateCourse = (courseId, payload) => {
  return api.put(`/courses/admin/${courseId}`, payload);
};

// Delete course
export const deleteCourse = (courseId) => {
  return api.delete(`/courses/admin/${courseId}`);
};

// Assign teacher to course
export const assignTeacher = (courseId, teacherId) => {
  return api.post(`/courses/admin/${courseId}/assign-teacher`, { teacherId });
};

// Get course students (for admin view)
export const getCourseStudents = (courseId) => {
  return api.get(`/courses/${courseId}/students`);
};


