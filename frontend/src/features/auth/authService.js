import api from '../../services/apiService';

export const login = async (payload) => {
  return api.post('/auth/login', payload);
};

export const register = async (payload) => {
  return api.post('/auth/register', payload);
};

export const getMe = async (config = {}) => {
  return api.get('/auth/me', config);
};
