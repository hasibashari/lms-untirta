import api from '../../services/apiService';

// ========== User Management (Admin) ==========

export const createUser = async (payload) => {
  return api.post('/users', payload);
};

export const getUsers = () => {
  return api.get('/users');
};

export const getDosen = async () => {
  return api.get('/users?role=DOSEN');
};

export const getMahasiswa = async () => {
  return api.get('/users?role=MAHASISWA');
};
