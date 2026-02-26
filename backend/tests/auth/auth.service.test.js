/**
 * Auth Service — Unit Tests
 *
 * Tests auth.service.js in isolation with mocked Prisma, bcrypt, and jwt.
 *
 * What we test:
 *   ✓ registerUser — success, duplicate email
 *   ✓ loginUser — success, wrong email, wrong password
 *   ✓ getUserById — found, not found
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismaMock } from '../helpers/prisma-mock.js';

// ─── Mock Setup ──────────────────────────────────────────────

const prismaMock = createPrismaMock();

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: prismaMock,
}));

const mockBcrypt = {
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
};
jest.unstable_mockModule('bcryptjs', () => ({
  default: mockBcrypt,
}));

const mockSignToken = jest.fn().mockReturnValue('mock-jwt-token');
jest.unstable_mockModule('../../src/config/jwt.js', () => ({
  signToken: mockSignToken,
}));

jest.unstable_mockModule('../../src/config/roles.js', () => ({
  ROLES: { MAHASISWA: 'MAHASISWA', DOSEN: 'DOSEN', ADMIN: 'ADMIN' },
}));

// ─── Import AFTER mocking ────────────────────────────────────
const { registerUser, loginUser, getUserById } =
  await import('../../src/modules/auth/auth.service.js');

// ─── Tests ───────────────────────────────────────────────────

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════
  // registerUser
  // ═══════════════════════════════════════════════════════════
  describe('registerUser', () => {
    const input = { email: 'new@test.com', name: 'New User', password: 'password123' };

    it('should register a new user successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'uuid-1',
        email: input.email,
        name: input.name,
        role: 'MAHASISWA',
      });

      const result = await registerUser(input);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: input.email },
      });
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: input.email,
          name: input.name,
          password: 'hashed_password',
          role: 'MAHASISWA',
        }),
      });
      expect(result).toEqual({
        id: 'uuid-1',
        email: input.email,
        name: input.name,
        role: 'MAHASISWA',
      });
    });

    it('should throw if email is already registered', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(registerUser(input)).rejects.toThrow('Email sudah terdaftar');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // loginUser
  // ═══════════════════════════════════════════════════════════
  describe('loginUser', () => {
    const input = { email: 'user@test.com', password: 'password123' };

    it('should login successfully with correct credentials', async () => {
      const dbUser = {
        id: 'uuid-1', email: input.email, name: 'Test User',
        password: 'hashed_password', role: 'MAHASISWA', isDospem: false,
      };
      prismaMock.user.findUnique.mockResolvedValue(dbUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await loginUser(input);

      expect(result).toEqual({
        token: 'mock-jwt-token',
        user: {
          id: 'uuid-1',
          name: 'Test User',
          email: input.email,
          role: 'MAHASISWA',
          isDospem: false,
        },
      });
      expect(mockSignToken).toHaveBeenCalledWith({
        userId: 'uuid-1',
        role: 'MAHASISWA',
      });
    });

    it('should throw if email not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(loginUser(input)).rejects.toThrow('Email atau password salah');
    });

    it('should throw if password is incorrect', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'uuid-1', email: input.email, password: 'hashed', role: 'MAHASISWA',
      });
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(loginUser(input)).rejects.toThrow('Email atau password salah');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getUserById
  // ═══════════════════════════════════════════════════════════
  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'uuid-1', name: 'Test', email: 'test@test.com',
        nim: null, role: 'MAHASISWA', isDospem: false,
        advisorId: null, advisor: null,
      };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await getUserById('uuid-1');

      expect(result).toEqual(mockUser);
    });

    it('should throw if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(getUserById('nonexistent')).rejects.toThrow('User tidak ditemukan');
    });
  });
});
