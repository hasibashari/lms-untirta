import api from '../../services/apiService';

export const getStudyResults = (semester) => {
  const params = semester ? `?semester=${semester}` : '';
  return api.get(`/courses/study-results${params}`);
};
