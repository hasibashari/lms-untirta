import * as authService from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Handles user registration by processing user data from the request body.
 * This function calls the registration service and sends a corresponding success or error response.
 * @param {import('express').Request} req - The Express request object, containing user details in the body.
 * @param {import('express').Response} res - The Express response object.
 */
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

/**
 * Handles user login by validating credentials from the request body.
 * On successful authentication, it returns a JWT and user data.
 * @param {import('express').Request} req - The Express request object, containing login credentials in the body.
 * @param {import('express').Response} res - The Express response object.
 */
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

/**
 * Fetches the profile of the currently authenticated user.
 * It relies on the user ID attached to the request by an authentication middleware.
 * @param {import('express').Request} req - The Express request object, expected to have `req.user.id`.
 * @param {import('express').Response} res - The Express response object.
 */
export const getMe = async (req, res) => {
  try {
    const userData = await authService.getUserById(req.user.id);
    sendSuccess(res, { statusCode: 200, message: 'Berhasil mengambil data user', data: userData });
  } catch (err) {
    console.error(err);
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};