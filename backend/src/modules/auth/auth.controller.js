import * as authService from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// Register controller
export const register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);
    sendSuccess(res, { statusCode: 201, message: 'Registrasi berhasil', data: result });
  } catch (err) {
    console.error(err);
    if (err.message === 'Email sudah terdaftar') {
      return sendError(res, { statusCode: 409, message: err.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// Login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    sendSuccess(res, { statusCode: 200, message: 'Login berhasil', data: result });
  } catch (err) {
    console.error(err);
    if (err.message === 'Email atau password salah') {
      return sendError(res, { statusCode: 401, message: err.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// getMe Controller
export const getMe = async (req, res) => {
  try {
    const userData = await authService.getUserById(req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Berhasil mengambil data user', data: userData });
  } catch (err) {
    console.error(err);
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};