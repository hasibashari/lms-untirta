import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export function signToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
}