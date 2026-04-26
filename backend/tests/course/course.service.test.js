/**
 * Course gRPC Service — Unit Tests
 *
 * Tests gRPC handlers in course.grpc-service.js with mocked Prisma.
 * After refactoring to gRPC architecture, course.service.js no longer exists;
 * all business logic now lives in course.grpc-service.js as gRPC handlers.
 *
 * What we test:
 *   ✓ AddStudentToCourse     — success, course not found, access denied, student not found, not a student, duplicate
 *   ✓ AddStudentToCourseById — success, course not found, access denied, student not found, not a student, duplicate
 *   ✓ GetEnrolledCourses     — mapping output shape
 *   ✓ GetTeachingCourses     — filters by teacherId
 *   ✓ GetTeachingCoursesWithStats — returns studentsCount & materialsCount
 *   ✓ GetStudentsByCourse    — success, not found, access denied
 *   ✓ GetAvailableStudentsForCourse — success, not found, access denied
 *   ✓ AdminGetAllCourses     — returns data + pagination
 *   ✓ AdminCreateCourse      — success, duplicate code, teacher not found, not a dosen
 *   ✓ AdminUpdateCourse      — success, not found, duplicate code, teacher validation
 *   ✓ AdminDeleteCourse      — success, not found
 *   ✓ AdminAssignTeacher     — success, course not found, teacher not found, not a dosen
 *
 * Mocking Strategy:
 *   jest.unstable_mockModule() replaces ../../src/config/prisma.js BEFORE
 *   the service module is imported. This is required for ESM mocking.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import grpc from '@grpc/grpc-js';
import { createPrismaMock } from '../helpers/prisma-mock.js';

// ─── Mock Setup ──────────────────────────────────────────────

const prismaMock = createPrismaMock();

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: prismaMock,
}));

// Mock the pagination utility used by AdminGetAllCourses
jest.unstable_mockModule('../../src/utils/pagination.js', () => ({
  paginate: ({ skip = 0, take = 10 } = {}) => ({
    skip: parseInt(skip) || 0,
    take: parseInt(take) || 10,
    meta: (total) => ({
      total,
      page: Math.floor((parseInt(skip) || 0) / (parseInt(take) || 10)) + 1,
      limit: parseInt(take) || 10,
      totalPages: Math.ceil(total / (parseInt(take) || 10)),
    }),
  }),
}));

// ─── Import AFTER mocking ─────────────────────────────────────
const { courseService } = await import('../../src/modules/course/course.grpc-service.js');

// ─── gRPC Invocation Helper ───────────────────────────────────
/**
 * Invokes a gRPC handler and returns a promise that resolves with the response
 * or rejects with the gRPC error object passed to the callback.
 */
const invokeGrpc = (method, request = {}) => {
  return new Promise((resolve, reject) => {
    courseService[method]({ request }, (error, response) => {
      if (error) return reject(error);
      resolve(response);
    });
  });
};

// ─── Shared Test Data ─────────────────────────────────────────
const TEACHER_ID = 'teacher-uuid-1';
const STUDENT_ID = 'student-uuid-1';
const COURSE_ID  = 'course-uuid-1';

const baseCourse = {
  id: COURSE_ID,
  title: 'Pemrograman Web',
  description: 'Mata kuliah web',
  code: 'IF-101',
  semester: 3,
  sks: 3,
  teacherId: TEACHER_ID,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const baseStudent = {
  id: STUDENT_ID,
  name: 'Mahasiswa User',
  email: 'mhs@test.com',
  role: 'MAHASISWA',
};

const baseTeacher = {
  id: TEACHER_ID,
  name: 'Dosen User',
  email: 'dosen@test.com',
  role: 'DOSEN',
};

// ─── Tests ────────────────────────────────────────────────────

describe('course.grpc-service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // AddStudentToCourse (by email)
  // ═══════════════════════════════════════════════════════════════
  describe('AddStudentToCourse', () => {
    const enrollmentData = {
      id: 'enrollment-1',
      enrolledAt: new Date('2026-01-10T00:00:00.000Z'),
      student: { id: STUDENT_ID, name: 'Mahasiswa', email: 'mhs@test.com' },
    };

    it('should enroll a student by email successfully (DOSEN owner)', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent);
      prismaMock.enrollment.findUnique.mockResolvedValue(null);
      prismaMock.enrollment.create.mockResolvedValue(enrollmentData);

      const result = await invokeGrpc('AddStudentToCourse', {
        courseId: COURSE_ID,
        studentEmail: 'mhs@test.com',
        teacherId: TEACHER_ID,
        teacherRole: 'DOSEN',
      });

      expect(result.enrollmentId).toBe('enrollment-1');
      expect(result.student.email).toBe('mhs@test.com');
      expect(result.enrolledAt).toBe(enrollmentData.enrolledAt.toISOString());
    });

    it('should allow ADMIN to enroll in any course', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent);
      prismaMock.enrollment.findUnique.mockResolvedValue(null);
      prismaMock.enrollment.create.mockResolvedValue(enrollmentData);

      const result = await invokeGrpc('AddStudentToCourse', {
        courseId: COURSE_ID,
        studentEmail: 'mhs@test.com',
        teacherId: 'admin-id',
        teacherRole: 'ADMIN',
      });

      expect(result.enrollmentId).toBe('enrollment-1');
    });

    it('should return NOT_FOUND when course does not exist', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(
        invokeGrpc('AddStudentToCourse', {
          courseId: COURSE_ID,
          studentEmail: 'mhs@test.com',
          teacherId: TEACHER_ID,
          teacherRole: 'DOSEN',
        })
      ).rejects.toMatchObject({
        code: grpc.status.NOT_FOUND,
        details: 'Kelas tidak ditemukan',
      });
    });

    it('should return PERMISSION_DENIED when DOSEN is not the course owner', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);

      await expect(
        invokeGrpc('AddStudentToCourse', {
          courseId: COURSE_ID,
          studentEmail: 'mhs@test.com',
          teacherId: 'other-teacher-id',
          teacherRole: 'DOSEN',
        })
      ).rejects.toMatchObject({
        code: grpc.status.PERMISSION_DENIED,
        details: 'Akses ditolak: Ini bukan kelas Anda',
      });
    });

    it('should return NOT_FOUND when student email not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        invokeGrpc('AddStudentToCourse', {
          courseId: COURSE_ID,
          studentEmail: 'nonexistent@test.com',
          teacherId: TEACHER_ID,
          teacherRole: 'DOSEN',
        })
      ).rejects.toMatchObject({
        code: grpc.status.NOT_FOUND,
        details: 'Mahasiswa dengan email tersebut tidak ditemukan',
      });
    });

    it('should return INVALID_ARGUMENT when user is not a MAHASISWA', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseTeacher);

      await expect(
        invokeGrpc('AddStudentToCourse', {
          courseId: COURSE_ID,
          studentEmail: 'dosen@test.com',
          teacherId: TEACHER_ID,
          teacherRole: 'DOSEN',
        })
      ).rejects.toMatchObject({
        code: grpc.status.INVALID_ARGUMENT,
        details: 'User tersebut bukan mahasiswa',
      });
    });

    it('should return ALREADY_EXISTS when student already enrolled', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent);
      prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        invokeGrpc('AddStudentToCourse', {
          courseId: COURSE_ID,
          studentEmail: 'mhs@test.com',
          teacherId: TEACHER_ID,
          teacherRole: 'DOSEN',
        })
      ).rejects.toMatchObject({
        code: grpc.status.ALREADY_EXISTS,
        details: 'Mahasiswa sudah terdaftar di kelas ini',
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // AddStudentToCourseById
  // ═══════════════════════════════════════════════════════════════
  describe('AddStudentToCourseById', () => {
    const enrollmentData = {
      id: 'enrollment-2',
      enrolledAt: new Date('2026-01-10T00:00:00.000Z'),
      student: { id: STUDENT_ID, name: 'Mahasiswa', email: 'mhs@test.com' },
    };

    it('should enroll a student by ID successfully', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent);
      prismaMock.enrollment.findUnique.mockResolvedValue(null);
      prismaMock.enrollment.create.mockResolvedValue(enrollmentData);

      const result = await invokeGrpc('AddStudentToCourseById', {
        courseId: COURSE_ID,
        studentId: STUDENT_ID,
        teacherId: TEACHER_ID,
        teacherRole: 'DOSEN',
      });

      expect(result.enrollmentId).toBe('enrollment-2');
      expect(result.student.id).toBe(STUDENT_ID);
    });

    it('should return NOT_FOUND when course does not exist', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(
        invokeGrpc('AddStudentToCourseById', {
          courseId: COURSE_ID,
          studentId: STUDENT_ID,
          teacherId: TEACHER_ID,
          teacherRole: 'DOSEN',
        })
      ).rejects.toMatchObject({
        code: grpc.status.NOT_FOUND,
        details: 'Kelas tidak ditemukan',
      });
    });

    it('should return PERMISSION_DENIED when DOSEN is not the owner', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);

      await expect(
        invokeGrpc('AddStudentToCourseById', {
          courseId: COURSE_ID,
          studentId: STUDENT_ID,
          teacherId: 'other-id',
          teacherRole: 'DOSEN',
        })
      ).rejects.toMatchObject({
        code: grpc.status.PERMISSION_DENIED,
        details: 'Akses ditolak: Ini bukan kelas Anda',
      });
    });

    it('should return NOT_FOUND when student not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        invokeGrpc('AddStudentToCourseById', {
          courseId: COURSE_ID,
          studentId: 'nonexistent-id',
          teacherId: TEACHER_ID,
          teacherRole: 'DOSEN',
        })
      ).rejects.toMatchObject({
        code: grpc.status.NOT_FOUND,
        details: 'Mahasiswa tidak ditemukan',
      });
    });

    it('should return INVALID_ARGUMENT when user is not a MAHASISWA', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseTeacher);

      await expect(
        invokeGrpc('AddStudentToCourseById', {
          courseId: COURSE_ID,
          studentId: TEACHER_ID,
          teacherId: TEACHER_ID,
          teacherRole: 'DOSEN',
        })
      ).rejects.toMatchObject({
        code: grpc.status.INVALID_ARGUMENT,
        details: 'User tersebut bukan mahasiswa',
      });
    });

    it('should return ALREADY_EXISTS when student already enrolled', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent);
      prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        invokeGrpc('AddStudentToCourseById', {
          courseId: COURSE_ID,
          studentId: STUDENT_ID,
          teacherId: TEACHER_ID,
          teacherRole: 'DOSEN',
        })
      ).rejects.toMatchObject({
        code: grpc.status.ALREADY_EXISTS,
        details: 'Mahasiswa sudah terdaftar di kelas ini',
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GetEnrolledCourses
  // ═══════════════════════════════════════════════════════════════
  describe('GetEnrolledCourses', () => {
    it('should return transformed enrollment data with correct shape', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          id: 'e-1',
          enrolledAt: new Date('2024-01-01T00:00:00.000Z'),
          course: {
            id: COURSE_ID,
            title: 'Web',
            code: 'IF-101',
            teacher: { id: TEACHER_ID, name: 'Dosen' },
          },
        },
      ]);

      const result = await invokeGrpc('GetEnrolledCourses', { studentId: STUDENT_ID });

      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].enrollmentId).toBe('e-1');
      expect(result.courses[0].course.id).toBe(COURSE_ID);
      expect(result.courses[0].course.teacher.id).toBe(TEACHER_ID);
    });

    it('should return empty array when no enrollments', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([]);

      const result = await invokeGrpc('GetEnrolledCourses', { studentId: STUDENT_ID });

      expect(result.courses).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GetTeachingCourses
  // ═══════════════════════════════════════════════════════════════
  describe('GetTeachingCourses', () => {
    it('should filter courses by teacherId', async () => {
      const courses = [{ id: COURSE_ID, title: 'Web', code: 'IF-101' }];
      prismaMock.course.findMany.mockResolvedValue(courses);

      const result = await invokeGrpc('GetTeachingCourses', { teacherId: TEACHER_ID });

      expect(prismaMock.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teacherId: TEACHER_ID },
        })
      );
      expect(result.courses).toEqual(courses);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GetTeachingCoursesWithStats
  // ═══════════════════════════════════════════════════════════════
  describe('GetTeachingCoursesWithStats', () => {
    it('should return courses with studentsCount and materialsCount (flattened)', async () => {
      // gRPC service flattens _count into studentsCount / materialsCount
      prismaMock.course.findMany.mockResolvedValue([
        {
          id: COURSE_ID,
          title: 'Web',
          code: 'IF-101',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          _count: { students: 25, materials: 10 },
        },
      ]);

      const result = await invokeGrpc('GetTeachingCoursesWithStats', { teacherId: TEACHER_ID });

      expect(result.courses).toHaveLength(1);
      // gRPC service maps _count.students → studentsCount, _count.materials → materialsCount
      expect(result.courses[0].studentsCount).toBe(25);
      expect(result.courses[0].materialsCount).toBe(10);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GetStudentsByCourse
  // ═══════════════════════════════════════════════════════════════
  describe('GetStudentsByCourse', () => {
    it('should return enrollments for course owner (DOSEN)', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          id: 'e-1',
          enrolledAt: new Date('2026-01-01T00:00:00.000Z'),
          student: { id: STUDENT_ID, name: 'Mhs', email: 'mhs@test.com' },
        },
      ]);

      const result = await invokeGrpc('GetStudentsByCourse', {
        courseId: COURSE_ID,
        userId: TEACHER_ID,
        userRole: 'DOSEN',
      });

      expect(result.enrollments).toHaveLength(1);
      expect(result.enrollments[0].student.id).toBe(STUDENT_ID);
    });

    it('should allow ADMIN to access any course', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.enrollment.findMany.mockResolvedValue([]);

      const result = await invokeGrpc('GetStudentsByCourse', {
        courseId: COURSE_ID,
        userId: 'admin-id',
        userRole: 'ADMIN',
      });

      expect(result.enrollments).toEqual([]);
    });

    it('should return NOT_FOUND when course does not exist', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(
        invokeGrpc('GetStudentsByCourse', {
          courseId: 'nonexistent',
          userId: TEACHER_ID,
          userRole: 'DOSEN',
        })
      ).rejects.toMatchObject({
        code: grpc.status.NOT_FOUND,
        details: 'Kelas tidak ditemukan',
      });
    });

    it('should return PERMISSION_DENIED when DOSEN is not the owner', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);

      await expect(
        invokeGrpc('GetStudentsByCourse', {
          courseId: COURSE_ID,
          userId: 'other-dosen-id',
          userRole: 'DOSEN',
        })
      ).rejects.toMatchObject({
        code: grpc.status.PERMISSION_DENIED,
        details: 'Akses ditolak: Ini bukan kelas Anda',
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GetAvailableStudentsForCourse
  // ═══════════════════════════════════════════════════════════════
  describe('GetAvailableStudentsForCourse', () => {
    it('should return students not enrolled in course', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.enrollment.findMany.mockResolvedValue([
        { userId: 'already-enrolled-id' },
      ]);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'new-student', name: 'New Student', email: 'new@test.com' },
      ]);

      const result = await invokeGrpc('GetAvailableStudentsForCourse', {
        courseId: COURSE_ID,
        userId: TEACHER_ID,
        userRole: 'DOSEN',
      });

      expect(result.students).toHaveLength(1);
      expect(result.students[0].id).toBe('new-student');
    });

    it('should return NOT_FOUND when course does not exist', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(
        invokeGrpc('GetAvailableStudentsForCourse', {
          courseId: 'nonexistent',
          userId: TEACHER_ID,
          userRole: 'DOSEN',
        })
      ).rejects.toMatchObject({
        code: grpc.status.NOT_FOUND,
        details: 'Kelas tidak ditemukan',
      });
    });

    it('should return PERMISSION_DENIED when DOSEN is not the owner', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);

      await expect(
        invokeGrpc('GetAvailableStudentsForCourse', {
          courseId: COURSE_ID,
          userId: 'other-id',
          userRole: 'DOSEN',
        })
      ).rejects.toMatchObject({
        code: grpc.status.PERMISSION_DENIED,
        details: 'Akses ditolak: Ini bukan kelas Anda',
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // AdminGetAllCourses
  // ═══════════════════════════════════════════════════════════════
  describe('AdminGetAllCourses', () => {
    it('should return data array and pagination', async () => {
      const mockCourses = [
        {
          ...baseCourse,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          teacher: baseTeacher,
          _count: { students: 10, materials: 5, assignments: 3 },
        },
      ];
      prismaMock.course.findMany.mockResolvedValue(mockCourses);
      prismaMock.course.count.mockResolvedValue(1);

      const result = await invokeGrpc('AdminGetAllCourses', {});

      expect(result.data).toHaveLength(1);
      // gRPC service flattens _count into studentsCount, materialsCount, assignmentsCount
      expect(result.data[0].studentsCount).toBe(10);
      expect(result.data[0].materialsCount).toBe(5);
      expect(result.data[0].assignmentsCount).toBe(3);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // AdminCreateCourse
  // ═══════════════════════════════════════════════════════════════
  describe('AdminCreateCourse', () => {
    it('should create a course successfully', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null); // no duplicate
      prismaMock.user.findUnique.mockResolvedValue(baseTeacher);
      prismaMock.course.create.mockResolvedValue({
        id: 'new-course',
        title: 'Algoritma',
        code: 'IF-201',
        description: '',
        semester: 2,
        sks: 3,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        teacher: baseTeacher,
      });

      const result = await invokeGrpc('AdminCreateCourse', {
        title: 'Algoritma',
        code: 'IF-201',
        teacherId: TEACHER_ID,
      });

      expect(result.id).toBe('new-course');
    });

    it('should create a course without teacherId', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);
      prismaMock.course.create.mockResolvedValue({
        id: 'new-course-2',
        title: 'Algo',
        code: 'IF-202',
        description: '',
        semester: null,
        sks: 3,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        teacher: null,
      });

      const result = await invokeGrpc('AdminCreateCourse', {
        title: 'Algo',
        code: 'IF-202',
      });

      expect(result.id).toBe('new-course-2');
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return ALREADY_EXISTS when code is taken', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);

      await expect(
        invokeGrpc('AdminCreateCourse', { title: 'Algoritma', code: 'IF-101', teacherId: TEACHER_ID })
      ).rejects.toMatchObject({
        code: grpc.status.ALREADY_EXISTS,
        details: 'Kode kelas sudah digunakan',
      });
    });

    it('should return NOT_FOUND when teacher not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        invokeGrpc('AdminCreateCourse', { title: 'Algoritma', code: 'IF-201', teacherId: TEACHER_ID })
      ).rejects.toMatchObject({
        code: grpc.status.NOT_FOUND,
        details: 'Dosen tidak ditemukan',
      });
    });

    it('should return INVALID_ARGUMENT when assigned user is not a DOSEN', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent); // MAHASISWA

      await expect(
        invokeGrpc('AdminCreateCourse', { title: 'Algoritma', code: 'IF-201', teacherId: TEACHER_ID })
      ).rejects.toMatchObject({
        code: grpc.status.INVALID_ARGUMENT,
        details: 'User tersebut bukan dosen',
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // AdminUpdateCourse
  // ═══════════════════════════════════════════════════════════════
  describe('AdminUpdateCourse', () => {
    it('should update a course successfully', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.course.update.mockResolvedValue({
        ...baseCourse,
        title: 'Updated Title',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        teacher: null,
      });

      const result = await invokeGrpc('AdminUpdateCourse', {
        courseId: COURSE_ID,
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
    });

    it('should return NOT_FOUND when course does not exist', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(
        invokeGrpc('AdminUpdateCourse', { courseId: 'nonexistent', title: 'X' })
      ).rejects.toMatchObject({
        code: grpc.status.NOT_FOUND,
        details: 'Kelas tidak ditemukan',
      });
    });

    it('should return ALREADY_EXISTS when new code is duplicate', async () => {
      prismaMock.course.findUnique
        .mockResolvedValueOnce(baseCourse)            // course exists
        .mockResolvedValueOnce({ id: 'other', code: 'IF-999' }); // code taken

      await expect(
        invokeGrpc('AdminUpdateCourse', { courseId: COURSE_ID, code: 'IF-999' })
      ).rejects.toMatchObject({
        code: grpc.status.ALREADY_EXISTS,
        details: 'Kode kelas sudah digunakan',
      });
    });

    it('should not check duplicate when code is the same', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.course.update.mockResolvedValue({
        ...baseCourse,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        teacher: null,
      });

      const result = await invokeGrpc('AdminUpdateCourse', {
        courseId: COURSE_ID,
        code: 'IF-101', // same code — should NOT trigger duplicate check
      });

      expect(result).toBeDefined();
      // findUnique was called only once (for the course itself, not for duplicate check)
      expect(prismaMock.course.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return NOT_FOUND when teacher does not exist on update', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        invokeGrpc('AdminUpdateCourse', { courseId: COURSE_ID, teacherId: 'nonexistent' })
      ).rejects.toMatchObject({
        code: grpc.status.NOT_FOUND,
        details: 'Dosen tidak ditemukan',
      });
    });

    it('should return INVALID_ARGUMENT when teacher is not DOSEN role', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent);

      await expect(
        invokeGrpc('AdminUpdateCourse', { courseId: COURSE_ID, teacherId: STUDENT_ID })
      ).rejects.toMatchObject({
        code: grpc.status.INVALID_ARGUMENT,
        details: 'User tersebut bukan dosen',
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // AdminDeleteCourse
  // ═══════════════════════════════════════════════════════════════
  describe('AdminDeleteCourse', () => {
    it('should delete a course and return deleted enrollment count', async () => {
      prismaMock.course.findUnique.mockResolvedValue({
        id: COURSE_ID,
        _count: { students: 5 },
      });
      prismaMock.course.delete.mockResolvedValue(undefined);

      const result = await invokeGrpc('AdminDeleteCourse', { courseId: COURSE_ID });

      expect(result.message).toBe('Kelas berhasil dihapus');
      expect(result.deletedEnrollments).toBe(5);
    });

    it('should return NOT_FOUND when course does not exist', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(
        invokeGrpc('AdminDeleteCourse', { courseId: 'nonexistent' })
      ).rejects.toMatchObject({
        code: grpc.status.NOT_FOUND,
        details: 'Kelas tidak ditemukan',
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // AdminAssignTeacher
  // ═══════════════════════════════════════════════════════════════
  describe('AdminAssignTeacher', () => {
    it('should assign a teacher successfully', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseTeacher);
      prismaMock.course.update.mockResolvedValue({
        id: COURSE_ID,
        title: 'Web',
        code: 'IF-101',
        teacher: baseTeacher,
      });

      const result = await invokeGrpc('AdminAssignTeacher', {
        courseId: COURSE_ID,
        teacherId: TEACHER_ID,
      });

      expect(result.teacher.id).toBe(TEACHER_ID);
    });

    it('should return NOT_FOUND when course does not exist', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(
        invokeGrpc('AdminAssignTeacher', { courseId: 'nonexistent', teacherId: TEACHER_ID })
      ).rejects.toMatchObject({
        code: grpc.status.NOT_FOUND,
        details: 'Kelas tidak ditemukan',
      });
    });

    it('should return NOT_FOUND when teacher does not exist', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        invokeGrpc('AdminAssignTeacher', { courseId: COURSE_ID, teacherId: 'nonexistent' })
      ).rejects.toMatchObject({
        code: grpc.status.NOT_FOUND,
        details: 'Dosen tidak ditemukan',
      });
    });

    it('should return INVALID_ARGUMENT when user is not a DOSEN', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent);

      await expect(
        invokeGrpc('AdminAssignTeacher', { courseId: COURSE_ID, teacherId: STUDENT_ID })
      ).rejects.toMatchObject({
        code: grpc.status.INVALID_ARGUMENT,
        details: 'User tersebut bukan dosen',
      });
    });
  });
});
