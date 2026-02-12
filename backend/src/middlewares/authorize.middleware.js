import { sendError } from '../utils/response.js';

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
