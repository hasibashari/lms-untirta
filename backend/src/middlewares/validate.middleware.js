// middlewares/validate.middleware.js
import { sendError } from '../utils/response.js';

/**
 * Middleware to validate request data against a Zod schema.
 * Checks `body`, `query`, and `params` against the provided schema.
 * If validation fails, it returns a 400 Bad Request with detailed error messages.
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against.
 * @returns {import('express').RequestHandler} Express middleware function.
 */
const validate = schema => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    console.error(err);
    const errors = err.errors?.map(e => ({ field: e.path[1], message: e.message })) || [];
    return sendError(res, { statusCode: 400, message: 'Validasi gagal', errors });
  }
};

export default validate;
