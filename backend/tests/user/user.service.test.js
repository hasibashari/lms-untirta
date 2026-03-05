/**
 * User Service — Unit Tests
 *
 * Tests the business logic in user.service.js in isolation.
 * Prisma is fully mocked — no database calls are made.
 *
 * What we test:
 *   ✓ createUserByAdmin — success, duplicate email
 *   ✓ getAllUsers — filtering, mapping
 *   ✓ getUserById — found, not found
 *   ✓ updateDospemStatus — success, not found, wrong role
 *   ✓ assignAdvisor — success, validation errors
 *   ✓ bulkAssignAdvisor — success, validation errors
 *   ✓ getAdvisorSummary — mapping
 *   ✓ getAdvisorStudents — success, not found
 *
 * Mocking Strategy:
 *   jest.unstable_mockModule() replaces ../../config/prisma.js BEFORE
 *   the service module is imported. This is required for ESM mocking.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
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
const {
  createUserByAdmin,
  getAllUsers,
  getUserById,
  updateDospemStatus,
  assignAdvisor,
  bulkAssignAdvisor,
  getAdvisorSummary,
  getAdvisorStudents,
} = await import('../../src/modules/user/user.service.js');

// ─── Tests ───────────────────────────────────────────────────

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════
  // createUserByAdmin
  // ═══════════════════════════════════════════════════════════
  describe('createUserByAdmin', () => {
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

      const result = await createUserByAdmin(input);

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

      await expect(createUserByAdmin(input)).rejects.toThrow('Email sudah terdaftar');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getAllUsers
  // ═══════════════════════════════════════════════════════════
  describe('getAllUsers', () => {
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

      const result = await getAllUsers(undefined, undefined);

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
    });

    it('should filter by role', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      await getAllUsers('DOSEN', undefined);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'DOSEN' },
        })
      );
    });

    it('should filter by isDospem', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      await getAllUsers(undefined, true);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isDospem: true },
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getUserById
  // ═══════════════════════════════════════════════════════════
  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: 'uuid-1', name: 'Test', email: 'test@test.com', role: 'ADMIN' };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await getUserById('uuid-1');

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'uuid-1' },
        })
      );
    });

    it('should return null when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await getUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // updateDospemStatus
  // ═══════════════════════════════════════════════════════════
  describe('updateDospemStatus', () => {
    it('should update dospem status for a DOSEN', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'uuid-1', role: 'DOSEN' });
      prismaMock.user.update.mockResolvedValue({
        id: 'uuid-1', name: 'Dr. B', email: 'b@test.com', role: 'DOSEN', isDospem: true,
      });

      const result = await updateDospemStatus('uuid-1', true);

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

      await expect(updateDospemStatus('nonexistent', true))
        .rejects.toThrow('User tidak ditemukan');
    });

    it('should throw if user is not DOSEN', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'uuid-1', role: 'MAHASISWA' });

      await expect(updateDospemStatus('uuid-1', true))
        .rejects.toThrow('Hanya dosen yang dapat dijadikan Dosen Pembimbing');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // assignAdvisor
  // ═══════════════════════════════════════════════════════════
  describe('assignAdvisor', () => {
    it('should assign advisor to a student', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 'student-1', role: 'MAHASISWA', advisorId: null }) // student
        .mockResolvedValueOnce({ id: 'dosen-1', role: 'DOSEN', isDospem: true }); // advisor

      prismaMock.user.update.mockResolvedValue({
        id: 'student-1', name: 'Andi', email: 'andi@test.com',
        role: 'MAHASISWA', advisorId: 'dosen-1',
        advisor: { id: 'dosen-1', name: 'Dr. Budi', email: 'budi@test.com' },
      });

      const result = await assignAdvisor('student-1', 'dosen-1');

      expect(result.advisorId).toBe('dosen-1');
    });

    it('should throw if student not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(assignAdvisor('nonexistent', 'dosen-1'))
        .rejects.toThrow('Mahasiswa tidak ditemukan');
    });

    it('should throw if user is not MAHASISWA', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'dosen-1', role: 'DOSEN' });

      await expect(assignAdvisor('dosen-1', 'dosen-2'))
        .rejects.toThrow('Hanya mahasiswa yang dapat memiliki Dosen Pembimbing');
    });

    it('should throw if advisor is not isDospem', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 'student-1', role: 'MAHASISWA', advisorId: null })
        .mockResolvedValueOnce({ id: 'dosen-1', role: 'DOSEN', isDospem: false });

      await expect(assignAdvisor('student-1', 'dosen-1'))
        .rejects.toThrow('Dosen ini belum ditunjuk sebagai Dosen Pembimbing');
    });

    it('should allow unassigning advisor (null)', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'student-1', role: 'MAHASISWA', advisorId: 'dosen-1',
      });
      prismaMock.user.update.mockResolvedValue({
        id: 'student-1', advisorId: null, advisor: null,
      });

      const result = await assignAdvisor('student-1', null);

      expect(result.advisorId).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // bulkAssignAdvisor
  // ═══════════════════════════════════════════════════════════
  describe('bulkAssignAdvisor', () => {
    it('should bulk assign advisor', async () => {
      const studentIds = ['s-1', 's-2'];
      prismaMock.user.findUnique.mockResolvedValue({ id: 'dosen-1', role: 'DOSEN', isDospem: true });
      prismaMock.user.findMany.mockResolvedValue([{ id: 's-1' }, { id: 's-2' }]);
      prismaMock.user.updateMany.mockResolvedValue({ count: 2 });

      const result = await bulkAssignAdvisor(studentIds, 'dosen-1');

      expect(result.updatedCount).toBe(2);
    });

    it('should throw if no students provided', async () => {
      await expect(bulkAssignAdvisor([], 'dosen-1'))
        .rejects.toThrow('Tidak ada mahasiswa yang dipilih');
    });

    it('should throw if more than 50 students', async () => {
      const ids = Array.from({ length: 51 }, (_, i) => `s-${i}`);

      await expect(bulkAssignAdvisor(ids, 'dosen-1'))
        .rejects.toThrow('Maksimal 50 mahasiswa per batch');
    });

    it('should throw if some students are invalid', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'dosen-1', role: 'DOSEN', isDospem: true });
      prismaMock.user.findMany.mockResolvedValue([{ id: 's-1' }]); // only 1 found, 2 expected

      await expect(bulkAssignAdvisor(['s-1', 's-invalid'], 'dosen-1'))
        .rejects.toThrow('Beberapa user bukan mahasiswa atau tidak ditemukan');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getAdvisorSummary
  // ═══════════════════════════════════════════════════════════
  describe('getAdvisorSummary', () => {
    it('should return mapped advisor list', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: '1', name: 'Dr. A', email: 'a@test.com', _count: { advisedStudents: 5 } },
      ]);

      const result = await getAdvisorSummary();

      expect(result).toEqual([
        { id: '1', name: 'Dr. A', email: 'a@test.com', advisedStudentCount: 5 },
      ]);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getAdvisorStudents
  // ═══════════════════════════════════════════════════════════
  describe('getAdvisorStudents', () => {
    it('should return advisor and student list', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'dosen-1', role: 'DOSEN', isDospem: true, name: 'Dr. A',
      });
      prismaMock.user.findMany.mockResolvedValue([
        { id: 's-1', name: 'Student A', email: 'sa@test.com' },
      ]);

      const result = await getAdvisorStudents('dosen-1');

      expect(result.advisor).toEqual({ id: 'dosen-1', name: 'Dr. A' });
      expect(result.students).toHaveLength(1);
    });

    it('should throw if advisor not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(getAdvisorStudents('nonexistent'))
        .rejects.toThrow('Dosen tidak ditemukan');
    });

    it('should throw if dosen is not dospem', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'dosen-1', role: 'DOSEN', isDospem: false, name: 'Dr. B',
      });

      await expect(getAdvisorStudents('dosen-1'))
        .rejects.toThrow('Dosen ini bukan Dosen Pembimbing');
    });
  });
});
