/**
 * Academic gRPC Service — Unit Tests
 *
 * Tests gRPC handlers in academic.grpc-service.js with mocked Prisma.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import grpc from '@grpc/grpc-js';
import { createPrismaMock } from '../helpers/prisma-mock.js';

const prismaMock = createPrismaMock();

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: prismaMock,
}));

const { academicService } = await import('../../src/modules/academic/academic.grpc-service.js');

const SEMESTER_ID = 'sem-uuid-1';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const baseSemester = {
  id: SEMESTER_ID,
  academicYear: '2025/2026',
  semesterType: 'GANJIL',
  status: 'DRAFT',
  isActive: false,
  maxSks: 24,
  startDate: null,
  endDate: null,
  createdAt: NOW,
  updatedAt: NOW,
};

const invokeGrpc = (method, request = {}) => {
  return new Promise((resolve, reject) => {
    academicService[method]({ request }, (error, response) => {
      if (error) return reject(error);
      resolve(response);
    });
  });
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('academic.grpc-service', () => {
  it('GetAllSemesters returns formatted semesters', async () => {
    prismaMock.academicSemester.findMany.mockResolvedValueOnce([baseSemester]);

    const result = await invokeGrpc('GetAllSemesters');

    expect(result.semesters).toHaveLength(1);
    expect(result.semesters[0]).toMatchObject({
      id: SEMESTER_ID,
      academicYear: '2025/2026',
      semesterType: 'GANJIL',
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });
  });

  it('GetSemesterById returns NOT_FOUND when semester does not exist', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(null);

    await expect(invokeGrpc('GetSemesterById', { id: 'missing-id' })).rejects.toMatchObject({
      code: grpc.status.NOT_FOUND,
    });
  });

  it('CreateSemester returns ALREADY_EXISTS when duplicate exists', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(baseSemester);

    await expect(
      invokeGrpc('CreateSemester', {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
      }),
    ).rejects.toMatchObject({
      code: grpc.status.ALREADY_EXISTS,
    });
  });

  it('UpdateSemester updates maxSks for existing semester', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(baseSemester);
    prismaMock.academicSemester.update.mockResolvedValueOnce({
      ...baseSemester,
      maxSks: 20,
    });

    const result = await invokeGrpc('UpdateSemester', {
      id: SEMESTER_ID,
      maxSks: 20,
    });

    expect(result.semester.maxSks).toBe(20);
    expect(prismaMock.academicSemester.update).toHaveBeenCalledWith({
      where: { id: SEMESTER_ID },
      data: expect.objectContaining({ maxSks: 20 }),
    });
  });

  it('UpdateStatus rejects invalid transition DRAFT -> CLOSED', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(baseSemester);

    await expect(
      invokeGrpc('UpdateStatus', {
        id: SEMESTER_ID,
        newStatus: 'CLOSED',
      }),
    ).rejects.toMatchObject({
      code: grpc.status.FAILED_PRECONDITION,
    });
  });

  it('DeleteSemester deletes draft semester with no dependencies', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce({
      ...baseSemester,
      _count: { classes: 0, finalGrades: 0 },
    });
    prismaMock.academicSemester.delete.mockResolvedValueOnce(baseSemester);

    const result = await invokeGrpc('DeleteSemester', { id: SEMESTER_ID });

    expect(result).toMatchObject({
      id: SEMESTER_ID,
      message: 'Semester berhasil dihapus',
    });
    expect(prismaMock.academicSemester.delete).toHaveBeenCalledWith({
      where: { id: SEMESTER_ID },
    });
  });

  it('GetStudentSemesters includes OPEN semester even without enrollment', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValueOnce([]);
    prismaMock.academicSemester.findFirst.mockResolvedValueOnce({ id: 'open-sem' });
    prismaMock.academicSemester.findMany.mockResolvedValueOnce([
      {
        ...baseSemester,
        id: 'open-sem',
        status: 'OPEN',
        isActive: true,
      },
    ]);

    const result = await invokeGrpc('GetStudentSemesters', { studentId: 'student-1' });

    expect(result.semesters).toHaveLength(1);
    expect(result.semesters[0].id).toBe('open-sem');
  });
});
