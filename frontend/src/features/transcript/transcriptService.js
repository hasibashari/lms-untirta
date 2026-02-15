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
 * [MAHASISWA] Get transcript by class (KrsEnrollment-based)
 * @param {Object} params - { academicYear, semesterType }
 */
export const getTranscriptByClass = (params = {}) => {
  const query = new URLSearchParams();
  if (params.academicYear) query.append('academicYear', params.academicYear);
  if (params.semesterType) query.append('semesterType', params.semesterType);
  const qs = query.toString();
  return api.get(`/transcript/by-class${qs ? `?${qs}` : ''}`);
};

/**
 * [MAHASISWA] Get combined academic summary (legacy + KRS)
 */
export const getAcademicSummary = () => {
  return api.get('/transcript/summary');
};

/**
 * [DOSEN, ADMIN] Get a specific student's transcript
 * @param {string} studentId - UUID of the student
 * @param {number} semester - Optional semester filter
 */
export const getStudentTranscript = (studentId, semester) => {
  const params = semester ? `?semester=${semester}` : '';
  return api.get(`/transcript/student/${studentId}${params}`);
};
