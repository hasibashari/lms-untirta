import api from '../../services/apiService';

export const getAvailableCourses = (semester) => {
  const params = semester ? `?semester=${semester}` : '';
  return api.get(`/courses/available${params}`);
};

export const getMyKRS = () => {
  return api.get('/courses/my-krs');
};

export const enrollCourse = (courseId) => {
  return api.post(`/courses/${courseId}/enroll-self`);
};

export const unenrollCourse = (courseId) => {
  return api.delete(`/courses/${courseId}/unenroll-self`);
};
