import api from '@/shared/api/apiService';

export const login = async (payload) => {
  return api.post('/auth/login', payload);
};

export const register = async (payload) => {
  return api.post('/auth/register', payload);
};

export const getMe = async (config = {}) => {
  return api.get('/auth/me', config);
};

export const forgotPassword = async (payload) => {
  return api.post('/auth/forgot-password', payload);
};

export const resetPassword = async (payload) => {
  return api.post('/auth/reset-password', payload);
};

export const verifyEmail = async (payload) => {
  return api.post('/auth/verify-email', payload);
};

export const resendVerification = async (payload) => {
  return api.post('/auth/resend-verification', payload);
};

