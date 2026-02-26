import * as assignmentService from './assignment.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Creates a new assignment for a specific course.
 * Validates that the requester is the teacher of the course before creating.
 * @param {import('express').Request} req - Express request object. Requires `courseId` in params and assignment details in body.
 * @param {import('express').Response} res - Express response object.
 */
const create = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await assignmentService.createAssignment(courseId, req.user.id, req.body);
    sendSuccess(res, { statusCode: 201, message: 'Tugas berhasil dibuat', data: result });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Handles assignment submission by a student.
 * Checks if the submission is late or if it's a duplicate before saving.
 * @param {import('express').Request} req - Express request object. Expects `assignmentId` in params and submission data in body.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves a list of submissions for a specific assignment.
 * Intended for teachers to view student work.
 * @param {import('express').Request} req - Express request object. Expects `assignmentId` in params.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Grades a specific student submission.
 * Updates the grade and feedback fields.
 * @param {import('express').Request} req - Express request object. Expects `submissionId` in params and grade data in body.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves all assignments for a specific course.
 * The result format differs slightly based on whether the user is a Student (includes status) or Teacher.
 * @param {import('express').Request} req - Express request object. Expects `courseId` in params.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves assignment details along with the current user's submission status.
 * Primarily used by students to view a specific task and their progress.
 * @param {import('express').Request} req - Express request object. Expects `assignmentId` in params.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves all grades for the authenticated student across all enrolled courses.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
const getAllMyGrades = async (req, res) => {
  try {
    const result = await assignmentService.getAllMyGrades(req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Daftar nilai berhasil diambil', data: result });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Retrieves dashboard statistics for a student.
 * Includes counts of total assignments, pending tasks, and graded work.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
const getMyDashboardStats = async (req, res) => {
  try {
    const result = await assignmentService.getMyDashboardStats(req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Statistik berhasil diambil', data: result });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Retrieves dashboard statistics for a teacher.
 * Includes counts of students, materials, assignments, and pending grading tasks.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
const getTeacherDashboardStats = async (req, res) => {
  try {
    const result = await assignmentService.getTeacherDashboardStats(req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Statistik dosen berhasil diambil', data: result });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Retrieves the most recent submissions for a teacher's courses.
 * Useful for a notification feed or "Recent Activity" widget.
 * @param {import('express').Request} req - Express request object. Supports optional `limit` query parameter.
 * @param {import('express').Response} res - Express response object.
 */
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
 * Retrieves detailed information about an assignment.
 * Typically used to populate an edit form for teachers.
 * @param {import('express').Request} req - Express request object. Expects `assignmentId` in params.
 * @param {import('express').Response} res - Express response object.
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
 * Updates an existing assignment.
 * Only the creator (teacher) or an admin can perform this action.
 * @param {import('express').Request} req - Express request object. Expects `assignmentId` in params and update data in body.
 * @param {import('express').Response} res - Express response object.
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
 * Deletes an assignment and all associated submissions.
 * This is a destructive action restricted to the assignment creator or admin.
 * @param {import('express').Request} req - Express request object. Expects `assignmentId` in params.
 * @param {import('express').Response} res - Express response object.
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
