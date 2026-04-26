/**
 * Class gRPC Service — Unit Tests
 *
 * Tests gRPC handlers in class.grpc-service.js using mocked Prisma.
 * This suite verifies business logic, validation, and error handling
 * without requiring a live database or gRPC server.
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
const classService = (await import('../../src/modules/class/class.grpc-service.js')).default;

// ─── 2. TEST HELPERS ──────────────────────────────────────────────────

/**
 * Invokes a gRPC method and returns a promise.
 * Wraps the (call, callback) signature.
 */
const invokeGrpc = (method, request = {}) => {
  return new Promise((resolve, reject) => {
    classService[method]({ request }, (error, response) => {
      if (error) return reject(error);
      resolve(response);
    });
  });
};

const COURSE_ID = 'course-uuid-1';
const LECTURER_ID = 'lecturer-uuid-1';
const SEMESTER_ID = 'semester-uuid-1';
const CLASS_ID = 'class-uuid-1';

const baseSemester = {
  id: SEMESTER_ID,
  academicYear: '2025/2026',
  semesterType: 'GANJIL',
  status: 'OPEN',
};

const baseClass = {
  id: CLASS_ID,
  section: 'A',
  schedule: 'Senin 08:00-10:00',
  room: 'R.301',
  capacity: 40,
  isEnrollmentOpen: false,
  academicSemesterId: SEMESTER_ID,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  academicSemester: baseSemester,
  course: {
    id: COURSE_ID,
    title: 'Pemrograman Web',
    code: 'IF-101',
    sks: 3,
    semester: 3,
  },
  lecturer: {
    id: LECTURER_ID,
    name: 'Dr. Budi',
    email: 'budi@test.com',
  },
};

// ─── 3. TEST SUITE ────────────────────────────────────────────────────

describe('Class gRPC Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CreateClass', () => {
    it('Success — should create class with explicit lecturer', async () => {
      prismaMock.course.findUnique.mockResolvedValue({ id: COURSE_ID, teacherId: 'default-teacher' });
      prismaMock.user.findUnique.mockResolvedValue({ id: LECTURER_ID, role: 'DOSEN' });
      prismaMock.academicSemester.findUnique.mockResolvedValue(baseSemester);
      prismaMock.class.findUnique.mockResolvedValue(null);
      prismaMock.class.create.mockResolvedValue(baseClass);

      const result = await invokeGrpc('CreateClass', {
        courseId: COURSE_ID,
        lecturerId: LECTURER_ID,
        academicSemesterId: SEMESTER_ID,
        section: 'A',
      });

      expect(result.class.id).toBe(CLASS_ID);
      expect(prismaMock.class.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lecturerId: LECTURER_ID })
        })
      );
    });

    it('Success — should fallback to course teacherId if lecturerId is missing', async () => {
      prismaMock.course.findUnique.mockResolvedValue({ id: COURSE_ID, teacherId: 'teacher-123' });
      prismaMock.user.findUnique.mockResolvedValue({ id: 'teacher-123', role: 'DOSEN' });
      prismaMock.academicSemester.findUnique.mockResolvedValue(baseSemester);
      prismaMock.class.findUnique.mockResolvedValue(null);
      prismaMock.class.create.mockResolvedValue({ ...baseClass, lecturerId: 'teacher-123' });

      await invokeGrpc('CreateClass', {
        courseId: COURSE_ID,
        academicSemesterId: SEMESTER_ID,
        section: 'A',
      });

      expect(prismaMock.class.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lecturerId: 'teacher-123' })
        })
      );
    });

    it('404 — should return error if course not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(invokeGrpc('CreateClass', { courseId: 'wrong' }))
        .rejects.toMatchObject({ code: grpc.status.NOT_FOUND, details: 'Mata kuliah tidak ditemukan' });
    });

    it('400 — should return error if no lecturer provided and no teacher in course', async () => {
      prismaMock.course.findUnique.mockResolvedValue({ id: COURSE_ID, teacherId: null });

      await expect(invokeGrpc('CreateClass', { courseId: COURSE_ID }))
        .rejects.toMatchObject({ code: grpc.status.INVALID_ARGUMENT, details: /Dosen pengampu wajib ditentukan/ });
    });

    it('400 — should return error if semester is CLOSED', async () => {
      prismaMock.course.findUnique.mockResolvedValue({ id: COURSE_ID, teacherId: LECTURER_ID });
      prismaMock.user.findUnique.mockResolvedValue({ id: LECTURER_ID, role: 'DOSEN' });
      prismaMock.academicSemester.findUnique.mockResolvedValue({ ...baseSemester, status: 'CLOSED' });

      await expect(invokeGrpc('CreateClass', { courseId: COURSE_ID, academicSemesterId: SEMESTER_ID }))
        .rejects.toMatchObject({ code: grpc.status.INVALID_ARGUMENT, details: /semester yang sudah CLOSED/ });
    });

    it('409 — should return error if section already exists in this course/semester', async () => {
      prismaMock.course.findUnique.mockResolvedValue({ id: COURSE_ID, teacherId: LECTURER_ID });
      prismaMock.user.findUnique.mockResolvedValue({ id: LECTURER_ID, role: 'DOSEN' });
      prismaMock.academicSemester.findUnique.mockResolvedValue(baseSemester);
      prismaMock.class.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(invokeGrpc('CreateClass', { courseId: COURSE_ID, academicSemesterId: SEMESTER_ID, section: 'A' }))
        .rejects.toMatchObject({ code: grpc.status.ALREADY_EXISTS });
    });
  });

  describe('GetAllClasses', () => {
    it('Success — should return classes with pagination', async () => {
      prismaMock.class.findMany.mockResolvedValue([baseClass]);
      prismaMock.class.count.mockResolvedValue(1);

      const result = await invokeGrpc('GetAllClasses', { page: '1', limit: '10' });

      expect(result.classes).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('Success — should apply filters', async () => {
      prismaMock.class.findMany.mockResolvedValue([]);
      prismaMock.class.count.mockResolvedValue(0);

      await invokeGrpc('GetAllClasses', { academicSemesterId: SEMESTER_ID, courseId: COURSE_ID });

      expect(prismaMock.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { academicSemesterId: SEMESTER_ID, courseId: COURSE_ID }
        })
      );
    });
  });

  describe('GetClassById', () => {
    it('Success — should return class details', async () => {
      prismaMock.class.findUnique.mockResolvedValue(baseClass);
      const result = await invokeGrpc('GetClassById', { id: CLASS_ID });
      expect(result.class.id).toBe(CLASS_ID);
    });

    it('404 — should return error if not found', async () => {
      prismaMock.class.findUnique.mockResolvedValue(null);
      await expect(invokeGrpc('GetClassById', { id: 'wrong' }))
        .rejects.toMatchObject({ code: grpc.status.NOT_FOUND });
    });
  });

  describe('GetOpenClasses', () => {
    it('Success — should only return classes with isEnrollmentOpen=true', async () => {
      prismaMock.class.findMany.mockResolvedValue([]);
      await invokeGrpc('GetOpenClasses', {});
      expect(prismaMock.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isEnrollmentOpen: true } })
      );
    });
  });

  describe('UpdateClass', () => {
    it('Success — should update allowed fields', async () => {
      prismaMock.class.findUnique.mockResolvedValue({ ...baseClass, academicSemester: { status: 'OPEN' } });
      prismaMock.class.update.mockResolvedValue({ ...baseClass, room: 'R.505' });

      const result = await invokeGrpc('UpdateClass', { id: CLASS_ID, room: 'R.505' });

      expect(result.class.room).toBe('R.505');
      expect(prismaMock.class.update).toHaveBeenCalled();
    });

    it('400 — should return error if updating CLOSED semester class', async () => {
      prismaMock.class.findUnique.mockResolvedValue({ ...baseClass, academicSemester: { status: 'CLOSED' } });

      await expect(invokeGrpc('UpdateClass', { id: CLASS_ID, room: 'R.505' }))
        .rejects.toMatchObject({ code: grpc.status.INVALID_ARGUMENT, details: /sudah CLOSED/ });
    });

    it('409 — should handle section collision on update', async () => {
      prismaMock.class.findUnique
        .mockResolvedValueOnce({ ...baseClass, academicSemester: { status: 'OPEN' } }) // Initial check
        .mockResolvedValueOnce({ id: 'other-class' }); // Collision check

      await expect(invokeGrpc('UpdateClass', { id: CLASS_ID, section: 'B' }))
        .rejects.toMatchObject({ code: grpc.status.ALREADY_EXISTS });
    });
  });

  describe('ToggleEnrollment', () => {
    it('Success — should change status', async () => {
      prismaMock.class.findUnique.mockResolvedValue({ ...baseClass, academicSemester: { status: 'OPEN' } });
      prismaMock.class.update.mockResolvedValue({ ...baseClass, isEnrollmentOpen: true });

      const result = await invokeGrpc('ToggleEnrollment', { id: CLASS_ID, isEnrollmentOpen: true });
      expect(result.class.isEnrollmentOpen).toBe(true);
    });
  });

  describe('DeleteClass', () => {
    it('Success — should delete class', async () => {
      prismaMock.class.findUnique.mockResolvedValue({ ...baseClass, academicSemester: { status: 'OPEN' } });
      prismaMock.class.delete.mockResolvedValue({ id: CLASS_ID });

      const result = await invokeGrpc('DeleteClass', { id: CLASS_ID });
      expect(result.deletedId).toBe(CLASS_ID);
    });

    it('400 — should return error if deleting CLOSED semester class', async () => {
      prismaMock.class.findUnique.mockResolvedValue({ ...baseClass, academicSemester: { status: 'CLOSED' } });

      await expect(invokeGrpc('DeleteClass', { id: CLASS_ID }))
        .rejects.toMatchObject({ code: grpc.status.INVALID_ARGUMENT });
    });
  });
});
