import api from '../../services/apiService';

// ========== KRS Module Endpoints (/api/krs) ==========

/**
 * [MAHASISWA] Get available classes for KRS enrollment
 * @param {Object} params - { academicYear, semesterType }
 */
export const getAvailableClasses = (params = {}) => {
  const query = new URLSearchParams();
  if (params.academicYear) query.append('academicYear', params.academicYear);
  if (params.semesterType) query.append('semesterType', params.semesterType);
  const qs = query.toString();
  return api.get(`/krs/available${qs ? `?${qs}` : ''}`);
};

/**
 * [MAHASISWA] Get my KRS plan (enrolled class offerings)
 */
export const getMyKRS = () => {
  return api.get('/krs/my-plan');
};

/**
 * [MAHASISWA] Enroll in a class offering
 * @param {string} classId - UUID of the class offering
 */
export const enrollClass = (classId) => {
  return api.post('/krs/enroll', { classId });
};

/**
 * [MAHASISWA] Drop a class from KRS
 * @param {string} classId - UUID of the class offering
 */
export const dropClass = (classId) => {
  return api.delete(`/krs/drop/${classId}`);
};

/**
 * [MAHASISWA] Submit KRS for approval
 * @param {Object} payload - { academicYear, semesterType }
 */
export const submitKRS = (payload) => {
  return api.post('/krs/submit', payload);
};

/**
 * [DOSEN, ADMIN] Get pending KRS submissions
 */
export const getPendingKRS = () => {
  return api.get('/krs/pending');
};

/**
 * [DOSEN, ADMIN] Approve or reject a KRS enrollment
 * @param {string} enrollmentId - UUID of the KRS enrollment
 * @param {Object} payload - { status: 'APPROVED'|'REJECTED', note? }
 */
export const updateEnrollmentStatus = (enrollmentId, payload) => {
  return api.patch(`/krs/${enrollmentId}/status`, payload);
};

// ========== Legacy Endpoints (/api/courses) ==========
// Kept for backward compatibility with existing pages.
// These will be removed once all pages migrate to the new KRS endpoints above.

/** @deprecated Use getAvailableClasses instead */
export const getAvailableCourses = (semester) => {
  const params = semester ? `?semester=${semester}` : '';
  return api.get(`/courses/available${params}`);
};

/** @deprecated Use getMyKRS instead */
export const getMyKRSLegacy = () => {
  return api.get('/courses/my-krs');
};

/** @deprecated Use enrollClass instead */
export const enrollCourse = (courseId) => {
  return api.post(`/courses/${courseId}/enroll-self`);
};

/** @deprecated Use dropClass instead */
export const unenrollCourse = (courseId) => {
  return api.delete(`/courses/${courseId}/unenroll-self`);
};
