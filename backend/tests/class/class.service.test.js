/**
 * Class Service — Unit Tests
 *
 * Tests the business logic in class.service.js in isolation.
 * Prisma is fully mocked — no database calls are made.
 *
 * What we test:
 *   ✓ createClass — success, course not found, lecturer not found, not a dosen,
 *     semester not found, semester closed, duplicate class
 *   ✓ getAllClasses — returns list, applies filters
 *   ✓ getClassById — success, not found
 *   ✓ getClassesByLecturer — returns list, applies filters
 *   ✓ getClassesByCourse — returns list, applies filters
 *   ✓ getOpenClasses — returns list, applies filters
 *   ✓ updateClass — success, not found, semester closed, lecturer validation,
 *     semester validation, duplicate on unique field change
 *   ✓ toggleEnrollment — success, not found, semester closed
 *   ✓ deleteClass — success, not found, semester closed
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
  createClass,
  getAllClasses,
  getClassById,
  getClassesByLecturer,
  getClassesByCourse,
  getOpenClasses,
  updateClass,
  toggleEnrollment,
  deleteClass,
} = await import('../../src/modules/class/class.service.js');

// ─── Shared Data ─────────────────────────────────────────────
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

const baseLecturer = {
  id: LECTURER_ID,
  role: 'DOSEN',
};

const baseCourse = {
  id: COURSE_ID,
};

const baseClassData = {
  courseId: COURSE_ID,
  lecturerId: LECTURER_ID,
  academicSemesterId: SEMESTER_ID,
  section: 'A',
  schedule: 'Senin 08:00-10:00',
  room: 'R.301',
  capacity: 40,
  isEnrollmentOpen: false,
};

const baseClassResult = {
  id: CLASS_ID,
  section: 'A',
  schedule: 'Senin 08:00-10:00',
  room: 'R.301',
  capacity: 40,
  isEnrollmentOpen: false,
  academicSemesterId: SEMESTER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
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
    name: 'Dr. Budi Santoso',
    email: 'budi@untirta.ac.id',
  },
};

// ─── Tests ───────────────────────────────────────────────────

describe('ClassService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ═══════════════════════════════════════════════════════════
  // createClass
  // ═══════════════════════════════════════════════════════════
  describe('createClass', () => {
    it('should create a class successfully', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseLecturer);
      prismaMock.academicSemester.findUnique.mockResolvedValue(baseSemester);
      prismaMock.class.findUnique.mockResolvedValue(null); // no duplicate
      prismaMock.class.create.mockResolvedValue(baseClassResult);

      const result = await createClass(baseClassData);

      expect(prismaMock.course.findUnique).toHaveBeenCalledWith({
        where: { id: COURSE_ID },
        select: { id: true },
      });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: LECTURER_ID },
        select: { id: true, role: true },
      });
      expect(prismaMock.academicSemester.findUnique).toHaveBeenCalledWith({
        where: { id: SEMESTER_ID },
        select: { id: true, academicYear: true, semesterType: true, status: true },
      });
      expect(prismaMock.class.findUnique).toHaveBeenCalledWith({
        where: {
          courseId_academicSemesterId_section: {
            courseId: COURSE_ID,
            academicSemesterId: SEMESTER_ID,
            section: 'A',
          },
        },
        select: { id: true },
      });
      expect(prismaMock.class.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            courseId: COURSE_ID,
            lecturerId: LECTURER_ID,
            academicSemesterId: SEMESTER_ID,
            section: 'A',
          }),
        })
      );
      expect(result.id).toBe(CLASS_ID);
    });

    it('should use default capacity of 40 when not provided', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseLecturer);
      prismaMock.academicSemester.findUnique.mockResolvedValue(baseSemester);
      prismaMock.class.findUnique.mockResolvedValue(null);
      prismaMock.class.create.mockResolvedValue(baseClassResult);

      const dataWithoutCapacity = { ...baseClassData };
      delete dataWithoutCapacity.capacity;

      await createClass(dataWithoutCapacity);

      expect(prismaMock.class.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            capacity: 40,
          }),
        })
      );
    });

    it('should set null for schedule and room when not provided', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseLecturer);
      prismaMock.academicSemester.findUnique.mockResolvedValue(baseSemester);
      prismaMock.class.findUnique.mockResolvedValue(null);
      prismaMock.class.create.mockResolvedValue(baseClassResult);

      const { schedule, room, ...dataWithoutOptionals } = baseClassData;
      await createClass(dataWithoutOptionals);

      expect(prismaMock.class.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schedule: null,
            room: null,
          }),
        })
      );
    });

    it('should throw when course not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      await expect(createClass(baseClassData)).rejects.toThrow(
        'Mata kuliah tidak ditemukan'
      );
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw when lecturer not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(createClass(baseClassData)).rejects.toThrow(
        'Dosen tidak ditemukan'
      );
      expect(prismaMock.academicSemester.findUnique).not.toHaveBeenCalled();
    });

    it('should throw when selected user is not a dosen', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue({ id: LECTURER_ID, role: 'MAHASISWA' });

      await expect(createClass(baseClassData)).rejects.toThrow(
        'User yang dipilih bukan dosen'
      );
      expect(prismaMock.academicSemester.findUnique).not.toHaveBeenCalled();
    });

    it('should throw when academic semester not found', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseLecturer);
      prismaMock.academicSemester.findUnique.mockResolvedValue(null);

      await expect(createClass(baseClassData)).rejects.toThrow(
        'Semester akademik tidak ditemukan'
      );
      expect(prismaMock.class.findUnique).not.toHaveBeenCalled();
    });

    it('should throw when semester is CLOSED', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseLecturer);
      prismaMock.academicSemester.findUnique.mockResolvedValue({
        ...baseSemester,
        status: 'CLOSED',
      });

      await expect(createClass(baseClassData)).rejects.toThrow(
        'Tidak dapat menambahkan kelas pada semester yang sudah CLOSED'
      );
      expect(prismaMock.class.findUnique).not.toHaveBeenCalled();
    });

    it('should throw when duplicate class exists', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseLecturer);
      prismaMock.academicSemester.findUnique.mockResolvedValue(baseSemester);
      prismaMock.class.findUnique.mockResolvedValue({ id: 'existing-class-id' });

      await expect(createClass(baseClassData)).rejects.toThrow(
        `Kelas A untuk mata kuliah ini di semester GANJIL 2025/2026 sudah ada`
      );
      expect(prismaMock.class.create).not.toHaveBeenCalled();
    });

    it('should allow creating class on DRAFT semester', async () => {
      prismaMock.course.findUnique.mockResolvedValue(baseCourse);
      prismaMock.user.findUnique.mockResolvedValue(baseLecturer);
      prismaMock.academicSemester.findUnique.mockResolvedValue({
        ...baseSemester,
        status: 'DRAFT',
      });
      prismaMock.class.findUnique.mockResolvedValue(null);
      prismaMock.class.create.mockResolvedValue(baseClassResult);

      const result = await createClass(baseClassData);
      expect(result.id).toBe(CLASS_ID);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getAllClasses
  // ═══════════════════════════════════════════════════════════
  describe('getAllClasses', () => {
    it('should return all classes without filters', async () => {
      const classes = [baseClassResult];
      prismaMock.class.findMany.mockResolvedValue(classes);
      prismaMock.class.count.mockResolvedValue(1);

      const result = await getAllClasses();

      expect(prismaMock.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
      expect(result.data).toEqual(classes);
    });

    it('should apply academicSemesterId filter', async () => {
      prismaMock.class.findMany.mockResolvedValue([]);

      await getAllClasses({ academicSemesterId: SEMESTER_ID });

      expect(prismaMock.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { academicSemesterId: SEMESTER_ID },
        })
      );
    });

    it('should apply courseId filter', async () => {
      prismaMock.class.findMany.mockResolvedValue([]);

      await getAllClasses({ courseId: COURSE_ID });

      expect(prismaMock.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { courseId: COURSE_ID },
        })
      );
    });

    it('should apply both filters simultaneously', async () => {
      prismaMock.class.findMany.mockResolvedValue([]);

      await getAllClasses({ academicSemesterId: SEMESTER_ID, courseId: COURSE_ID });

      expect(prismaMock.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { academicSemesterId: SEMESTER_ID, courseId: COURSE_ID },
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getClassById
  // ═══════════════════════════════════════════════════════════
  describe('getClassById', () => {
    it('should return class by ID', async () => {
      prismaMock.class.findUnique.mockResolvedValue(baseClassResult);

      const result = await getClassById(CLASS_ID);

      expect(prismaMock.class.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: CLASS_ID } })
      );
      expect(result).toEqual(baseClassResult);
    });

    it('should throw when class not found', async () => {
      prismaMock.class.findUnique.mockResolvedValue(null);

      await expect(getClassById('nonexistent-id')).rejects.toThrow(
        'Kelas offering tidak ditemukan'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getClassesByLecturer
  // ═══════════════════════════════════════════════════════════
  describe('getClassesByLecturer', () => {
    it('should return classes for a lecturer', async () => {
      const classes = [baseClassResult];
      prismaMock.class.findMany.mockResolvedValue(classes);

      const result = await getClassesByLecturer(LECTURER_ID);

      expect(prismaMock.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { lecturerId: LECTURER_ID },
        })
      );
      expect(result).toEqual(classes);
    });

    it('should apply academicSemesterId filter', async () => {
      prismaMock.class.findMany.mockResolvedValue([]);

      await getClassesByLecturer(LECTURER_ID, { academicSemesterId: SEMESTER_ID });

      expect(prismaMock.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { lecturerId: LECTURER_ID, academicSemesterId: SEMESTER_ID },
        })
      );
    });

    it('should return empty array when lecturer has no classes', async () => {
      prismaMock.class.findMany.mockResolvedValue([]);

      const result = await getClassesByLecturer('no-classes-lecturer');
      expect(result).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getClassesByCourse
  // ═══════════════════════════════════════════════════════════
  describe('getClassesByCourse', () => {
    it('should return classes for a course', async () => {
      const classes = [baseClassResult];
      prismaMock.class.findMany.mockResolvedValue(classes);

      const result = await getClassesByCourse(COURSE_ID);

      expect(prismaMock.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { courseId: COURSE_ID },
        })
      );
      expect(result).toEqual(classes);
    });

    it('should apply academicSemesterId filter', async () => {
      prismaMock.class.findMany.mockResolvedValue([]);

      await getClassesByCourse(COURSE_ID, { academicSemesterId: SEMESTER_ID });

      expect(prismaMock.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { courseId: COURSE_ID, academicSemesterId: SEMESTER_ID },
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════
  // getOpenClasses
  // ═══════════════════════════════════════════════════════════
  describe('getOpenClasses', () => {
    it('should return only open enrollment classes', async () => {
      const openClasses = [{ ...baseClassResult, isEnrollmentOpen: true }];
      prismaMock.class.findMany.mockResolvedValue(openClasses);

      const result = await getOpenClasses();

      expect(prismaMock.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isEnrollmentOpen: true },
        })
      );
      expect(result).toEqual(openClasses);
    });

    it('should apply academicSemesterId filter', async () => {
      prismaMock.class.findMany.mockResolvedValue([]);

      await getOpenClasses({ academicSemesterId: SEMESTER_ID });

      expect(prismaMock.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isEnrollmentOpen: true, academicSemesterId: SEMESTER_ID },
        })
      );
    });

    it('should apply courseId filter', async () => {
      prismaMock.class.findMany.mockResolvedValue([]);

      await getOpenClasses({ courseId: COURSE_ID });

      expect(prismaMock.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isEnrollmentOpen: true, courseId: COURSE_ID },
        })
      );
    });

    it('should apply both filters simultaneously', async () => {
      prismaMock.class.findMany.mockResolvedValue([]);

      await getOpenClasses({ academicSemesterId: SEMESTER_ID, courseId: COURSE_ID });

      expect(prismaMock.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isEnrollmentOpen: true,
            academicSemesterId: SEMESTER_ID,
            courseId: COURSE_ID,
          },
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════
  // updateClass
  // ═══════════════════════════════════════════════════════════
  describe('updateClass', () => {
    const existingClass = {
      id: CLASS_ID,
      courseId: COURSE_ID,
      academicSemesterId: SEMESTER_ID,
      section: 'A',
      academicSemester: { status: 'OPEN' },
    };

    it('should update a class successfully', async () => {
      prismaMock.class.findUnique.mockResolvedValueOnce(existingClass);
      prismaMock.class.update.mockResolvedValue({
        ...baseClassResult,
        schedule: 'Selasa 10:00-12:00',
      });

      const result = await updateClass(CLASS_ID, { schedule: 'Selasa 10:00-12:00' });

      expect(prismaMock.class.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: CLASS_ID },
          data: { schedule: 'Selasa 10:00-12:00' },
        })
      );
      expect(result.schedule).toBe('Selasa 10:00-12:00');
    });

    it('should throw when class not found', async () => {
      prismaMock.class.findUnique.mockResolvedValue(null);

      await expect(updateClass('nonexistent-id', { room: 'R.102' })).rejects.toThrow(
        'Kelas offering tidak ditemukan'
      );
    });

    it('should throw when semester is CLOSED', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        ...existingClass,
        academicSemester: { status: 'CLOSED' },
      });

      await expect(updateClass(CLASS_ID, { room: 'R.102' })).rejects.toThrow(
        'Tidak dapat mengubah kelas pada semester yang sudah CLOSED'
      );
    });

    it('should validate new lecturer when lecturerId is changed', async () => {
      const newLecturerId = 'new-lecturer-uuid';
      prismaMock.class.findUnique.mockResolvedValueOnce(existingClass);
      prismaMock.user.findUnique.mockResolvedValue({ id: newLecturerId, role: 'DOSEN' });
      prismaMock.class.update.mockResolvedValue({
        ...baseClassResult,
        lecturer: { id: newLecturerId, name: 'New Dosen', email: 'new@untirta.ac.id' },
      });

      const result = await updateClass(CLASS_ID, { lecturerId: newLecturerId });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: newLecturerId },
        select: { id: true, role: true },
      });
      expect(result).toBeDefined();
    });

    it('should throw when new lecturer not found', async () => {
      prismaMock.class.findUnique.mockResolvedValueOnce(existingClass);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        updateClass(CLASS_ID, { lecturerId: 'nonexistent-lecturer' })
      ).rejects.toThrow('Dosen tidak ditemukan');
    });

    it('should throw when new lecturer is not a dosen', async () => {
      prismaMock.class.findUnique.mockResolvedValueOnce(existingClass);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'student-id',
        role: 'MAHASISWA',
      });

      await expect(
        updateClass(CLASS_ID, { lecturerId: 'student-id' })
      ).rejects.toThrow('User yang dipilih bukan dosen');
    });

    it('should validate new academic semester when changed', async () => {
      const newSemesterId = 'new-semester-uuid';
      prismaMock.class.findUnique
        .mockResolvedValueOnce(existingClass)     // main lookup
        .mockResolvedValueOnce(null);              // duplicate check
      prismaMock.academicSemester.findUnique.mockResolvedValue({ id: newSemesterId });
      prismaMock.class.update.mockResolvedValue(baseClassResult);

      await updateClass(CLASS_ID, { academicSemesterId: newSemesterId });

      expect(prismaMock.academicSemester.findUnique).toHaveBeenCalledWith({
        where: { id: newSemesterId },
        select: { id: true },
      });
    });

    it('should throw when new academic semester not found', async () => {
      prismaMock.class.findUnique.mockResolvedValueOnce(existingClass);
      prismaMock.academicSemester.findUnique.mockResolvedValue(null);

      await expect(
        updateClass(CLASS_ID, { academicSemesterId: 'nonexistent-semester' })
      ).rejects.toThrow('Semester akademik tidak ditemukan');
    });

    it('should check uniqueness when section is changed', async () => {
      prismaMock.class.findUnique
        .mockResolvedValueOnce(existingClass)     // main lookup
        .mockResolvedValueOnce(null);              // no duplicate
      prismaMock.class.update.mockResolvedValue({ ...baseClassResult, section: 'B' });

      const result = await updateClass(CLASS_ID, { section: 'B' });

      // Should check for duplicates with the new section
      expect(prismaMock.class.findUnique).toHaveBeenCalledTimes(2);
      expect(result.section).toBe('B');
    });

    it('should throw when section change creates duplicate', async () => {
      prismaMock.class.findUnique
        .mockResolvedValueOnce(existingClass)     // main lookup
        .mockResolvedValueOnce({ id: 'other-class-id' }); // duplicate exists

      await expect(updateClass(CLASS_ID, { section: 'B' })).rejects.toThrow(
        'Kelas B untuk mata kuliah ini di semester ini sudah ada'
      );
      expect(prismaMock.class.update).not.toHaveBeenCalled();
    });

    it('should skip uniqueness check when unique fields are unchanged', async () => {
      prismaMock.class.findUnique.mockResolvedValueOnce(existingClass);
      prismaMock.class.update.mockResolvedValue(baseClassResult);

      // Only updating non-unique fields
      await updateClass(CLASS_ID, { room: 'R.501', schedule: 'Kamis 14:00' });

      // findUnique called only once (main lookup), no duplicate check
      expect(prismaMock.class.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should allow updating same class to its own section (no false positive)', async () => {
      const newSemesterId = 'new-sem-id';
      prismaMock.class.findUnique
        .mockResolvedValueOnce(existingClass)      // main lookup
        .mockResolvedValueOnce({ id: CLASS_ID });  // duplicate check finds itself
      prismaMock.academicSemester.findUnique.mockResolvedValue({ id: newSemesterId });
      prismaMock.class.update.mockResolvedValue(baseClassResult);

      // Change semester — duplicate check finds the same class ID, so no error
      const result = await updateClass(CLASS_ID, { academicSemesterId: newSemesterId });

      expect(prismaMock.class.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // toggleEnrollment
  // ═══════════════════════════════════════════════════════════
  describe('toggleEnrollment', () => {
    it('should open enrollment successfully', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: CLASS_ID,
        academicSemester: { status: 'OPEN' },
      });
      prismaMock.class.update.mockResolvedValue({
        ...baseClassResult,
        isEnrollmentOpen: true,
      });

      const result = await toggleEnrollment(CLASS_ID, true);

      expect(prismaMock.class.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: CLASS_ID },
          data: { isEnrollmentOpen: true },
        })
      );
      expect(result.isEnrollmentOpen).toBe(true);
    });

    it('should close enrollment successfully', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: CLASS_ID,
        academicSemester: { status: 'OPEN' },
      });
      prismaMock.class.update.mockResolvedValue({
        ...baseClassResult,
        isEnrollmentOpen: false,
      });

      const result = await toggleEnrollment(CLASS_ID, false);

      expect(prismaMock.class.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isEnrollmentOpen: false },
        })
      );
      expect(result.isEnrollmentOpen).toBe(false);
    });

    it('should throw when class not found', async () => {
      prismaMock.class.findUnique.mockResolvedValue(null);

      await expect(toggleEnrollment('nonexistent-id', true)).rejects.toThrow(
        'Kelas offering tidak ditemukan'
      );
    });

    it('should throw when semester is CLOSED', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: CLASS_ID,
        academicSemester: { status: 'CLOSED' },
      });

      await expect(toggleEnrollment(CLASS_ID, true)).rejects.toThrow(
        'Tidak dapat mengubah status enrollment pada semester yang sudah CLOSED'
      );
    });

    it('should allow toggling on DRAFT semester', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: CLASS_ID,
        academicSemester: { status: 'DRAFT' },
      });
      prismaMock.class.update.mockResolvedValue({
        ...baseClassResult,
        isEnrollmentOpen: true,
      });

      const result = await toggleEnrollment(CLASS_ID, true);
      expect(result.isEnrollmentOpen).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // deleteClass
  // ═══════════════════════════════════════════════════════════
  describe('deleteClass', () => {
    it('should delete a class successfully', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: CLASS_ID,
        section: 'A',
        course: { title: 'Pemrograman Web', code: 'IF-101' },
        academicSemester: { status: 'OPEN' },
      });
      prismaMock.class.delete.mockResolvedValue({});

      const result = await deleteClass(CLASS_ID);

      expect(prismaMock.class.delete).toHaveBeenCalledWith({
        where: { id: CLASS_ID },
      });
      expect(result.message).toBe('Kelas A - IF-101 berhasil dihapus');
      expect(result.deletedId).toBe(CLASS_ID);
    });

    it('should throw when class not found', async () => {
      prismaMock.class.findUnique.mockResolvedValue(null);

      await expect(deleteClass('nonexistent-id')).rejects.toThrow(
        'Kelas offering tidak ditemukan'
      );
      expect(prismaMock.class.delete).not.toHaveBeenCalled();
    });

    it('should throw when semester is CLOSED', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: CLASS_ID,
        section: 'A',
        course: { title: 'Pemrograman Web', code: 'IF-101' },
        academicSemester: { status: 'CLOSED' },
      });

      await expect(deleteClass(CLASS_ID)).rejects.toThrow(
        'Tidak dapat menghapus kelas pada semester yang sudah CLOSED'
      );
      expect(prismaMock.class.delete).not.toHaveBeenCalled();
    });

    it('should allow deleting class on DRAFT semester', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: CLASS_ID,
        section: 'B',
        course: { title: 'Algoritma', code: 'IF-201' },
        academicSemester: { status: 'DRAFT' },
      });
      prismaMock.class.delete.mockResolvedValue({});

      const result = await deleteClass(CLASS_ID);

      expect(result.message).toBe('Kelas B - IF-201 berhasil dihapus');
    });

    it('should include correct course code in success message', async () => {
      prismaMock.class.findUnique.mockResolvedValue({
        id: CLASS_ID,
        section: 'C',
        course: { title: 'Basis Data', code: 'IF-301' },
        academicSemester: { status: 'OPEN' },
      });
      prismaMock.class.delete.mockResolvedValue({});

      const result = await deleteClass(CLASS_ID);
      expect(result.message).toContain('IF-301');
      expect(result.message).toContain('Kelas C');
    });
  });
});
