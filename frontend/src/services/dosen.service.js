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

export const getCourseStudents = async courseId => { 
  return api.get(`/courses/${courseId}/students`);
}

export const getMaterials = async courseId => { 
  return api.get(`/courses/${courseId}/materials`);
}

export const getMaterialDetail = async materialId => { 
  return api.get(`/materials/${materialId}`);
}