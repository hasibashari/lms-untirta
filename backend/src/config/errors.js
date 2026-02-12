// config/errors.js — Custom application error class

/**
 * AppError — throw from services/controllers with an HTTP status code.
 * The global error handler or controller catch block will use sendError().
 */
export class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 404, 409)
   * @param {string} message    - Human-readable error message
   */
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
