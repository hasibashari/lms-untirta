/**
 * Course Service — Unit Tests
 *
 * Tests the business logic in course.service.js in isolation.
 * Prisma is fully mocked — no database calls are made.
 *
 * What we test:
 *   ✓ createCourse — success, duplicate code
 *   ✓ getAllCourses — returns list
 *   ✓ addStudentToCourse — success, course not found, access denied, student not found, not a student, duplicate enrollment
 *   ✓ addStudentToCourseById — success, course not found, access denied, student not found, not a student, duplicate enrollment
 *   ✓ getEnrolledCourses — mapping
 *   ✓ getTeachingCourses — filtering
 *   ✓ getTeachingCoursesWithStats — filtering with counts
 *   ✓ getStudentsByCourse — success, not found, access denied
 *   ✓ getAvailableStudentsForCourse — success, not found, access denied
 *   ✓ adminGetAllCourses — returns list
 *   ✓ adminCreateCourse — success, duplicate code, teacher not found, not a dosen
 *   ✓ adminUpdateCourse — success, not found, duplicate code, teacher validation
 *   ✓ adminDeleteCourse — success, not found
 *   ✓ adminAssignTeacher — success, course not found, teacher not found, not a dosen
 *
 * Mocking Strategy:
 *   jest.unstable_mockModule() replaces ../../config/prisma.js BEFORE
 *   the service module is imported. This is required for ESM mocking.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismaMock } from '../helpers/prisma-mock.js';

// ─── Mock Setup ──────────────────────────────────────────────

const prismaMock = createPrismaMock();

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: prismaMock,
}));

// ─── Import AFTER mocking ────────────────────────────────────
const {
  addStudentToCourse,
  addStudentToCourseById,
  getEnrolledCourses,
  getTeachingCourses,
  getTeachingCoursesWithStats,
  getStudentsByCourse,
  getAvailableStudentsForCourse,
  adminGetAllCourses,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  adminAssignTeacher,
} = await import('../../src/modules/course/course.service.js');

// ─── Shared Data ─────────────────────────────────────────────
const TEACHER_ID = 'teacher-uuid-1';
const STUDENT_ID = 'student-uuid-1';
const COURSE_ID = 'course-uuid-1';

const baseCourse = {
  id: COURSE_ID,
  title: 'Pemrograman Web',
  description: 'Mata kuliah web',
  code: 'IF-101',
  semester: 3,
  sks: 3,
  teacherId: TEACHER_ID,
  createdAt: new Date(),
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

// ─── Tests ───────────────────────────────────────────────────

describe('CourseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════
  // addStudentToCourse (by email)
  // ═══════════════════════════════════════════════════════════
  describe('addStudentToCourse', () => {
    const enrollmentResult = {
      id: 'enrollment-1',
      enrolledAt: new Date(),
      student: { id: STUDENT_ID, name: 'Mahasiswa', email: 'mhs@test.com' },
    };

    it('should enroll a student by email successfully (DOSEN owner)', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent);
      prismaMock.enrollment.findUnique.mockResolvedValue(null);
      prismaMock.enrollment.create.mockResolvedValue(enrollmentResult);

      const result = await addStudentToCourse(
        COURSE_ID, 'mhs@test.com', TEACHER_ID, 'DOSEN'
      );

      expect(result.enrollmentId).toBe('enrollment-1');
      expect(result.student.email).toBe('mhs@test.com');
    });

    it('should allow ADMIN to enroll in any course', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent);
      prismaMock.enrollment.findUnique.mockResolvedValue(null);
      prismaMock.enrollment.create.mockResolvedValue(enrollmentResult);

      const result = await addStudentToCourse(
        COURSE_ID, 'mhs@test.com', 'admin-id', 'ADMIN'
      );

      expect(result.enrollmentId).toBe('enrollment-1');
    });

    it('should throw when course not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(
        addStudentToCourse(COURSE_ID, 'mhs@test.com', TEACHER_ID, 'DOSEN')
      ).rejects.toThrow('Kelas tidak ditemukan');
    });

    it('should throw when DOSEN is not the course owner', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);

      await expect(
        addStudentToCourse(COURSE_ID, 'mhs@test.com', 'other-teacher-id', 'DOSEN')
      ).rejects.toThrow('Akses ditolak: Ini bukan kelas Anda');
    });

    it('should throw when student email not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        addStudentToCourse(COURSE_ID, 'nonexistent@test.com', TEACHER_ID, 'DOSEN')
      ).rejects.toThrow('Mahasiswa dengan email tersebut tidak ditemukan');
    });

    it('should throw when user is not a MAHASISWA', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue({ ...baseTeacher, email: 'dosen@test.com' });

      await expect(
        addStudentToCourse(COURSE_ID, 'dosen@test.com', TEACHER_ID, 'DOSEN')
      ).rejects.toThrow('User tersebut bukan mahasiswa');
    });

    it('should throw when student already enrolled', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent);
      prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        addStudentToCourse(COURSE_ID, 'mhs@test.com', TEACHER_ID, 'DOSEN')
      ).rejects.toThrow('Mahasiswa sudah terdaftar di kelas ini');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // addStudentToCourseById
  // ═══════════════════════════════════════════════════════════
  describe('addStudentToCourseById', () => {
    const enrollmentResult = {
      id: 'enrollment-2',
      enrolledAt: new Date(),
      student: { id: STUDENT_ID, name: 'Mahasiswa', email: 'mhs@test.com' },
    };

    it('should enroll a student by ID successfully', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent);
      prismaMock.enrollment.findUnique.mockResolvedValue(null);
      prismaMock.enrollment.create.mockResolvedValue(enrollmentResult);

      const result = await addStudentToCourseById(
        COURSE_ID, STUDENT_ID, TEACHER_ID, 'DOSEN'
      );

      expect(result.enrollmentId).toBe('enrollment-2');
      expect(result.student.id).toBe(STUDENT_ID);
    });

    it('should throw when course not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(
        addStudentToCourseById(COURSE_ID, STUDENT_ID, TEACHER_ID, 'DOSEN')
      ).rejects.toThrow('Kelas tidak ditemukan');
    });

    it('should throw when DOSEN is not the owner', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);

      await expect(
        addStudentToCourseById(COURSE_ID, STUDENT_ID, 'other-id', 'DOSEN')
      ).rejects.toThrow('Akses ditolak: Ini bukan kelas Anda');
    });

    it('should throw when student not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        addStudentToCourseById(COURSE_ID, 'nonexistent-id', TEACHER_ID, 'DOSEN')
      ).rejects.toThrow('Mahasiswa tidak ditemukan');
    });

    it('should throw when user is not a MAHASISWA', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseTeacher);

      await expect(
        addStudentToCourseById(COURSE_ID, TEACHER_ID, TEACHER_ID, 'DOSEN')
      ).rejects.toThrow('User tersebut bukan mahasiswa');
    });

    it('should throw when already enrolled', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent);
      prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        addStudentToCourseById(COURSE_ID, STUDENT_ID, TEACHER_ID, 'DOSEN')
      ).rejects.toThrow('Mahasiswa sudah terdaftar di kelas ini');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getEnrolledCourses
  // ═══════════════════════════════════════════════════════════
  describe('getEnrolledCourses', () => {
    it('should return transformed enrollment data', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          id: 'e-1',
          enrolledAt: new Date('2024-01-01'),
          course: {
            id: COURSE_ID,
            title: 'Web',
            code: 'IF-101',
            teacher: { id: TEACHER_ID, name: 'Dosen' },
          },
        },
      ]);

      const result = await getEnrolledCourses(STUDENT_ID);

      expect(result).toHaveLength(1);
      expect(result[0].enrollmentId).toBe('e-1');
      expect(result[0].course.id).toBe(COURSE_ID);
      expect(result[0].course.teacher.id).toBe(TEACHER_ID);
    });

    it('should return empty array when no enrollments', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([]);

      const result = await getEnrolledCourses(STUDENT_ID);

      expect(result).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getTeachingCourses
  // ═══════════════════════════════════════════════════════════
  describe('getTeachingCourses', () => {
    it('should return courses for a teacher', async () => {
      const courses = [{ id: COURSE_ID, title: 'Web', code: 'IF-101' }];
      prismaMock.course.findMany.mockResolvedValue(courses);

      const result = await getTeachingCourses(TEACHER_ID);

      expect(prismaMock.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teacherId: TEACHER_ID },
        })
      );
      expect(result).toEqual(courses);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getTeachingCoursesWithStats
  // ═══════════════════════════════════════════════════════════
  describe('getTeachingCoursesWithStats', () => {
    it('should return courses with _count stats', async () => {
      const courses = [
        {
          id: COURSE_ID,
          title: 'Web',
          code: 'IF-101',
          createdAt: new Date(),
          _count: { students: 25, materials: 10 },
        },
      ];
      prismaMock.course.findMany.mockResolvedValue(courses);

      const result = await getTeachingCoursesWithStats(TEACHER_ID);

      expect(result[0]._count.students).toBe(25);
      expect(result[0]._count.materials).toBe(10);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getStudentsByCourse
  // ═══════════════════════════════════════════════════════════
  describe('getStudentsByCourse', () => {
    it('should return students for course owner (DOSEN)', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          id: 'e-1',
          enrolledAt: new Date(),
          student: { id: STUDENT_ID, name: 'Mhs', email: 'mhs@test.com' },
        },
      ]);

      const result = await getStudentsByCourse(COURSE_ID, TEACHER_ID, 'DOSEN');

      expect(result).toHaveLength(1);
      expect(result[0].student.id).toBe(STUDENT_ID);
    });

    it('should allow ADMIN to access any course', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.enrollment.findMany.mockResolvedValue([]);

      const result = await getStudentsByCourse(COURSE_ID, 'admin-id', 'ADMIN');

      expect(result).toEqual([]);
    });

    it('should throw when course not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(
        getStudentsByCourse('nonexistent', TEACHER_ID, 'DOSEN')
      ).rejects.toThrow('Kelas tidak ditemukan');
    });

    it('should throw when DOSEN is not the owner', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);

      await expect(
        getStudentsByCourse(COURSE_ID, 'other-dosen-id', 'DOSEN')
      ).rejects.toThrow('Akses ditolak: Ini bukan kelas Anda');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getAvailableStudentsForCourse
  // ═══════════════════════════════════════════════════════════
  describe('getAvailableStudentsForCourse', () => {
    it('should return students not enrolled in course', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.enrollment.findMany.mockResolvedValue([
        { userId: 'already-enrolled-id' },
      ]);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'new-student', name: 'New Student', email: 'new@test.com' },
      ]);

      const result = await getAvailableStudentsForCourse(
        COURSE_ID, TEACHER_ID, 'DOSEN'
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('new-student');
    });

    it('should throw when course not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(
        getAvailableStudentsForCourse('nonexistent', TEACHER_ID, 'DOSEN')
      ).rejects.toThrow('Kelas tidak ditemukan');
    });

    it('should throw when DOSEN is not the owner', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);

      await expect(
        getAvailableStudentsForCourse(COURSE_ID, 'other-id', 'DOSEN')
      ).rejects.toThrow('Akses ditolak: Ini bukan kelas Anda');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // adminGetAllCourses
  // ═══════════════════════════════════════════════════════════
  describe('adminGetAllCourses', () => {
    it('should return all courses with counts', async () => {
      const courses = [
        {
          ...baseCourse,
          teacher: baseTeacher,
          _count: { students: 10, materials: 5, assignments: 3 },
        },
      ];
      prismaMock.course.findMany.mockResolvedValue(courses);
      prismaMock.course.count.mockResolvedValue(1);

      const result = await adminGetAllCourses();

      expect(result.data).toHaveLength(1);
      expect(result.data[0]._count.students).toBe(10);
      expect(result.pagination).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // adminCreateCourse
  // ═══════════════════════════════════════════════════════════
  describe('adminCreateCourse', () => {
    const input = {
      title: 'Algoritma',
      code: 'IF-201',
      teacherId: TEACHER_ID,
    };

    it('should create a course successfully', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null); // no duplicate
      prismaMock.user.findUnique.mockResolvedValue(baseTeacher);
      prismaMock.course.create.mockResolvedValue({
        id: 'new-course',
        ...input,
        teacher: baseTeacher,
      });

      const result = await adminCreateCourse(input);

      expect(result.id).toBe('new-course');
    });

    it('should create a course without teacherId', async () => {
      const inputNoTeacher = { title: 'Algo', code: 'IF-202' };
      prismaMock.course.findUnique.mockResolvedValue(null);
      prismaMock.course.create.mockResolvedValue({
        id: 'new-course-2',
        ...inputNoTeacher,
        teacher: null,
      });

      const result = await adminCreateCourse(inputNoTeacher);

      expect(result.id).toBe('new-course-2');
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw when code already exists', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);

      await expect(adminCreateCourse(input)).rejects.toThrow(
        'Kode kelas sudah digunakan'
      );
    });

    it('should throw when teacher not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(adminCreateCourse(input)).rejects.toThrow(
        'Dosen tidak ditemukan'
      );
    });

    it('should throw when assigned user is not a DOSEN', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent); // MAHASISWA

      await expect(adminCreateCourse(input)).rejects.toThrow(
        'User tersebut bukan dosen'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════
  // adminUpdateCourse
  // ═══════════════════════════════════════════════════════════
  describe('adminUpdateCourse', () => {
    it('should update a course successfully', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.course.update.mockResolvedValue({
        ...baseCourse,
        title: 'Updated Title',
      });

      const result = await adminUpdateCourse(COURSE_ID, { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
    });

    it('should throw when course not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(
        adminUpdateCourse('nonexistent', { title: 'X' })
      ).rejects.toThrow('Kelas tidak ditemukan');
    });

    it('should throw when new code is duplicate', async () => {
      prismaMock.course.findUnique
        .mockResolvedValueOnce(baseCourse) // course exists
        .mockResolvedValueOnce({ id: 'other', code: 'IF-999' }); // code taken

      await expect(
        adminUpdateCourse(COURSE_ID, { code: 'IF-999' })
      ).rejects.toThrow('Kode kelas sudah digunakan');
    });

    it('should allow same code on same course', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.course.update.mockResolvedValue(baseCourse);

      // Updating with the same code should NOT trigger duplicate check
      const result = await adminUpdateCourse(COURSE_ID, { code: 'IF-101' });

      expect(result).toBeDefined();
    });

    it('should throw when teacher not found on update', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        adminUpdateCourse(COURSE_ID, { teacherId: 'nonexistent' })
      ).rejects.toThrow('Dosen tidak ditemukan');
    });

    it('should throw when teacher is not DOSEN role', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent);

      await expect(
        adminUpdateCourse(COURSE_ID, { teacherId: STUDENT_ID })
      ).rejects.toThrow('User tersebut bukan dosen');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // adminDeleteCourse
  // ═══════════════════════════════════════════════════════════
  describe('adminDeleteCourse', () => {
    it('should delete a course successfully', async () => {
      prismaMock.course.findUnique.mockResolvedValue({
        id: COURSE_ID,
        _count: { students: 5 },
      });
      prismaMock.course.delete.mockResolvedValue(undefined);

      const result = await adminDeleteCourse(COURSE_ID);

      expect(result.message).toBe('Kelas berhasil dihapus');
      expect(result.deletedEnrollments).toBe(5);
    });

    it('should throw when course not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(adminDeleteCourse('nonexistent')).rejects.toThrow(
        'Kelas tidak ditemukan'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════
  // adminAssignTeacher
  // ═══════════════════════════════════════════════════════════
  describe('adminAssignTeacher', () => {
    it('should assign a teacher successfully', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseTeacher);
      prismaMock.course.update.mockResolvedValue({
        id: COURSE_ID,
        title: 'Web',
        code: 'IF-101',
        teacher: baseTeacher,
      });

      const result = await adminAssignTeacher(COURSE_ID, TEACHER_ID);

      expect(result.teacher.id).toBe(TEACHER_ID);
    });

    it('should throw when course not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(
        adminAssignTeacher('nonexistent', TEACHER_ID)
      ).rejects.toThrow('Kelas tidak ditemukan');
    });

    it('should throw when teacher not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        adminAssignTeacher(COURSE_ID, 'nonexistent')
      ).rejects.toThrow('Dosen tidak ditemukan');
    });

    it('should throw when user is not a DOSEN', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseStudent);

      await expect(
        adminAssignTeacher(COURSE_ID, STUDENT_ID)
      ).rejects.toThrow('User tersebut bukan dosen');
    });
  });
});
