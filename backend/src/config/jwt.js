import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

/**
 * Generates a signed JWT token for the authenticated user.
 * The token includes the user's payload and is signed with the server's secret key.
 *
 * @param {object} payload - The data to be embedded in the token (e.g., userId, role).
 * @returns {string} The signed JWT string with a 1-hour expiration.
 */

export function signToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
}