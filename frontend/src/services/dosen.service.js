import api from './api';

export const getMyCourses = async () => {
  return api.get('/courses/me');
};

// Optimized: Single API call dengan stats (menghindari N+1 query)
// Endpoint ini mengembalikan courses dengan _count atau stats langsung
export const getMyCoursesWithStats = async () => {
  return api.get('/courses/me?includeStats=true');
};

// NOTE: createCourse dihapus - kelas dibuat oleh Admin
// NOTE: enrollStudent dihapus - mahasiswa mendaftar sendiri melalui KRS
// NOTE: getAvailableStudents dihapus - tidak diperlukan lagi

export const createMaterial = async (courseId, payload) => {
  return api.post(`/courses/${courseId}/materials`, payload);
}

export const getCourseStudents = async courseId => {
  return api.get(`/courses/${courseId}/students`);
}

export const getMaterials = async courseId => {
  return api.get(`/courses/${courseId}/materials`);
}

export const getMaterialDetail = async materialId => {
  return api.get(`/materials/${materialId}`);
}

export const updateMaterial = async (materialId, payload) => {
  return api.put(`/materials/${materialId}`, payload);
}

export const deleteMaterial = async materialId => {
  return api.delete(`/materials/${materialId}`);
}

export const getAssignments = courseId => {
  return api.get(`/courses/${courseId}/assignments`);
};

export const createAssignment = (courseId, payload) => {
  return api.post(`/courses/${courseId}/assignments`, payload);
};

export const getAssignmentDetail = assignmentId => {
  return api.get(`/assignments/${assignmentId}`);
};

export const updateAssignment = (assignmentId, payload) => {
  return api.put(`/assignments/${assignmentId}`, payload);
};

export const deleteAssignment = assignmentId => {
  return api.delete(`/assignments/${assignmentId}`);
};

export const getSubmissions = assignmentId => {
  return api.get(`/assignments/${assignmentId}/submissions`);
};

export const gradeSubmission = (submissionId, payload) => {
  return api.patch(`/assignments/submissions/${submissionId}`, payload);
};

// Dashboard stats untuk dosen
export const getTeacherDashboardStats = () => {
  return api.get('/assignments/teacher-stats');
};

// Recent submissions untuk notifikasi
export const getRecentSubmissions = (limit = 10) => {
  return api.get(`/assignments/recent-submissions?limit=${limit}`);
};
