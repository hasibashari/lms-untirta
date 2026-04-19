/**
 * User gRPC Service — Unit Tests
 *
 * Tests gRPC handlers in user.grpc-service.js in isolation.
 * Prisma is fully mocked — no database calls are made.
 *
 * What we test:
 *   ✓ CreateUserByAdmin — success, duplicate email
 *   ✓ GetAllUsers — filtering, mapping
 *   ✓ GetUserById — found, not found
 *   ✓ UpdateDospemStatus — success, not found, wrong role
 *   ✓ AssignAdvisor — success, validation errors
 *   ✓ BulkAssignAdvisor — success, validation errors
 *   ✓ GetAdvisorSummary — mapping
 *   ✓ GetAdvisorStudents — success, not found
 *
 * Mocking Strategy:
 *   jest.unstable_mockModule() replaces ../../config/prisma.js BEFORE
 *   the service module is imported. This is required for ESM mocking.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import grpc from '@grpc/grpc-js';
import { createPrismaMock } from '../helpers/prisma-mock.js';

// ─── Mock Setup ──────────────────────────────────────────────
// Must mock BEFORE importing the service (ESM hoisting constraint)

const prismaMock = createPrismaMock();

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: prismaMock,
}));

// Also mock bcrypt for deterministic & fast tests
jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn(),
  },
}));

// ─── Import AFTER mocking ────────────────────────────────────
const { userService } = await import('../../src/modules/user/user.grpc-service.js');

const invokeGrpc = (method, request = {}) => {
  return new Promise((resolve, reject) => {
    userService[method]({ request }, (error, response) => {
      if (error) return reject(error);
      resolve(response);
    });
  });
};

// ─── Tests ───────────────────────────────────────────────────

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════
  // CreateUserByAdmin
  // ═══════════════════════════════════════════════════════════
  describe('CreateUserByAdmin', () => {
    const input = {
      email: 'dosen@test.com',
      password: 'password123',
      name: 'Dr. Budi',
      role: 'DOSEN',
    };

    it('should create a user successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // no duplicate
      prismaMock.user.create.mockResolvedValue({
        id: 'uuid-1',
        name: input.name,
        email: input.email,
        role: input.role,
        createdAt: new Date(),
      });

      const result = await invokeGrpc('CreateUserByAdmin', input);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: input.email },
      });
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: input.email,
          name: input.name,
          password: 'hashed_password',
          role: input.role,
        },
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        }),
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: 'uuid-1',
          email: input.email,
          role: 'DOSEN',
        })
      );
    });

    it('should throw on duplicate email', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(invokeGrpc('CreateUserByAdmin', input)).rejects.toMatchObject({
        code: grpc.status.ALREADY_EXISTS,
        details: 'Email sudah terdaftar',
      });
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GetAllUsers
  // ═══════════════════════════════════════════════════════════
  describe('GetAllUsers', () => {
    it('should return all users without filter', async () => {
      const mockUsers = [
        {
          id: '1', name: 'User A', email: 'a@test.com', role: 'DOSEN',
          isDospem: true, advisorId: null, advisor: null,
          _count: { advisedStudents: 3 },
        },
      ];
      prismaMock.user.findMany.mockResolvedValue(mockUsers);
      prismaMock.user.count.mockResolvedValue(1);

      const result = await invokeGrpc('GetAllUsers', {});

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { name: 'asc' },
        })
      );
      expect(result.data[0]).toEqual(
        expect.objectContaining({
          id: '1',
          advisedStudentCount: 3,
        })
      );
      expect(result.pagination).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        })
      );
    });

    it('should filter by role', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      await invokeGrpc('GetAllUsers', { role: 'DOSEN' });

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'DOSEN' },
        })
      );
    });

    it('should filter by isDospem', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      await invokeGrpc('GetAllUsers', { isDospem: true });

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isDospem: true },
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GetUserById
  // ═══════════════════════════════════════════════════════════
  describe('GetUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'uuid-1',
        name: 'Test',
        email: 'test@test.com',
        role: 'ADMIN',
        isDospem: false,
        advisorId: null,
        advisor: null,
        _count: { advisedStudents: 0 },
      };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await invokeGrpc('GetUserById', { id: 'uuid-1' });

      expect(result).toEqual(
        expect.objectContaining({
          id: 'uuid-1',
          name: 'Test',
          email: 'test@test.com',
          role: 'ADMIN',
          advisedStudentCount: 0,
        })
      );
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'uuid-1' },
        })
      );
    });

    it('should return NOT_FOUND when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(invokeGrpc('GetUserById', { id: 'nonexistent' })).rejects.toMatchObject({
        code: grpc.status.NOT_FOUND,
        details: 'User tidak ditemukan',
      });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // UpdateDospemStatus
  // ═══════════════════════════════════════════════════════════
  describe('UpdateDospemStatus', () => {
    it('should update dospem status for a DOSEN', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'uuid-1', role: 'DOSEN' });
      prismaMock.user.update.mockResolvedValue({
        id: 'uuid-1', name: 'Dr. B', email: 'b@test.com', role: 'DOSEN', isDospem: true,
      });

      const result = await invokeGrpc('UpdateDospemStatus', { id: 'uuid-1', isDospem: true });

      expect(result.isDospem).toBe(true);
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'uuid-1' },
          data: { isDospem: true },
        })
      );
    });

    it('should throw if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(invokeGrpc('UpdateDospemStatus', { id: 'nonexistent', isDospem: true }))
        .rejects.toMatchObject({ code: grpc.status.NOT_FOUND, details: 'User tidak ditemukan' });
    });

    it('should throw if user is not DOSEN', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'uuid-1', role: 'MAHASISWA' });

      await expect(invokeGrpc('UpdateDospemStatus', { id: 'uuid-1', isDospem: true }))
        .rejects.toMatchObject({
          code: grpc.status.INVALID_ARGUMENT,
          details: 'Hanya dosen yang dapat dijadikan Dosen Pembimbing',
        });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // AssignAdvisor
  // ═══════════════════════════════════════════════════════════
  describe('AssignAdvisor', () => {
    it('should assign advisor to a student', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 'student-1', role: 'MAHASISWA', advisorId: null }) // student
        .mockResolvedValueOnce({ id: 'dosen-1', role: 'DOSEN', isDospem: true }); // advisor

      prismaMock.user.update.mockResolvedValue({
        id: 'student-1', name: 'Andi', email: 'andi@test.com',
        role: 'MAHASISWA', advisorId: 'dosen-1',
        advisor: { id: 'dosen-1', name: 'Dr. Budi', email: 'budi@test.com' },
      });

      const result = await invokeGrpc('AssignAdvisor', { studentId: 'student-1', advisorId: 'dosen-1' });

      expect(result.advisorId).toBe('dosen-1');
    });

    it('should throw if student not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(invokeGrpc('AssignAdvisor', { studentId: 'nonexistent', advisorId: 'dosen-1' }))
        .rejects.toMatchObject({ code: grpc.status.NOT_FOUND, details: 'Mahasiswa tidak ditemukan' });
    });

    it('should throw if user is not MAHASISWA', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'dosen-1', role: 'DOSEN' });

      await expect(invokeGrpc('AssignAdvisor', { studentId: 'dosen-1', advisorId: 'dosen-2' }))
        .rejects.toMatchObject({
          code: grpc.status.INVALID_ARGUMENT,
          details: 'Hanya mahasiswa yang dapat memiliki Dosen Pembimbing',
        });
    });

    it('should throw if advisor is not isDospem', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 'student-1', role: 'MAHASISWA', advisorId: null })
        .mockResolvedValueOnce({ id: 'dosen-1', role: 'DOSEN', isDospem: false });

      await expect(invokeGrpc('AssignAdvisor', { studentId: 'student-1', advisorId: 'dosen-1' }))
        .rejects.toMatchObject({
          code: grpc.status.INVALID_ARGUMENT,
          details: 'Dosen ini belum ditunjuk sebagai Dosen Pembimbing',
        });
    });

    it('should allow unassigning advisor (null)', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'student-1', role: 'MAHASISWA', advisorId: 'dosen-1',
      });
      prismaMock.user.update.mockResolvedValue({
        id: 'student-1', advisorId: null, advisor: null,
      });

      const result = await invokeGrpc('AssignAdvisor', { studentId: 'student-1', advisorId: null });

      expect(result.advisorId).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // BulkAssignAdvisor
  // ═══════════════════════════════════════════════════════════
  describe('BulkAssignAdvisor', () => {
    it('should bulk assign advisor', async () => {
      const studentIds = ['s-1', 's-2'];
      prismaMock.user.findUnique.mockResolvedValue({ id: 'dosen-1', role: 'DOSEN', isDospem: true });
      prismaMock.user.findMany.mockResolvedValue([{ id: 's-1' }, { id: 's-2' }]);
      prismaMock.user.updateMany.mockResolvedValue({ count: 2 });

      const result = await invokeGrpc('BulkAssignAdvisor', { studentIds, advisorId: 'dosen-1' });

      expect(result.updatedCount).toBe(2);
    });

    it('should throw if no students provided', async () => {
      await expect(invokeGrpc('BulkAssignAdvisor', { studentIds: [], advisorId: 'dosen-1' }))
        .rejects.toMatchObject({
          code: grpc.status.INVALID_ARGUMENT,
          details: 'Tidak ada mahasiswa yang dipilih',
        });
    });

    it('should throw if more than 50 students', async () => {
      const ids = Array.from({ length: 51 }, (_, i) => `s-${i}`);

      await expect(invokeGrpc('BulkAssignAdvisor', { studentIds: ids, advisorId: 'dosen-1' }))
        .rejects.toMatchObject({
          code: grpc.status.INVALID_ARGUMENT,
          details: 'Maksimal 50 mahasiswa per batch',
        });
    });

    it('should throw if some students are invalid', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'dosen-1', role: 'DOSEN', isDospem: true });
      prismaMock.user.findMany.mockResolvedValue([{ id: 's-1' }]); // only 1 found, 2 expected

      await expect(invokeGrpc('BulkAssignAdvisor', { studentIds: ['s-1', 's-invalid'], advisorId: 'dosen-1' }))
        .rejects.toMatchObject({
          code: grpc.status.INVALID_ARGUMENT,
          details: 'Beberapa user bukan mahasiswa atau tidak ditemukan',
        });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GetAdvisorSummary
  // ═══════════════════════════════════════════════════════════
  describe('GetAdvisorSummary', () => {
    it('should return mapped advisor list', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: '1', name: 'Dr. A', email: 'a@test.com', _count: { advisedStudents: 5 } },
      ]);

      const result = await invokeGrpc('GetAdvisorSummary', {});

      expect(result.data).toEqual([
        expect.objectContaining({
          id: '1',
          name: 'Dr. A',
          email: 'a@test.com',
          advisedStudentCount: 5,
        }),
      ]);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GetAdvisorStudents
  // ═══════════════════════════════════════════════════════════
  describe('GetAdvisorStudents', () => {
    it('should return advisor and student list', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'dosen-1', role: 'DOSEN', isDospem: true, name: 'Dr. A',
      });
      prismaMock.user.findMany.mockResolvedValue([
        { id: 's-1', name: 'Student A', email: 'sa@test.com' },
      ]);

      const result = await invokeGrpc('GetAdvisorStudents', { advisorId: 'dosen-1' });

      expect(result.advisor).toEqual({ id: 'dosen-1', name: 'Dr. A' });
      expect(result.students).toHaveLength(1);
    });

    it('should throw if advisor not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(invokeGrpc('GetAdvisorStudents', { advisorId: 'nonexistent' }))
        .rejects.toMatchObject({ code: grpc.status.NOT_FOUND, details: 'Dosen tidak ditemukan' });
    });

    it('should throw if dosen is not dospem', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'dosen-1', role: 'DOSEN', isDospem: false, name: 'Dr. B',
      });

      await expect(invokeGrpc('GetAdvisorStudents', { advisorId: 'dosen-1' }))
        .rejects.toMatchObject({
          code: grpc.status.INVALID_ARGUMENT,
          details: 'Dosen ini bukan Dosen Pembimbing',
        });
    });
  });
});
