import api from '@/shared/api/apiService';

// ========== Transcript Module Endpoints (/api/transcript) ==========



/**
 * [MAHASISWA] Get my transcript
 */
export const getMyTranscript = () => {
  return api.get(`/transcript/me`);
};

/**
 * [DOSEN, ADMIN] Get a specific student's full transcript
 * @param {string} studentId - UUID of the student
 */
export const getStudentTranscript = (studentId) => {
  return api.get(`/transcript/student/${studentId}`);
};

/**
 * [ADMIN] Get list of all students for transcript browsing
 * @param {Object} params - { search }
 */
export const getStudentList = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  const qs = query.toString();
  return api.get(`/transcript/students${qs ? `?${qs}` : ''}`);
};
