import * as userService from './user.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';

/**
 * Creates a new user (Admin or Lecturer) in the system.
 * This action is restricted to Administrators.
 * @param {import('express').Request} req - Express request object. Expects user details in body.
 * @param {import('express').Response} res - Express response object.
 */
export const createUser = async (req, res) => {
  try {
    const newUser = await userService.createUserByAdmin(req.body);
    sendSuccess(res, { statusCode: 201, message: 'User berhasil dibuat', data: newUser });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Retrieves a list of all users, with optional filtering.
 * Supports filtering by role and Dospem status.
 * @param {import('express').Request} req - Express request object. Supports query params `role` and `isDospem`.
 * @param {import('express').Response} res - Express response object.
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, isDospem } = req.query;

    if (role && !['DOSEN', 'MAHASISWA', 'ADMIN'].includes(role)) {
      return sendError(res, { statusCode: 400, message: 'Invalid role. Use DOSEN, MAHASISWA, or ADMIN' });
    }

    const isDospemFilter = isDospem === 'true' ? true : isDospem === 'false' ? false : undefined;
    const { data, pagination } = await userService.getAllUsers(role, isDospemFilter, req.query);

    const roleMessages = {
      DOSEN: 'Daftar dosen berhasil diambil',
      MAHASISWA: 'Daftar mahasiswa berhasil diambil',
      ADMIN: 'Daftar admin berhasil diambil',
    };

    const message = role ? roleMessages[role] : 'Daftar seluruh user berhasil diambil';

    sendSuccess(res, { statusCode: 200, message, data, pagination });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Retrieves detailed information about a specific user by ID.
 * @param {import('express').Request} req - Express request object. Expects `id` in params.
 * @param {import('express').Response} res - Express response object.
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return sendError(res, { statusCode: 404, message: 'User tidak ditemukan' });
    }

    sendSuccess(res, { statusCode: 200, message: 'Berhasil mengambil detail user', data: user });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======================== DOSPEM MANAGEMENT ========================

/**
 * Updates the "Dosen Pembimbing" (Academic Advisor) status for a lecturer.
 * Grants or revokes the ability to advise students.
 * @param {import('express').Request} req - Express request object. Expects `id` in params and `isDospem` in body.
 * @param {import('express').Response} res - Express response object.
 */
export const updateDospemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDospem } = req.body;
    const result = await userService.updateDospemStatus(id, isDospem);
    sendSuccess(res, {
      statusCode: 200,
      message: isDospem ? 'Berhasil menetapkan sebagai Dosen Pembimbing' : 'Status Dosen Pembimbing dicabut',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Assigns or unassigns an academic advisor for a specific student.
 * @param {import('express').Request} req - Express request object. Expects `id` (student) in params and `advisorId` in body.
 * @param {import('express').Response} res - Express response object.
 */
export const assignAdvisor = async (req, res) => {
  try {
    const { id } = req.params;
    const { advisorId } = req.body;
    const result = await userService.assignAdvisor(id, advisorId);
    sendSuccess(res, {
      statusCode: 200,
      message: advisorId ? 'Dosen Pembimbing berhasil di-assign' : 'Dosen Pembimbing berhasil di-unassign',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Bulk assigns an academic advisor to multiple students.
 * Useful for batch processing student assignments.
 * @param {import('express').Request} req - Express request object. Expects `studentIds` array and `advisorId` in body.
 * @param {import('express').Response} res - Express response object.
 */
export const bulkAssignAdvisor = async (req, res) => {
  try {
    const { studentIds, advisorId } = req.body;
    const result = await userService.bulkAssignAdvisor(studentIds, advisorId);
    sendSuccess(res, { statusCode: 200, message: result.message, data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Retrieves a summary of all academic advisors and their current student counts.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export const getAdvisorSummary = async (req, res) => {
  try {
    const result = await userService.getAdvisorSummary();
    sendSuccess(res, { statusCode: 200, message: 'Daftar Dosen Pembimbing berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Retrieves the list of students assigned to a specific academic advisor.
 * @param {import('express').Request} req - Express request object. Expects `dosenId` in params.
 * @param {import('express').Response} res - Express response object.
 */
export const getAdvisorStudents = async (req, res) => {
  try {
    const { dosenId } = req.params;
    const result = await userService.getAdvisorStudents(dosenId);
    sendSuccess(res, { statusCode: 200, message: 'Daftar mahasiswa bimbingan berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};