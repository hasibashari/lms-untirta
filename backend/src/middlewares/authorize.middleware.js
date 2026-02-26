import { sendError } from '../utils/response.js';

/**
 * Middleware factory to authorize users based on their roles.
 * It checks if the authenticated user's role is included in the list of allowed roles.
 * This middleware must be used after an authentication middleware that attaches the user object to the request.
 *
 * @param {...string} allowedRoles - A list of role strings that are permitted to access the route.
 * @returns {import('express').RequestHandler} An Express middleware function that performs the role check.
 */

export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, { statusCode: 401, message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, { statusCode: 403, message: 'Akses Ditolak: Anda tidak memiliki izin untuk akses ini.' });
    }

    next();
  };
};
