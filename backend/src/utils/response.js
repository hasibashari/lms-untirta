// utils/response.js — Centralized response handler

/**
 * Send a standardized success response.
 *
 * @param {import('express').Response} res
 * @param {object}  options
 * @param {number}  [options.statusCode=200] - HTTP status code
 * @param {string}  options.message          - Human-readable message
 * @param {*}       [options.data=null]      - Response payload
 */
export const sendSuccess = (res, { statusCode = 200, message, data = null, _meta }) => {
  const body = { success: true, message };
  if (data !== null && data !== undefined) {
    body.data = data;
  }
  if (_meta) {
    body._meta = _meta;
  }
  return res.status(statusCode).json(body);
};

/**
 * Send a standardized error response.
 *
 * @param {import('express').Response} res
 * @param {object}   options
 * @param {number}   [options.statusCode=500] - HTTP status code
 * @param {string}   options.message          - Human-readable error message
 * @param {Array}    [options.errors]         - Detailed field-level errors (validation)
 */
export const sendError = (res, { statusCode = 500, message, errors }) => {
  const body = { success: false, message };
  if (errors) {
    body.errors = errors;
  }
  return res.status(statusCode).json(body);
};
