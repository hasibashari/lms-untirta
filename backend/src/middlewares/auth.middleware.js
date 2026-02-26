import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { sendError } from '../utils/response.js';

/**
 * Middleware to authenticate users via JWT.
 * Verifies the token from the Authorization header, retrieves the user from the database,
 * and attaches the user object to the request (`req.user`).
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next function.
 */

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, { statusCode: 401, message: 'Token tidak ditemukan' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isDospem: true,
        advisorId: true,
      },
    });

    if (!user) {
      return sendError(res, { statusCode: 401, message: 'User tidak ditemukan' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    return sendError(res, { statusCode: 403, message: 'Token tidak valid atau kadaluwarsa.' });
  }
};
