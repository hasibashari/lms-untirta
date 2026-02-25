import api from '../../services/apiService';

// ========== KRS Module Endpoints (/api/krs) ==========

/**
 * [MAHASISWA] Get available classes for KRS enrollment
 * @param {Object} params - { academicSemesterId }
 */
export const getAvailableClasses = (params = {}) => {
  const query = new URLSearchParams();
  if (params.academicSemesterId) query.append('academicSemesterId', params.academicSemesterId);
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
 * @param {Object} payload - { academicSemesterId }
 */
export const submitKRS = (payload) => {
  return api.post('/krs/submit', payload);
};

/**
 * [MAHASISWA] Revise a rejected KRS enrollment (REJECTED → DRAFT)
 * @param {string} enrollmentId - UUID of the KRS enrollment
 */
export const reviseEnrollment = (enrollmentId) => {
  return api.patch(`/krs/${enrollmentId}/revise`);
};

/**
 * [ALL] Get approval history for a KRS enrollment
 * @param {string} enrollmentId - UUID of the KRS enrollment
 */
export const getApprovalHistory = (enrollmentId) => {
  return api.get(`/krs/${enrollmentId}/history`);
};

// ========== Dospem Advisory Endpoints ==========

/**
 * [DOSPEM] Get advisory students with KRS status
 * @param {Object} params - { academicSemesterId }
 */
export const getAdvisoryStudents = (params = {}) => {
  const query = new URLSearchParams();
  if (params.academicSemesterId) query.append('academicSemesterId', params.academicSemesterId);
  const qs = query.toString();
  return api.get(`/krs/advisory/students${qs ? `?${qs}` : ''}`);
};

/**
 * [DOSPEM] Get pending KRS from advised students
 * @param {Object} params - { academicSemesterId }
 */
export const getAdvisoryPendingKRS = (params = {}) => {
  const query = new URLSearchParams();
  if (params.academicSemesterId) query.append('academicSemesterId', params.academicSemesterId);
  const qs = query.toString();
  return api.get(`/krs/advisory/pending${qs ? `?${qs}` : ''}`);
};

/**
 * [DOSPEM] Approve or reject a KRS enrollment
 * @param {string} enrollmentId - UUID of the KRS enrollment
 * @param {Object} payload - { status: 'APPROVED'|'REJECTED', note? }
 */
export const updateEnrollmentStatus = (enrollmentId, payload) => {
  return api.patch(`/krs/${enrollmentId}/status`, payload);
};

/**
 * [DOSPEM] Bulk approve or reject KRS enrollments
 * @param {Object} payload - { enrollmentIds: string[], status: 'APPROVED'|'REJECTED', note? }
 */
export const bulkUpdateEnrollmentStatus = (payload) => {
  return api.patch('/krs/advisory/bulk-status', payload);
};

// ========== Admin Monitoring Endpoints ==========

/**
 * [ADMIN] Get KRS monitoring data
 * @param {Object} params - { academicSemesterId }
 */
export const getKrsMonitoring = (params = {}) => {
  const query = new URLSearchParams();
  if (params.academicSemesterId) query.append('academicSemesterId', params.academicSemesterId);
  const qs = query.toString();
  return api.get(`/krs/monitoring${qs ? `?${qs}` : ''}`);
};

/**
 * [ADMIN] Get pending KRS (monitoring)
 */
export const getPendingKRS = (params = {}) => {
  const query = new URLSearchParams();
  if (params.academicSemesterId) query.append('academicSemesterId', params.academicSemesterId);
  const qs = query.toString();
  return api.get(`/krs/pending${qs ? `?${qs}` : ''}`);
};
