import * as assignmentService from './assignment.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const create = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await assignmentService.createAssignment(courseId, req.user.id, req.body);
    sendSuccess(res, { statusCode: 201, message: 'Tugas berhasil dibuat', data: result });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

const submit = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const result = await assignmentService.submitAssignment(assignmentId, req.user.id, req.body);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Tugas berhasil dikumpulkan',
      data: { ...result, status: 'Submitted' },
    });
  } catch (error) {
    if (error.message.includes('habis')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    if (error.message.includes('sudah mengumpulkan')) {
      return sendError(res, { statusCode: 409, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

const getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const result = await assignmentService.getSubmissionsByAssignment(assignmentId, req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Daftar pengumpulan berhasil diambil', data: result });
  } catch (error) {
    if (error.message.includes('Akses ditolak')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

const grade = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const result = await assignmentService.gradeSubmission(submissionId, req.user.id, req.body);
    sendSuccess(res, { statusCode: 200, message: 'Nilai berhasil disimpan', data: result });
  } catch (error) {
    if (error.message.includes('Akses ditolak')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// Get Assignments by Course (Mahasiswa & Dosen)
const getAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await assignmentService.getAssignmentsByCourse(courseId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: 'Daftar tugas berhasil diambil', data: result });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('belum terdaftar')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// Get Assignment Detail with My Submission (Mahasiswa)
const getMyAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const result = await assignmentService.getAssignmentWithMySubmission(assignmentId, req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Status tugas berhasil diambil', data: result });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('belum terdaftar')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// Get All My Grades (Mahasiswa)
const getAllMyGrades = async (req, res) => {
  try {
    const result = await assignmentService.getAllMyGrades(req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Daftar nilai berhasil diambil', data: result });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// Get Dashboard Stats (Mahasiswa)
const getMyDashboardStats = async (req, res) => {
  try {
    const result = await assignmentService.getMyDashboardStats(req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Statistik berhasil diambil', data: result });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// Get Dashboard Stats (Dosen)
const getTeacherDashboardStats = async (req, res) => {
  try {
    const result = await assignmentService.getTeacherDashboardStats(req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Statistik dosen berhasil diambil', data: result });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// Get Recent Submissions (Dosen)
const getRecentSubmissions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await assignmentService.getRecentSubmissionsForTeacher(req.user.id, limit);
    sendSuccess(res, { statusCode: 200, message: 'Submissions terbaru berhasil diambil', data: result });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Get Assignment Detail - Untuk edit form
 */
const getAssignmentDetail = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const result = await assignmentService.getAssignmentDetail(assignmentId);

    if (!result) {
      return sendError(res, { statusCode: 404, message: 'Tugas tidak ditemukan' });
    }

    sendSuccess(res, { statusCode: 200, message: 'Detail tugas berhasil diambil', data: result });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Update Assignment
 */
const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { title, description, dueDate } = req.body;

    const result = await assignmentService.updateAssignment(
      assignmentId,
      req.user.id,
      req.user.role,
      { title, description, dueDate }
    );

    sendSuccess(res, { statusCode: 200, message: 'Tugas berhasil diperbarui', data: result });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('Akses ditolak')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Delete Assignment
 */
const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const result = await assignmentService.deleteAssignment(
      assignmentId,
      req.user.id,
      req.user.role
    );

    sendSuccess(res, { statusCode: 200, message: result.message, data: result });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('Akses ditolak')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

export {
  create,
  submit,
  getSubmissions,
  grade,
  getAssignments,
  getMyAssignment,
  getAllMyGrades,
  getMyDashboardStats,
  getTeacherDashboardStats,
  getRecentSubmissions,
  getAssignmentDetail,
  updateAssignment,
  deleteAssignment,
};
