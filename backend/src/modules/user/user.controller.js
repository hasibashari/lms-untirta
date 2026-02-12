import * as userService from './user.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// Controller untuk membuat user baru oleh Admin
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

export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;

    if (role && !['DOSEN', 'MAHASISWA', 'ADMIN'].includes(role)) {
      return sendError(res, { statusCode: 400, message: 'Invalid role. Use DOSEN, MAHASISWA, or ADMIN' });
    }

    const users = await userService.getAllUsers(role);

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