/**
 * Auth Helpers for Integration Tests
 *
 * Provides utilities for creating authenticated users and generating
 * JWT tokens for API test requests.
 *
 * Usage:
 *   import { createAuthenticatedUser, generateToken } from '../helpers/auth.js';
 *
 *   const { user, token } = await createAuthenticatedUser({ role: 'ADMIN' });
 *   const res = await request(app)
 *     .get('/api/users')
 *     .set('Authorization', `Bearer ${token}`);
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';

/**
 * Generates a JWT token for a given user.
 * @param {{ id: string, role: string }} user
 * @returns {string} JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Creates a real user in the test DB and returns the user + token.
 * @param {object} [overrides] - Override default user fields.
 * @param {string} [overrides.email]
 * @param {string} [overrides.name]
 * @param {string} [overrides.password]
 * @param {string} [overrides.role] - 'ADMIN' | 'DOSEN' | 'MAHASISWA'
 * @param {string} [overrides.nim]
 * @param {boolean} [overrides.isDospem]
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function createAuthenticatedUser(overrides = {}) {
  const defaults = {
    email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    name: 'Test User',
    password: 'password123',
    role: 'MAHASISWA',
  };

  const data = { ...defaults, ...overrides };
  const hashedPassword = await bcrypt.hash(data.password, 4); // Low rounds for speed

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role,
      nim: data.nim || null,
      isDospem: data.isDospem || false,
    },
  });

  const token = generateToken(user);

  return { user, token, plainPassword: data.password };
}

/**
 * Creates an admin user and returns credentials.
 * Shorthand for createAuthenticatedUser({ role: 'ADMIN' }).
 */
export async function createAdmin(overrides = {}) {
  return createAuthenticatedUser({ role: 'ADMIN', name: 'Admin User', ...overrides });
}

/**
 * Creates a dosen user and returns credentials.
 */
export async function createDosen(overrides = {}) {
  return createAuthenticatedUser({ role: 'DOSEN', name: 'Dosen User', ...overrides });
}

/**
 * Creates a mahasiswa user and returns credentials.
 */
export async function createMahasiswa(overrides = {}) {
  return createAuthenticatedUser({ role: 'MAHASISWA', name: 'Mahasiswa User', ...overrides });
}
