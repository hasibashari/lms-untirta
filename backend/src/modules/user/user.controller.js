import * as userService from './user.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

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
  } catch (err) {
    if (err.message === 'Email sudah terdaftar') {
      return sendError(res, { statusCode: 409, message: err.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
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
    const users = await userService.getAllUsers(role, isDospemFilter);

    const roleMessages = {
      DOSEN: 'Daftar dosen berhasil diambil',
      MAHASISWA: 'Daftar mahasiswa berhasil diambil',
      ADMIN: 'Daftar admin berhasil diambil',
    };

    const message = role ? roleMessages[role] : 'Daftar seluruh user berhasil diambil';

    sendSuccess(res, { statusCode: 200, message, data: users });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
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
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
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
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('Hanya dosen')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
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
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('Hanya') || error.message.includes('harus') || error.message.includes('belum')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
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
    if (error.message.includes('tidak ditemukan') || error.message.includes('bukan mahasiswa')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    if (error.message.includes('Maksimal') || error.message.includes('Tidak ada')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
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
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
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
    if (error.message.includes('tidak ditemukan') || error.message.includes('bukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};