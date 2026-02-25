import api from '../../services/apiService';

// ========== Grade Module (/api/grades) ==========

/**
 * [DOSEN] Get students for grading in a class
 * @param {string} classId - UUID of the class
 */
export const getClassStudentsForGrading = (classId) => {
  return api.get(`/grades/class/${classId}`);
};

/**
 * [DOSEN] Input single final grade
 * @param {string} classId - UUID of the class
 * @param {Object} payload - { studentId, letterGrade, numericScore?, note? }
 */
export const inputGrade = (classId, payload) => {
  return api.post(`/grades/class/${classId}`, payload);
};

/**
 * [DOSEN] Bulk input final grades
 * @param {string} classId - UUID of the class
 * @param {Array} grades - [{ studentId, letterGrade, numericScore?, note? }]
 */
export const bulkInputGrades = (classId, grades) => {
  return api.post(`/grades/class/${classId}/bulk`, { grades });
};

/**
 * [DOSEN] Finalize all draft grades for a class
 * @param {string} classId - UUID of the class
 */
export const finalizeGrades = (classId) => {
  return api.patch(`/grades/class/${classId}/finalize`);
};

/**
 * [MAHASISWA] Get my finalized grades
 * @param {Object} params - { semesterId? }
 */
export const getMyGrades = (params = {}) => {
  const query = new URLSearchParams();
  if (params.semesterId) query.append('semesterId', params.semesterId);
  const qs = query.toString();
  return api.get(`/grades/my-grades${qs ? `?${qs}` : ''}`);
};
