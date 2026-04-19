import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';

// ======= REGISTER =======
export const register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);
    sendSuccess(res, { statusCode: 201, message: 'Registrasi berhasil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= LOGIN =======
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    sendSuccess(res, { statusCode: 200, message: 'Login berhasil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

// ======= GET ME (PROFILE) =======
export const getMe = async (req, res) => {
  try {
    const userData = await authService.getUserById(req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Berhasil mengambil data user', data: userData });
  } catch (error) {
    return handleError(res, error);
  }
};