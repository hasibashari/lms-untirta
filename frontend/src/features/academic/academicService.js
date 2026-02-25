import api from '../../services/apiService';

// ========== Academic Semester Module (/api/academic-semesters) ==========

/**
 * [ALL] Get all academic semesters
 */
export const getAllSemesters = () => {
  return api.get('/academic-semesters');
};

/**
 * [ALL] Get the active semester
 */
export const getActiveSemester = () => {
  return api.get('/academic-semesters/active');
};

/**
 * [ALL] Get semester by ID
 */
export const getSemesterById = (id) => {
  return api.get(`/academic-semesters/${id}`);
};

/**
 * [ADMIN] Create a new academic semester
 * @param {Object} payload - { academicYear, semesterType, enrollmentStart?, enrollmentEnd?, startDate?, endDate?, gradingDeadline? }
 */
export const createSemester = (payload) => {
  return api.post('/academic-semesters', payload);
};

/**
 * [ADMIN] Update academic semester dates
 * @param {Object} payload - { enrollmentStart?, enrollmentEnd?, startDate?, endDate?, gradingDeadline? }
 */
export const updateSemester = (id, payload) => {
  return api.put(`/academic-semesters/${id}`, payload);
};

/**
 * [ADMIN] Update semester status
 * @param {string} status - PLANNING | ENROLLMENT | ONGOING | GRADING | COMPLETED
 * @param {string|null} reason - Reason for the transition (required for rollbacks)
 */
export const updateSemesterStatus = (id, status, reason = null) => {
  return api.patch(`/academic-semesters/${id}/status`, { status, reason });
};

/**
 * [ADMIN] Get status transition audit logs for a semester
 */
export const getSemesterStatusLogs = (id) => {
  return api.get(`/academic-semesters/${id}/status-logs`);
};

/**
 * [ADMIN] Set semester as active
 */
export const setActiveSemester = (id) => {
  return api.patch(`/academic-semesters/${id}/activate`);
};

/**
 * [ADMIN] Delete academic semester
 */
export const deleteSemester = (id) => {
  return api.delete(`/academic-semesters/${id}`);
};
