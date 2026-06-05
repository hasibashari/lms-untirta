import * as assignmentService from './assignment.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';

// ======= CREATE ASSIGNMENT =======
export const create = async (req, res) => {
  try {
    const { classId } = req.params;
    const result = await assignmentService.createAssignment(classId, req.user.id, req.body);
    sendSuccess(res, { statusCode: 201, message: 'Tugas berhasil dibuat', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GET ASSIGNMENTS BY CLASS =======
export const getAssignments = async (req, res) => {
  try {
    const { classId } = req.params;
    const result = await assignmentService.getAssignmentsByClass(classId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: 'Daftar tugas berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GET ASSIGNMENT DETAIL =======
export const getAssignmentDetail = async (req, res) => {
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
export const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { title, description, dueDate } = req.body;

    const result = await assignmentService.updateAssignment(
      assignmentId,
      req.user.id,
      req.user.role,
      { title, description, dueDate },
    );

    sendSuccess(res, { statusCode: 200, message: 'Tugas berhasil diperbarui', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= DELETE ASSIGNMENT =======
export const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const result = await assignmentService.deleteAssignment(
      assignmentId,
      req.user.id,
      req.user.role,
    );

    sendSuccess(res, { statusCode: 200, message: result.message, data: result });
  } catch (error) {
    return handleError(res, error);
  }
};


