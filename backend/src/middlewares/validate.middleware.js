// middlewares/validate.middleware.js
import { sendError } from '../utils/response.js';

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
