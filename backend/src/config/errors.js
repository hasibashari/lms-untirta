// config/errors.js — Custom application error class

/**
 * AppError — throw from services with an HTTP status code.
 * The centralized error handler will map these to proper JSON responses.
 *
 * @example
 *   throw new AppError(404, 'Kelas tidak ditemukan');
 *   throw new AppError(400, 'SKS melebihi batas', 'SKS_LIMIT_EXCEEDED', { currentSKS, maxSKS });
 */
export class AppError extends Error {
  /**
   * @param {number}      statusCode - HTTP status code (e.g. 400, 404, 409)
   * @param {string}      message    - Human-readable error message (Indonesian)
   * @param {string|null} [code]     - Machine-readable error code (e.g. 'SKS_LIMIT_EXCEEDED')
   * @param {object|null} [details]  - Extra structured data for the client
   */
  constructor(statusCode, message, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}
