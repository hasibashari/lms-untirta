// utils/errorHandler.js — Centralized controller error handler
//
// Replaces the duplicated try/catch + error.message.includes() pattern
// in every controller. Services now throw AppError with the right status
// code, so this handler simply forwards it.

import { sendError } from './response.js';
import logger from '../config/logger.js';

/**
 * Handle errors thrown by service functions.
 * - AppError (has statusCode) → forward status, message, code, details
 * - Unknown errors → log + return 500
 *
 * Usage in controllers:
 *   catch (error) { return handleError(res, error); }
 *
 * @param {import('express').Response} res
 * @param {Error} error
 */
export const handleError = (res, error) => {
  // Known application error (AppError or any error with statusCode)
  if (error.statusCode) {
    return sendError(res, {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code || undefined,
      details: error.details || undefined,
    });
  }

  // Unexpected / programmer error — log full stack trace
  logger.error({ err: error }, 'Unhandled error in controller');
  return sendError(res, {
    statusCode: 500,
    message: 'Terjadi kesalahan pada server',
  });
};
