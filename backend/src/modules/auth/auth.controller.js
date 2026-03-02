import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';

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
  } catch (error) {
    return handleError(res, error);
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
  } catch (error) {
    return handleError(res, error);
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
  } catch (error) {
    return handleError(res, error);
  }
};