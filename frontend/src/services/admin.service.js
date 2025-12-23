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
