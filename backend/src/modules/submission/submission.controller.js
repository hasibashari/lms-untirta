import * as submissionService from './submission.service.js';
import { sendSuccess } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';
import { AppError } from '../../config/errors.js';
import { persistUploadMeta, cleanupFile } from '../../services/upload.service.js';
import logger from '../../config/logger.js';

const buildFileUrl = (req, filename) =>
  `${req.protocol}://${req.get('host')}/uploads/${filename}`;

// ======= SUBMIT ASSIGNMENT =======
const submit = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { note, fileUrl: bodyFileUrl } = req.body;

    let fileUrl;
    if (req.file) {
      await persistUploadMeta({ userId: req.user.id, file: req.file }).catch((err) =>
        logger.warn({ err }, 'Failed to persist upload metadata to Redis — continuing'),
      );
      fileUrl = buildFileUrl(req, req.file.filename);
    } else if (bodyFileUrl) {
      fileUrl = bodyFileUrl;
    } else {
      throw new AppError(400, 'File tugas atau URL wajib diberikan');
    }

    const result = await submissionService.submitAssignment(assignmentId, req.user.id, {
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
    const result = await submissionService.getSubmissionsByAssignment(assignmentId, req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Daftar pengumpulan berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GRADE SUBMISSION =======
const grade = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const result = await submissionService.gradeSubmission(submissionId, req.user.id, req.body);
    sendSuccess(res, { statusCode: 200, message: 'Nilai berhasil disimpan', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GET MY ASSIGNMENT =======
const getMyAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const result = await submissionService.getAssignmentWithMySubmission(assignmentId, req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Status tugas berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GET ALL MY GRADES =======
const getAllMyGrades = async (req, res) => {
  try {
    const result = await submissionService.getAllMyGrades(req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Daftar nilai berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GET MY DASHBOARD STATS =======
const getMyDashboardStats = async (req, res) => {
  try {
    const result = await submissionService.getMyDashboardStats(req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Statistik berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GET TEACHER DASHBOARD STATS =======
const getTeacherDashboardStats = async (req, res) => {
  try {
    const result = await submissionService.getTeacherDashboardStats(req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Statistik dosen berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GET RECENT SUBMISSIONS =======
const getRecentSubmissions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await submissionService.getRecentSubmissionsForTeacher(req.user.id, limit);
    sendSuccess(res, { statusCode: 200, message: 'Submissions terbaru berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

export {
  submit,
  getSubmissions,
  grade,
  getMyAssignment,
  getAllMyGrades,
  getMyDashboardStats,
  getTeacherDashboardStats,
  getRecentSubmissions,
};
