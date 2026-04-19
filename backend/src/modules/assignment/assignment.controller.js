import * as assignmentService from './assignment.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';
import { AppError } from '../../config/errors.js';
import { persistUploadMeta, cleanupFile } from '../../services/upload.service.js';
import logger from '../../config/logger.js';

const buildFileUrl = (req, filename) =>
  `${req.protocol}://${req.get('host')}/uploads/${filename}`;

// ======= CREATE ASSIGNMENT =======
const create = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await assignmentService.createAssignment(courseId, req.user.id, req.body);
    sendSuccess(res, { statusCode: 201, message: 'Tugas berhasil dibuat', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= SUBMIT ASSIGNMENT =======
const submit = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { note, fileUrl: bodyFileUrl } = req.body;

    let fileUrl;
    if (req.file) {
      // File upload mode (multipart/form-data)
      await persistUploadMeta({ userId: req.user.id, file: req.file }).catch((err) =>
        logger.warn({ err }, 'Failed to persist upload metadata to Redis — continuing'),
      );
      fileUrl = buildFileUrl(req, req.file.filename);
    } else if (bodyFileUrl) {
      // URL mode (application/json)
      fileUrl = bodyFileUrl;
    } else {
      throw new AppError(400, 'File tugas atau URL wajib diberikan');
    }

    const result = await assignmentService.submitAssignment(assignmentId, req.user.id, {
      fileUrl,
      note,
    });
    sendSuccess(res, {
      statusCode: 200,
      message: 'Tugas berhasil dikumpulkan',
      data: { ...result, status: 'Submitted' },
    });
  } catch (error) {
    if (req.file) cleanupFile(req.file.path).catch(() => { });
    return handleError(res, error);
  }
};

// ======= GET SUBMISSIONS BY ASSIGNMENT =======
const getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const result = await assignmentService.getSubmissionsByAssignment(assignmentId, req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Daftar pengumpulan berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GRADE SUBMISSION =======
const grade = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const result = await assignmentService.gradeSubmission(submissionId, req.user.id, req.body);
    sendSuccess(res, { statusCode: 200, message: 'Nilai berhasil disimpan', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GET ASSIGNMENTS BY COURSE =======
const getAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await assignmentService.getAssignmentsByCourse(courseId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: 'Daftar tugas berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GET MY ASSIGNMENT =======
const getMyAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const result = await assignmentService.getAssignmentWithMySubmission(assignmentId, req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Status tugas berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GET ALL MY GRADES =======
const getAllMyGrades = async (req, res) => {
  try {
    const result = await assignmentService.getAllMyGrades(req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Daftar nilai berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GET MY DASHBOARD STATS =======
const getMyDashboardStats = async (req, res) => {
  try {
    const result = await assignmentService.getMyDashboardStats(req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Statistik berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GET TEACHER DASHBOARD STATS =======
const getTeacherDashboardStats = async (req, res) => {
  try {
    const result = await assignmentService.getTeacherDashboardStats(req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Statistik dosen berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GET RECENT SUBMISSIONS =======
const getRecentSubmissions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await assignmentService.getRecentSubmissionsForTeacher(req.user.id, limit);
    sendSuccess(res, { statusCode: 200, message: 'Submissions terbaru berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GET ASSIGNMENT DETAIL =======
const getAssignmentDetail = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const result = await assignmentService.getAssignmentDetail(assignmentId);

    if (!result) {
      return sendError(res, { statusCode: 404, message: 'Tugas tidak ditemukan' });
    }

    sendSuccess(res, { statusCode: 200, message: 'Detail tugas berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= UPDATE ASSIGNMENT =======
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
    return handleError(res, error);
  }
};

// ======= DELETE ASSIGNMENT =======
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
    return handleError(res, error);
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
