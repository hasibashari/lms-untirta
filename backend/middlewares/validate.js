// middlewares/validate.js
const validate = schema => (req, res, next) => {
  try {
    // Validasi req.body, req.query, atau req.params
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next(); // Lanjut ke middleware atau controller berikutnya
  } catch (err) {
    console.error(err);
    // Tangkap error Zod dan format jadi JSON cantik
    return res.status(400).json({
      message: 'Validasi gagal',
      errors: err.errors?.map(e => ({ field: e.path[1], message: e.message })) || [],
    });
  }
};

export default validate;
