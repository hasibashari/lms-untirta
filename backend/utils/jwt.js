import jwt from 'jsonwebtoken';

const generateToken = payload => {
  // Payload biasanya berisi ID dan Role
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Token berlaku 1 jam
};

export { generateToken };
