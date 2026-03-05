import api from '../../services/apiService';

// ========== Transcript Module Endpoints (/api/transcript) ==========

/**
 * [MAHASISWA] Get study results (course-based, legacy Enrollment model)
 * @param {number} semester - Optional semester filter
 */
export const getStudyResults = (semester) => {
  const params = semester ? `?semester=${semester}` : '';
  return api.get(`/transcript/study-results${params}`);
};

/**
 * [MAHASISWA] Get transcript by class enrollment (KRS system, includes semester info)
 * @param {string} academicSemesterId - Optional academic semester ID filter
 */
export const getTranscriptByClass = (academicSemesterId) => {
  const params = academicSemesterId ? `?academicSemesterId=${academicSemesterId}` : '';
  return api.get(`/transcript/by-class${params}`);
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
