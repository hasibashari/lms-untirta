/**
 * User gRPC Service — Unit Tests
 *
 * Tests the gRPC handlers in user.grpc-service.js using mocked Prisma.
 * Verifies user management, advisor assignment, and administrative statistics.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import grpc from '@grpc/grpc-js';
import { createPrismaMock } from '../helpers/prisma-mock.js';

// ─── 1. MOCK SETUP ────────────────────────────────────────────────────

const prismaMock = createPrismaMock();

// Mock dependencies BEFORE importing the service
jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: prismaMock,
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn(),
  },
}));

// Import service after mocking
const { userService } = await import('../../src/modules/user/user.grpc-service.js');

// ─── 2. TEST HELPERS ──────────────────────────────────────────────────

const invokeGrpc = (method, request = {}) => {
  return new Promise((resolve, reject) => {
    userService[method]({ request }, (error, response) => {
      if (error) return reject(error);
      resolve(response);
    });
  });
};

const USER_ID = 'user-uuid-1';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const getBaseUser = () => ({
  id: USER_ID,
  name: 'Test User',
  email: 'test@example.com',
  role: 'MAHASISWA',
  isDospem: false,
  advisorId: null,
  createdAt: NOW,
  updatedAt: NOW,
  _count: { advisedStudents: 0 }
});

// ─── 3. TEST SUITE ────────────────────────────────────────────────────

describe('UserService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('CreateUserByAdmin', () => {
    const request = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
      role: 'DOSEN'
    };

    it('Success — should create new user', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.user.create.mockResolvedValueOnce({
        ...getBaseUser(),
        ...request,
        id: 'new-id'
      });

      const result = await invokeGrpc('CreateUserByAdmin', request);
      expect(result.id).toBe('new-id');
      expect(result.email).toBe(request.email);
    });

    it('409 — should return error if email exists', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(getBaseUser());
      await expect(invokeGrpc('CreateUserByAdmin', request))
        .rejects.toMatchObject({ code: grpc.status.ALREADY_EXISTS });
    });
  });

  describe('GetAllUsers', () => {
    it('Success — should return paginated users', async () => {
      prismaMock.user.findMany.mockResolvedValueOnce([getBaseUser()]);
      prismaMock.user.count.mockResolvedValueOnce(1);

      const result = await invokeGrpc('GetAllUsers', { skip: 0, take: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('Success — should filter by role', async () => {
      prismaMock.user.findMany.mockResolvedValueOnce([]);
      prismaMock.user.count.mockResolvedValueOnce(0);

      await invokeGrpc('GetAllUsers', { role: 'DOSEN' });
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: 'DOSEN' } })
      );
    });
  });

  describe('GetUserById', () => {
    it('Success — should return user', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(getBaseUser());
      const result = await invokeGrpc('GetUserById', { id: USER_ID });
      expect(result.id).toBe(USER_ID);
    });

    it('404 — should fail if not found', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      await expect(invokeGrpc('GetUserById', { id: 'wrong' }))
        .rejects.toMatchObject({ code: grpc.status.NOT_FOUND });
    });
  });

  describe('UpdateUser', () => {
    it('Success — should update name and email', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(getBaseUser()); // Found
      prismaMock.user.findUnique.mockResolvedValueOnce(null); // Email check
      prismaMock.user.update.mockResolvedValueOnce({ ...getBaseUser(), name: 'Updated' });

      const result = await invokeGrpc('UpdateUser', { id: USER_ID, name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('409 — should fail if new email is taken', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(getBaseUser());
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'other' });

      await expect(invokeGrpc('UpdateUser', { id: USER_ID, email: 'taken@example.com' }))
        .rejects.toMatchObject({ code: grpc.status.ALREADY_EXISTS });
    });
  });

  describe('DeleteUser', () => {
    it('Success — should delete user', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(getBaseUser());
      prismaMock.user.delete.mockResolvedValueOnce(getBaseUser());

      const result = await invokeGrpc('DeleteUser', { id: USER_ID });
      expect(result.id).toBe(USER_ID);
    });
  });

  describe('UpdateDospemStatus', () => {
    it('Success — should update status for DOSEN', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ ...getBaseUser(), role: 'DOSEN' });
      prismaMock.user.update.mockResolvedValueOnce({ ...getBaseUser(), isDospem: true });

      const result = await invokeGrpc('UpdateDospemStatus', { id: USER_ID, isDospem: true });
      expect(result.isDospem).toBe(true);
    });

    it('400 — should fail if role is not DOSEN', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ ...getBaseUser(), role: 'MAHASISWA' });
      await expect(invokeGrpc('UpdateDospemStatus', { id: USER_ID, isDospem: true }))
        .rejects.toMatchObject({ code: grpc.status.INVALID_ARGUMENT });
    });
  });

  describe('AssignAdvisor', () => {
    it('Success — should assign advisor', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ ...getBaseUser(), role: 'MAHASISWA' }); // Student
      prismaMock.user.findUnique.mockResolvedValueOnce({ ...getBaseUser(), role: 'DOSEN', isDospem: true }); // Advisor
      prismaMock.user.update.mockResolvedValueOnce({ ...getBaseUser(), advisorId: 'advisor-id' });

      const result = await invokeGrpc('AssignAdvisor', { studentId: USER_ID, advisorId: 'advisor-id' });
      expect(result.advisorId).toBe('advisor-id');
    });

    it('400 — should fail if advisor is not Dospem', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ ...getBaseUser(), role: 'MAHASISWA' });
      prismaMock.user.findUnique.mockResolvedValueOnce({ ...getBaseUser(), role: 'DOSEN', isDospem: false });

      await expect(invokeGrpc('AssignAdvisor', { studentId: USER_ID, advisorId: 'advisor-id' }))
        .rejects.toMatchObject({ code: grpc.status.INVALID_ARGUMENT, details: /belum ditunjuk/ });
    });
  });

  describe('BulkAssignAdvisor', () => {
    it('Success — should bulk assign', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ ...getBaseUser(), role: 'DOSEN', isDospem: true }); // Advisor
      prismaMock.user.findMany.mockResolvedValueOnce([{ id: 's1' }, { id: 's2' }]); // Valid students
      prismaMock.user.updateMany.mockResolvedValueOnce({ count: 2 });

      const result = await invokeGrpc('BulkAssignAdvisor', { studentIds: ['s1', 's2'], advisorId: 'advisor-id' });
      expect(result.updatedCount).toBe(2);
    });
  });

  describe('GetAdvisorSummary', () => {
    it('Success — should return summary', async () => {
      prismaMock.user.findMany.mockResolvedValueOnce([
        { ...getBaseUser(), role: 'DOSEN', isDospem: true, _count: { advisedStudents: 5 }, advisedStudents: [] }
      ]);

      const result = await invokeGrpc('GetAdvisorSummary');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].advisedStudentCount).toBe(5);
    });
  });

  describe('GetAdminStats', () => {
    it('Success — should return counts', async () => {
      prismaMock.user.count.mockResolvedValue(10);
      prismaMock.course.count.mockResolvedValue(5);
      
      const result = await invokeGrpc('GetAdminStats');
      expect(result.totalUsers).toBe(10);
      expect(result.totalCourses).toBe(5);
      expect(result.totalDosen).toBe(10);
      expect(result.totalMahasiswa).toBe(10);
    });
  });
});
