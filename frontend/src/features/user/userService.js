import api from '../../services/apiService';

// ========== User Management (Admin) ==========

export const createUser = async (payload) => {
  return api.post('/users', payload);
};

export const getUsers = (params = {}) => {
  const query = new URLSearchParams();
  if (params.role) query.append('role', params.role);
  if (params.isDospem !== undefined) query.append('isDospem', params.isDospem);
  const qs = query.toString();
  return api.get(`/users${qs ? `?${qs}` : ''}`);
};

export const getDosen = async () => {
  return api.get('/users?role=DOSEN');
};

export const getMahasiswa = async () => {
  return api.get('/users?role=MAHASISWA');
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

export const getAdvisorStudents = (dosenId) => {
  return api.get(`/users/advisors/${dosenId}/students`);
};
