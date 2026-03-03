import api from '../../services/apiService';

// ========== Class Module Endpoints (/api/classes) ==========
// Full CRUD for class offerings (kelas yang dibuka per semester)

/**
 * [DOSEN] Get my class offerings
 */
export const getMyClasses = async () => {
  return api.get('/classes/me');
};

/**
 * [MAHASISWA, ADMIN] Get open classes available for enrollment
 */
export const getOpenClasses = async () => {
  return api.get('/classes/open');
};

/**
 * [ADMIN, DOSEN] Get all class offerings with optional filters
 * @param {Object} params - { academicSemesterId, courseId }
 */
export const getAllClasses = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.academicSemesterId) query.append('academicSemesterId', params.academicSemesterId);
  if (params.courseId) query.append('courseId', params.courseId);
  const qs = query.toString();
  return api.get(`/classes${qs ? `?${qs}` : ''}`);
};

/**
 * Get class offerings for a specific course
 */
export const getClassesByCourse = async (courseId) => {
  return api.get(`/classes/course/${courseId}`);
};

/**
 * Get a single class offering by ID
 */
export const getClassById = async (classId) => {
  return api.get(`/classes/${classId}`);
};

/**
 * [ADMIN] Create a new class offering
 * @param {Object} payload - { courseId, lecturerId, academicSemesterId, section, schedule?, room?, capacity?, isEnrollmentOpen? }
 */
export const createClass = async (payload) => {
  return api.post('/classes', payload);
};

/**
 * [ADMIN] Update a class offering
 * @param {Object} payload - { lecturerId?, academicSemesterId?, section?, schedule?, room?, capacity?, isEnrollmentOpen? }
 */
export const updateClass = async (classId, payload) => {
  return api.put(`/classes/${classId}`, payload);
};

/**
 * [ADMIN] Toggle enrollment open/close for a class
 * @param {boolean} isEnrollmentOpen
 */
export const toggleClassEnrollment = async (classId, isEnrollmentOpen) => {
  return api.patch(`/classes/${classId}/enrollment`, { isEnrollmentOpen });
};

/**
 * [ADMIN] Delete a class offering
 */
export const deleteClass = async (classId) => {
  return api.delete(`/classes/${classId}`);
};
