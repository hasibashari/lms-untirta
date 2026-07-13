import api from '@/shared/api/apiService';

// ========== User Management (Admin) ==========

export const createUser = async (payload) => {
  return api.post('/users', payload);
};

export const getUserById = (userId) => {
  return api.get(`/users/${userId}`);
};

export const updateUser = (userId, payload) => {
  return api.put(`/users/${userId}`, payload);
};

export const updateProfile = (payload) => {
  return api.put('/users/profile', payload);
};

export const deleteUser = (userId) => {
  return api.delete(`/users/${userId}`);
};

export const getUsers = (params = {}) => {
  const query = new URLSearchParams();
  if (params.role) query.append('role', params.role);
  if (params.isDospem !== undefined) query.append('isDospem', params.isDospem);
  if (params.limit) query.append('limit', params.limit);
  if (params.page) query.append('page', params.page);
  const qs = query.toString();
  return api.get(`/users${qs ? `?${qs}` : ''}`);
};

export const getDosen = async () => {
  return api.get('/users?role=DOSEN');
};



// ========== Dospem Management (Admin) ==========

export const updateDospemStatus = (userId, isDospem) => {
  return api.patch(`/users/${userId}/dospem-status`, { isDospem });
};

export const assignAdvisor = (studentId, advisorId) => {
  return api.patch(`/users/${studentId}/advisor`, { advisorId });
};

export const bulkAssignAdvisor = (studentIds, advisorId) => {
  return api.patch('/users/bulk-advisor', { studentIds, advisorId });
};

export const getAdvisorSummary = () => {
  return api.get('/users/advisor-summary');
};



// ========== Admin Dashboard Stats ==========

export const getAdminStats = () => {
  return api.get('/users/stats');
};
