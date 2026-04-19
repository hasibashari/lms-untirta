/**
 * Class gRPC Service — Unit Tests
 *
 * Tests gRPC handlers in class.grpc-service.js with mocked Prisma.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import grpc from '@grpc/grpc-js';
import { createPrismaMock } from '../helpers/prisma-mock.js';

const prismaMock = createPrismaMock();

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: prismaMock,
}));

const classService = (await import('../../src/modules/class/class.grpc-service.js')).default;

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

beforeEach(() => {
  jest.resetAllMocks();
});

describe('class.grpc-service', () => {
  it('CreateClass creates class successfully', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ id: COURSE_ID });
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
    expect(result.class.createdAt).toBe(baseClass.createdAt.toISOString());
  });

  it('CreateClass returns NOT_FOUND when course does not exist', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);

    await expect(
      invokeGrpc('CreateClass', {
        courseId: COURSE_ID,
        lecturerId: LECTURER_ID,
        academicSemesterId: SEMESTER_ID,
        section: 'A',
      }),
    ).rejects.toMatchObject({
      code: grpc.status.NOT_FOUND,
      details: 'Mata kuliah tidak ditemukan',
    });
  });

  it('CreateClass returns INVALID_ARGUMENT when lecturer is not DOSEN', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ id: COURSE_ID });
    prismaMock.user.findUnique.mockResolvedValue({ id: LECTURER_ID, role: 'MAHASISWA' });

    await expect(
      invokeGrpc('CreateClass', {
        courseId: COURSE_ID,
        lecturerId: LECTURER_ID,
        academicSemesterId: SEMESTER_ID,
        section: 'A',
      }),
    ).rejects.toMatchObject({
      code: grpc.status.INVALID_ARGUMENT,
      details: 'User yang dipilih bukan dosen',
    });
  });

  it('GetAllClasses returns list and pagination', async () => {
    prismaMock.class.findMany.mockResolvedValue([{ ...baseClass, _count: { krsEnrollments: 2 } }]);
    prismaMock.class.count.mockResolvedValue(1);

    const result = await invokeGrpc('GetAllClasses', { page: '1', limit: '10' });

    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].krsEnrollmentsCount).toBe(2);
    expect(result.pagination).toEqual(
      expect.objectContaining({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
    );
  });

  it('GetClassById returns NOT_FOUND when class does not exist', async () => {
    prismaMock.class.findUnique.mockResolvedValue(null);

    await expect(invokeGrpc('GetClassById', { id: CLASS_ID })).rejects.toMatchObject({
      code: grpc.status.NOT_FOUND,
      details: 'Kelas offering tidak ditemukan',
    });
  });

  it('GetClassesByLecturer returns classes for given lecturer', async () => {
    prismaMock.class.findMany.mockResolvedValue([{ ...baseClass, _count: { krsEnrollments: 0 } }]);

    const result = await invokeGrpc('GetClassesByLecturer', { lecturerId: LECTURER_ID });

    expect(prismaMock.class.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { lecturerId: LECTURER_ID } }),
    );
    expect(result.classes).toHaveLength(1);
  });

  it('UpdateClass updates fields', async () => {
    prismaMock.class.findUnique.mockResolvedValue({
      id: CLASS_ID,
      courseId: COURSE_ID,
      academicSemesterId: SEMESTER_ID,
      section: 'A',
      academicSemester: { status: 'OPEN' },
    });
    prismaMock.class.update.mockResolvedValue({ ...baseClass, room: 'R.999' });

    const result = await invokeGrpc('UpdateClass', {
      id: CLASS_ID,
      room: 'R.999',
    });

    expect(result.class.room).toBe('R.999');
  });

  it('ToggleEnrollment returns NOT_FOUND for unknown class', async () => {
    prismaMock.class.findUnique.mockResolvedValue(null);

    await expect(
      invokeGrpc('ToggleEnrollment', { id: CLASS_ID, isEnrollmentOpen: true }),
    ).rejects.toMatchObject({
      code: grpc.status.NOT_FOUND,
      details: 'Kelas offering tidak ditemukan',
    });
  });

  it('DeleteClass deletes class successfully', async () => {
    prismaMock.class.findUnique.mockResolvedValue({
      id: CLASS_ID,
      section: 'A',
      course: { code: 'IF-101' },
      academicSemester: { status: 'OPEN' },
    });
    prismaMock.class.delete.mockResolvedValue({ id: CLASS_ID });

    const result = await invokeGrpc('DeleteClass', { id: CLASS_ID });

    expect(result.deletedId).toBe(CLASS_ID);
    expect(result.message).toContain('berhasil dihapus');
  });
});
