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
 * @param {Object} payload - { academicYear, semesterType, startDate?, endDate? }
 */
export const createSemester = (payload) => {
  return api.post('/academic-semesters', payload);
};

/**
 * [ADMIN] Update academic semester dates
 * @param {Object} payload - { startDate?, endDate? }
 */
export const updateSemester = (id, payload) => {
  return api.put(`/academic-semesters/${id}`, payload);
};

/**
 * [ADMIN] Update semester status
 * @param {string} status - DRAFT | OPEN | CLOSED
 */
export const updateSemesterStatus = (id, status) => {
  return api.patch(`/academic-semesters/${id}/status`, { status });
};

/**
 * [ADMIN] Get closing readiness check for a semester
 * Pre-flight validation before OPEN → CLOSED transition.
 * Returns grade completion stats per class.
 */
export const getClosingReadiness = (id) => {
  return api.get(`/academic-semesters/${id}/closing-readiness`);
};

/**
 * [ADMIN] Delete academic semester
 */
export const deleteSemester = (id) => {
  return api.delete(`/academic-semesters/${id}`);
};

/**
 * [MAHASISWA] Get semesters visible to the student (OPEN + CLOSED with enrollments)
 */
export const getStudentSemesters = () => {
  return api.get('/academic-semesters/student-semesters');
};
