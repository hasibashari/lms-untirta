/**
 * Academic gRPC Service — Unit Tests
 *
 * Tests the gRPC handlers in academic.grpc-service.js using mocked Prisma.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import grpc from '@grpc/grpc-js';
import { createPrismaMock } from '../helpers/prisma-mock.js';

// ─── 1. MOCK DEFINITIONS ──────────────────────────────────────────────

const prismaMock = createPrismaMock();

// Mock Prisma module
jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: prismaMock,
}));

// Import service after mocking prisma
const { academicService } = await import('../../src/modules/academic/academic.grpc-service.js');

// ─── 2. TEST HELPERS ──────────────────────────────────────────────────

const invokeGrpc = (method, request = {}) => {
  return new Promise((resolve, reject) => {
    academicService[method]({ request }, (error, response) => {
      if (error) return reject(error);
      resolve(response);
    });
  });
};

const SEMESTER_ID = 'sem-uuid-1';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const getBaseSemester = () => ({
  id: SEMESTER_ID,
  academicYear: '2025/2026',
  semesterType: 'GANJIL',
  status: 'DRAFT',
  isActive: false,
  maxSks: 24,
  startDate: NOW,
  endDate: NOW,
  createdAt: NOW,
  updatedAt: NOW,
  _count: { classes: 0, finalGrades: 0 }
});

// ─── 3. TEST SUITE ────────────────────────────────────────────────────

describe('Academic gRPC Service Unit Tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    
    prismaMock.$transaction.mockImplementation(async (cb) => {
      if (typeof cb === 'function') return await cb(prismaMock);
      return Array.isArray(cb) ? Promise.all(cb) : cb;
    });
  });

  describe('GetAllSemesters', () => {
    it('Success — should return formatted list', async () => {
      prismaMock.academicSemester.findMany.mockResolvedValueOnce([getBaseSemester()]);
      const result = await invokeGrpc('GetAllSemesters');
      expect(result.semesters).toHaveLength(1);
    });
  });

  describe('GetActiveSemester', () => {
    it('Success — should return active semester', async () => {
      prismaMock.academicSemester.findFirst.mockResolvedValueOnce({ ...getBaseSemester(), isActive: true });
      const result = await invokeGrpc('GetActiveSemester');
      expect(result.semester.isActive).toBe(true);
    });
  });

  describe('CreateSemester', () => {
    const request = { academicYear: '2025/2026', semesterType: 'GENAP', maxSks: 24 };

    it('Success — should create new DRAFT semester', async () => {
      prismaMock.academicSemester.findUnique.mockResolvedValueOnce(null);
      prismaMock.academicSemester.create.mockResolvedValueOnce({ ...getBaseSemester(), ...request, id: 'new-id' });

      const result = await invokeGrpc('CreateSemester', request);
      expect(result.semester.id).toBe('new-id');
    });

    it('409 — should return error if duplicate exists', async () => {
      prismaMock.academicSemester.findUnique.mockResolvedValueOnce(getBaseSemester());
      await expect(invokeGrpc('CreateSemester', request))
        .rejects.toMatchObject({ code: grpc.status.ALREADY_EXISTS });
    });
  });

  describe('UpdateSemester', () => {
    it('Success — should update allowed fields', async () => {
      prismaMock.academicSemester.findUnique.mockResolvedValueOnce(getBaseSemester());
      prismaMock.academicSemester.update.mockResolvedValueOnce({ ...getBaseSemester(), maxSks: 20 });

      const result = await invokeGrpc('UpdateSemester', { id: SEMESTER_ID, maxSks: 20 });
      expect(result.semester.maxSks).toBe(20);
    });
  });

  describe('UpdateStatus', () => {
    it('Success (DRAFT -> OPEN) — should open enrollment and deactivate others', async () => {
      prismaMock.academicSemester.findUnique.mockResolvedValueOnce({ ...getBaseSemester(), status: 'DRAFT' });
      prismaMock.academicSemester.findFirst.mockResolvedValueOnce(null);
      prismaMock.academicSemester.update.mockResolvedValueOnce({ ...getBaseSemester(), status: 'OPEN' });
      prismaMock.class.updateMany.mockResolvedValueOnce({ count: 1 });
      prismaMock.academicSemester.updateMany.mockResolvedValueOnce({ count: 1 });
      prismaMock.academicSemester.update.mockResolvedValueOnce({ ...getBaseSemester(), isActive: true });
      prismaMock.academicSemester.findUnique.mockResolvedValueOnce({ ...getBaseSemester(), status: 'OPEN', isActive: true });

      const result = await invokeGrpc('UpdateStatus', { id: SEMESTER_ID, newStatus: 'OPEN' });
      expect(result.semester.status).toBe('OPEN');
    });

    it('Success (OPEN -> CLOSED) — should close enrollment and finalize grades', async () => {
      prismaMock.academicSemester.findUnique.mockResolvedValueOnce({ ...getBaseSemester(), status: 'OPEN' });
      prismaMock.$queryRaw.mockResolvedValueOnce([{ count: 0 }]); // No missing grades
      prismaMock.academicSemester.update.mockResolvedValueOnce({ ...getBaseSemester(), status: 'CLOSED' });
      prismaMock.class.updateMany.mockResolvedValueOnce({ count: 1 });
      prismaMock.finalGrade.updateMany.mockResolvedValueOnce({ count: 1 });
      prismaMock.academicSemester.update.mockResolvedValueOnce({ ...getBaseSemester(), isActive: false });
      prismaMock.academicSemester.findUnique.mockResolvedValueOnce({ ...getBaseSemester(), status: 'CLOSED', isActive: false });

      const result = await invokeGrpc('UpdateStatus', { id: SEMESTER_ID, newStatus: 'CLOSED' });
      expect(result.semester.status).toBe('CLOSED');
    });

    it('400 (OPEN -> CLOSED) — should fail if students are missing grades', async () => {
      prismaMock.academicSemester.findUnique.mockResolvedValueOnce({ ...getBaseSemester(), status: 'OPEN' });
      
      // checkClosePreconditions calls $queryRaw TWICE if count > 0
      prismaMock.$queryRaw
        .mockResolvedValueOnce([{ count: 5 }]) // missingGradeCount
        .mockResolvedValueOnce([{ count: 50 }]); // totalEnrolled
        
      prismaMock.finalGrade.count.mockResolvedValue(10); // draftGradeCount
      prismaMock.finalGrade.count.mockResolvedValue(40); // finalizedGradeCount

      await expect(invokeGrpc('UpdateStatus', { id: SEMESTER_ID, newStatus: 'CLOSED' }))
        .rejects.toMatchObject({ code: grpc.status.FAILED_PRECONDITION, details: /belum memiliki nilai akhir/ });
    });
  });

  describe('DeleteSemester', () => {
    it('Success — should delete DRAFT semester', async () => {
      prismaMock.academicSemester.findUnique.mockResolvedValueOnce({ ...getBaseSemester(), _count: { classes: 0, finalGrades: 0 } });
      prismaMock.academicSemester.delete.mockResolvedValueOnce(getBaseSemester());
      const result = await invokeGrpc('DeleteSemester', { id: SEMESTER_ID });
      expect(result.message).toBe('Semester berhasil dihapus');
    });
  });

  describe('GetClosingReadiness', () => {
    it('Success — should calculate summary', async () => {
      prismaMock.academicSemester.findUnique.mockResolvedValueOnce(getBaseSemester());
      prismaMock.class.findMany.mockResolvedValueOnce([
        { 
          id: 'c1', section: 'A', 
          course: { code: 'IF1', title: 'Web' }, 
          lecturer: { name: 'Dosen' },
          _count: { krsEnrollments: 10, finalGrades: 8 }
        }
      ]);
      prismaMock.finalGrade.count.mockResolvedValue(4);

      const result = await invokeGrpc('GetClosingReadiness', { id: SEMESTER_ID });
      expect(result.summary.totalClasses).toBe(1);
    });
  });

  describe('GetStudentSemesters', () => {
    it('Success — should return semesters', async () => {
      prismaMock.krsEnrollment.findMany.mockResolvedValueOnce([{ class: { academicSemesterId: 'old' } }]);
      prismaMock.academicSemester.findFirst.mockResolvedValueOnce({ id: 'open' });
      prismaMock.academicSemester.findMany.mockResolvedValueOnce([
        { ...getBaseSemester(), id: 'old', status: 'CLOSED' },
        { ...getBaseSemester(), id: 'open', status: 'OPEN' }
      ]);

      const result = await invokeGrpc('GetStudentSemesters', { studentId: 's1' });
      expect(result.semesters).toHaveLength(2);
    });
  });
});
