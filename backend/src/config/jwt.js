import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// Membuat JWT token dengan payload: { userId, role } dan expires dalam 1 hari
export function signToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: '1d' });
}