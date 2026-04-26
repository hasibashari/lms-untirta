/**
 * Grade Service — Unit Tests
 *
 * Tests all grade service functions in isolation using a mocked Prisma client.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismaMock } from '../helpers/prisma-mock.js';

// ── Prisma mock setup ──
const prismaMock = createPrismaMock();
jest.unstable_mockModule('../../src/config/prisma.js', () => ({ default: prismaMock }));
const gradeService = await import('../../src/modules/grade/grade.service.js');

// ── Helpers ──
const LECTURER_ID = 'lecturer-1';
const STUDENT_ID = 'student-1';
const CLASS_ID = 'class-1';
const SEMESTER_ID = 'sem-1';

const makeClassData = (overrides = {}) => ({
  id: CLASS_ID,
  lecturerId: LECTURER_ID,
  section: 'A',
  academicSemesterId: SEMESTER_ID,
  academicSemester: { id: SEMESTER_ID, academicYear: '2025/2026', semesterType: 'GANJIL', status: 'OPEN' },
  course: { id: 'course-1', title: 'Algoritma', code: 'IF101', sks: 3 },
  ...overrides,
});

const makeEnrollment = (studentId = STUDENT_ID) => ({
  studentId,
  student: { id: studentId, name: `Student ${studentId}`, email: `${studentId}@test.com` },
});

const makeGrade = (studentId = STUDENT_ID, overrides = {}) => ({
  id: `grade-${studentId}`,
  studentId,
  letterGrade: 'A',
  gradePoint: 4.0,
  numericScore: 90,
  status: 'DRAFT',
  note: null,
  updatedAt: new Date(),
  ...overrides,
});

describe('GradeService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Restore $transaction default behavior
    prismaMock.$transaction.mockImplementation((fns) => {
      if (Array.isArray(fns)) return Promise.all(fns);
      if (typeof fns === 'function') return fns(prismaMock);
      return Promise.resolve();
    });
  });

  // ════════════════════════════════════════════════════════
  // getClassStudentsForGrading
  // ════════════════════════════════════════════════════════
  describe('getClassStudentsForGrading', () => {
    it('should return students with their grades', async () => {
      const classData = makeClassData();
      prismaMock.class.findUnique.mockResolvedValue(classData);
      prismaMock.krsEnrollment.findMany.mockResolvedValue([makeEnrollment()]);
      prismaMock.finalGrade.findMany.mockResolvedValue([makeGrade()]);

      const result = await gradeService.getClassStudentsForGrading(CLASS_ID, LECTURER_ID);

      expect(result.class).toEqual(classData);
      expect(result.semesterStatus).toBe('OPEN');
      expect(result.students).toHaveLength(1);
      expect(result.students[0].student.id).toBe(STUDENT_ID);
      expect(result.students[0].grade).not.toBeNull();
      expect(result.summary.totalStudents).toBe(1);
      expect(result.summary.graded).toBe(1);
    });

    it('should return students without grades when no grades exist', async () => {
      prismaMock.class.findUnique.mockResolvedValue(makeClassData());
      prismaMock.krsEnrollment.findMany.mockResolvedValue([makeEnrollment()]);
      prismaMock.finalGrade.findMany.mockResolvedValue([]);

      const result = await gradeService.getClassStudentsForGrading(CLASS_ID, LECTURER_ID);

      expect(result.students[0].grade).toBeNull();
      expect(result.summary.graded).toBe(0);
      expect(result.summary.draft).toBe(0);
      expect(result.summary.finalized).toBe(0);
    });

    it('should return empty students list for class with no enrollments', async () => {
      prismaMock.class.findUnique.mockResolvedValue(makeClassData());
      prismaMock.krsEnrollment.findMany.mockResolvedValue([]);
      prismaMock.finalGrade.findMany.mockResolvedValue([]);

      const result = await gradeService.getClassStudentsForGrading(CLASS_ID, LECTURER_ID);

      expect(result.students).toHaveLength(0);
      expect(result.summary.totalStudents).toBe(0);
    });

    it('should count draft vs finalized grades in summary', async () => {
      prismaMock.class.findUnique.mockResolvedValue(makeClassData());
      prismaMock.krsEnrollment.findMany.mockResolvedValue([
        makeEnrollment('s1'), makeEnrollment('s2'), makeEnrollment('s3'),
      ]);
      prismaMock.finalGrade.findMany.mockResolvedValue([
        makeGrade('s1', { status: 'DRAFT' }),
        makeGrade('s2', { status: 'FINALIZED' }),
        makeGrade('s3', { status: 'FINALIZED' }),
      ]);

      const result = await gradeService.getClassStudentsForGrading(CLASS_ID, LECTURER_ID);

      expect(result.summary.graded).toBe(3);
      expect(result.summary.draft).toBe(1);
      expect(result.summary.finalized).toBe(2);
    });

    it('should handle null semesterStatus gracefully', async () => {
      prismaMock.class.findUnique.mockResolvedValue(
        makeClassData({ academicSemester: null })
      );
      prismaMock.krsEnrollment.findMany.mockResolvedValue([]);
      prismaMock.finalGrade.findMany.mockResolvedValue([]);

      const result = await gradeService.getClassStudentsForGrading(CLASS_ID, LECTURER_ID);

      expect(result.semesterStatus).toBeNull();
    });

    it('should throw if class not found', async () => {
      prismaMock.class.findUnique.mockResolvedValue(null);

      await expect(
        gradeService.getClassStudentsForGrading(CLASS_ID, LECTURER_ID)
      ).rejects.toThrow('Kelas tidak ditemukan');
    });

    it('should throw if lecturer does not own class', async () => {
      prismaMock.class.findUnique.mockResolvedValue(
        makeClassData({ lecturerId: 'other-lecturer' })
      );

      await expect(
        gradeService.getClassStudentsForGrading(CLASS_ID, LECTURER_ID)
      ).rejects.toThrow('Anda tidak berhak mengakses kelas ini');
    });
  });

  // ════════════════════════════════════════════════════════
  // inputGrade
  // ════════════════════════════════════════════════════════
  describe('inputGrade', () => {
    const gradeData = { studentId: STUDENT_ID, letterGrade: 'A', numericScore: 90, note: 'Excellent' };

    it('should create a new grade successfully', async () => {
      prismaMock.class.findUnique.mockResolvedValue(makeClassData());
      prismaMock.krsEnrollment.findFirst.mockResolvedValue({ studentId: STUDENT_ID });
      prismaMock.finalGrade.findUnique.mockResolvedValue(null); // No existing grade
      prismaMock.finalGrade.upsert.mockResolvedValue({
        id: 'grade-1', studentId: STUDENT_ID, letterGrade: 'A', gradePoint: 4.0,
        numericScore: 90, status: 'DRAFT', note: 'Excellent',
        student: { name: 'Student', email: 'student@test.com' },
      });

      const result = await gradeService.inputGrade(CLASS_ID, LECTURER_ID, gradeData);

      expect(result.letterGrade).toBe('A');
      expect(result.gradePoint).toBe(4.0);
      expect(result.status).toBe('DRAFT');
      expect(prismaMock.finalGrade.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { studentId_classId: { studentId: STUDENT_ID, classId: CLASS_ID } },
          create: expect.objectContaining({
            letterGrade: 'A',
            gradePoint: 4.0,
            status: 'DRAFT',
          }),
        })
      );
    });

    it('should update an existing draft grade', async () => {
      prismaMock.class.findUnique.mockResolvedValue(makeClassData());
      prismaMock.krsEnrollment.findFirst.mockResolvedValue({ studentId: STUDENT_ID });
      prismaMock.finalGrade.findUnique.mockResolvedValue(makeGrade(STUDENT_ID, { status: 'DRAFT' }));
      prismaMock.finalGrade.upsert.mockResolvedValue({
        id: 'grade-1', studentId: STUDENT_ID, letterGrade: 'B+', gradePoint: 3.3,
        numericScore: 85, status: 'DRAFT', note: null,
        student: { name: 'Student', email: 'student@test.com' },
      });

      const result = await gradeService.inputGrade(CLASS_ID, LECTURER_ID, {
        studentId: STUDENT_ID, letterGrade: 'B+', numericScore: 85,
      });

      expect(result.letterGrade).toBe('B+');
      expect(result.gradePoint).toBe(3.3);
    });

    it('should allow grade input when semester status is null', async () => {
      prismaMock.class.findUnique.mockResolvedValue(
        makeClassData({ academicSemester: null })
      );
      prismaMock.krsEnrollment.findFirst.mockResolvedValue({ studentId: STUDENT_ID });
      prismaMock.finalGrade.findUnique.mockResolvedValue(null);
      prismaMock.finalGrade.upsert.mockResolvedValue({
        id: 'grade-1', letterGrade: 'A', gradePoint: 4.0, status: 'DRAFT',
        student: { name: 'Student', email: 's@test.com' },
      });

      const result = await gradeService.inputGrade(CLASS_ID, LECTURER_ID, gradeData);

      expect(result.letterGrade).toBe('A');
    });

    it('should map grade points correctly for various letter grades', async () => {
      const mapping = [
        ['A', 4.0], ['A-', 3.7], ['B+', 3.3], ['B', 3.0], ['B-', 2.7],
        ['C+', 2.3], ['C', 2.0], ['D', 1.0], ['E', 0.0],
      ];

      for (const [letter, expectedPoint] of mapping) {
        jest.resetAllMocks();
        prismaMock.class.findUnique.mockResolvedValue(makeClassData());
        prismaMock.krsEnrollment.findFirst.mockResolvedValue({ studentId: STUDENT_ID });
        prismaMock.finalGrade.findUnique.mockResolvedValue(null);
        prismaMock.finalGrade.upsert.mockResolvedValue({
          letterGrade: letter, gradePoint: expectedPoint, status: 'DRAFT',
          student: { name: 'Student', email: 's@t.com' },
        });

        await gradeService.inputGrade(CLASS_ID, LECTURER_ID, {
          studentId: STUDENT_ID, letterGrade: letter,
        });

        expect(prismaMock.finalGrade.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            create: expect.objectContaining({ gradePoint: expectedPoint }),
          })
        );
      }
    });

    it('should set numericScore and note to null when not provided', async () => {
      prismaMock.class.findUnique.mockResolvedValue(makeClassData());
      prismaMock.krsEnrollment.findFirst.mockResolvedValue({ studentId: STUDENT_ID });
      prismaMock.finalGrade.findUnique.mockResolvedValue(null);
      prismaMock.finalGrade.upsert.mockResolvedValue({
        letterGrade: 'A', gradePoint: 4.0, status: 'DRAFT',
        student: { name: 'Student', email: 's@t.com' },
      });

      await gradeService.inputGrade(CLASS_ID, LECTURER_ID, {
        studentId: STUDENT_ID, letterGrade: 'A',
      });

      expect(prismaMock.finalGrade.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ numericScore: null, note: null }),
          update: expect.objectContaining({ numericScore: null, note: null }),
        })
      );
    });

    it('should throw if class not found', async () => {
      prismaMock.class.findUnique.mockResolvedValue(null);

      await expect(
        gradeService.inputGrade(CLASS_ID, LECTURER_ID, gradeData)
      ).rejects.toThrow('Kelas tidak ditemukan');
    });

    it('should throw if lecturer does not own class', async () => {
      prismaMock.class.findUnique.mockResolvedValue(
        makeClassData({ lecturerId: 'other-lecturer' })
      );

      await expect(
        gradeService.inputGrade(CLASS_ID, LECTURER_ID, gradeData)
      ).rejects.toThrow('Anda tidak berhak memberikan nilai untuk kelas ini');
    });

    it('should throw if semester is not OPEN', async () => {
      prismaMock.class.findUnique.mockResolvedValue(
        makeClassData({ academicSemester: { status: 'CLOSED' } })
      );

      await expect(
        gradeService.inputGrade(CLASS_ID, LECTURER_ID, gradeData)
      ).rejects.toThrow('Tidak dapat input nilai saat status semester CLOSED');
    });

    it('should throw if semester is DRAFT', async () => {
      prismaMock.class.findUnique.mockResolvedValue(
        makeClassData({ academicSemester: { status: 'DRAFT' } })
      );

      await expect(
        gradeService.inputGrade(CLASS_ID, LECTURER_ID, gradeData)
      ).rejects.toThrow('Tidak dapat input nilai saat status semester DRAFT');
    });

    it('should throw if student is not enrolled', async () => {
      prismaMock.class.findUnique.mockResolvedValue(makeClassData());
      prismaMock.krsEnrollment.findFirst.mockResolvedValue(null);

      await expect(
        gradeService.inputGrade(CLASS_ID, LECTURER_ID, gradeData)
      ).rejects.toThrow('Mahasiswa tidak terdaftar di kelas ini');
    });

    it('should throw if existing grade is finalized', async () => {
      prismaMock.class.findUnique.mockResolvedValue(makeClassData());
      prismaMock.krsEnrollment.findFirst.mockResolvedValue({ studentId: STUDENT_ID });
      prismaMock.finalGrade.findUnique.mockResolvedValue(
        makeGrade(STUDENT_ID, { status: 'FINALIZED' })
      );

      await expect(
        gradeService.inputGrade(CLASS_ID, LECTURER_ID, gradeData)
      ).rejects.toThrow('Nilai sudah difinalisasi dan tidak dapat diubah');
    });
  });

  // ════════════════════════════════════════════════════════
  // bulkInputGrades
  // ════════════════════════════════════════════════════════
  describe('bulkInputGrades', () => {
    const bulkGrades = [
      { studentId: 's1', letterGrade: 'A', numericScore: 95 },
      { studentId: 's2', letterGrade: 'B+', numericScore: 85 },
    ];

    it('should create grades for multiple students', async () => {
      prismaMock.class.findUnique.mockResolvedValue(makeClassData());
      prismaMock.krsEnrollment.findMany.mockResolvedValue([
        { studentId: 's1' }, { studentId: 's2' },
      ]);
      prismaMock.finalGrade.findMany.mockResolvedValue([]); // No finalized
      prismaMock.finalGrade.upsert.mockResolvedValue({ id: 'g1' });
      prismaMock.$transaction.mockResolvedValue([{ id: 'g1' }, { id: 'g2' }]);

      const result = await gradeService.bulkInputGrades(CLASS_ID, LECTURER_ID, bulkGrades);

      expect(result.message).toContain('2 nilai berhasil disimpan');
      expect(result.count).toBe(2);
    });

    it('should throw if class not found', async () => {
      prismaMock.class.findUnique.mockResolvedValue(null);

      await expect(
        gradeService.bulkInputGrades(CLASS_ID, LECTURER_ID, bulkGrades)
      ).rejects.toThrow('Kelas tidak ditemukan');
    });

    it('should throw if lecturer does not own class', async () => {
      prismaMock.class.findUnique.mockResolvedValue(
        makeClassData({ lecturerId: 'other-lecturer' })
      );

      await expect(
        gradeService.bulkInputGrades(CLASS_ID, LECTURER_ID, bulkGrades)
      ).rejects.toThrow('Anda tidak berhak memberikan nilai untuk kelas ini');
    });

    it('should throw if semester is not OPEN', async () => {
      prismaMock.class.findUnique.mockResolvedValue(
        makeClassData({ academicSemester: { status: 'CLOSED' } })
      );

      await expect(
        gradeService.bulkInputGrades(CLASS_ID, LECTURER_ID, bulkGrades)
      ).rejects.toThrow('Tidak dapat input nilai saat status semester CLOSED');
    });

    it('should throw if some students are not enrolled', async () => {
      prismaMock.class.findUnique.mockResolvedValue(makeClassData());
      prismaMock.krsEnrollment.findMany.mockResolvedValue([{ studentId: 's1' }]); // s2 not enrolled

      await expect(
        gradeService.bulkInputGrades(CLASS_ID, LECTURER_ID, bulkGrades)
      ).rejects.toThrow('1 mahasiswa tidak terdaftar di kelas ini');
    });

    it('should throw if some grades are already finalized', async () => {
      prismaMock.class.findUnique.mockResolvedValue(makeClassData());
      prismaMock.krsEnrollment.findMany.mockResolvedValue([
        { studentId: 's1' }, { studentId: 's2' },
      ]);
      prismaMock.finalGrade.findMany.mockResolvedValue([{ studentId: 's1' }]);

      await expect(
        gradeService.bulkInputGrades(CLASS_ID, LECTURER_ID, bulkGrades)
      ).rejects.toThrow('1 nilai sudah difinalisasi dan tidak dapat diubah');
    });

    it('should allow bulk input when semester status is null', async () => {
      prismaMock.class.findUnique.mockResolvedValue(
        makeClassData({ academicSemester: null })
      );
      prismaMock.krsEnrollment.findMany.mockResolvedValue([
        { studentId: 's1' }, { studentId: 's2' },
      ]);
      prismaMock.finalGrade.findMany.mockResolvedValue([]);
      prismaMock.$transaction.mockResolvedValue([{ id: 'g1' }, { id: 'g2' }]);

      const result = await gradeService.bulkInputGrades(CLASS_ID, LECTURER_ID, bulkGrades);

      expect(result.count).toBe(2);
    });
  });

  // ════════════════════════════════════════════════════════
  // finalizeGrades
  // ════════════════════════════════════════════════════════
  describe('finalizeGrades', () => {
    it('should finalize all draft grades', async () => {
      prismaMock.class.findUnique.mockResolvedValue(makeClassData());
      prismaMock.finalGrade.findMany.mockResolvedValue([
        { id: 'g1' }, { id: 'g2' },
      ]);
      prismaMock.finalGrade.updateMany.mockResolvedValue({ count: 2 });

      const result = await gradeService.finalizeGrades(CLASS_ID, LECTURER_ID);

      expect(result.message).toContain('2 nilai berhasil difinalisasi');
      expect(result.count).toBe(2);
      expect(prismaMock.finalGrade.updateMany).toHaveBeenCalledWith({
        where: { classId: CLASS_ID, status: 'DRAFT' },
        data: { status: 'FINALIZED' },
      });
    });

    it('should throw if class not found', async () => {
      prismaMock.class.findUnique.mockResolvedValue(null);

      await expect(
        gradeService.finalizeGrades(CLASS_ID, LECTURER_ID)
      ).rejects.toThrow('Kelas tidak ditemukan');
    });

    it('should throw if lecturer does not own class', async () => {
      prismaMock.class.findUnique.mockResolvedValue(
        makeClassData({ lecturerId: 'other-lecturer' })
      );

      await expect(
        gradeService.finalizeGrades(CLASS_ID, LECTURER_ID)
      ).rejects.toThrow('Anda tidak berhak memfinalisasi nilai untuk kelas ini');
    });

    it('should throw if semester is not OPEN', async () => {
      prismaMock.class.findUnique.mockResolvedValue(
        makeClassData({ academicSemester: { status: 'CLOSED' } })
      );

      await expect(
        gradeService.finalizeGrades(CLASS_ID, LECTURER_ID)
      ).rejects.toThrow('Tidak dapat memfinalisasi nilai saat status semester CLOSED');
    });

    it('should allow finalize when semester status is null', async () => {
      prismaMock.class.findUnique.mockResolvedValue(
        makeClassData({ academicSemester: null })
      );
      prismaMock.finalGrade.findMany.mockResolvedValue([{ id: 'g1' }]);
      prismaMock.finalGrade.updateMany.mockResolvedValue({ count: 1 });

      const result = await gradeService.finalizeGrades(CLASS_ID, LECTURER_ID);

      expect(result.count).toBe(1);
    });

    it('should throw if no draft grades exist', async () => {
      prismaMock.class.findUnique.mockResolvedValue(makeClassData());
      prismaMock.finalGrade.findMany.mockResolvedValue([]);

      await expect(
        gradeService.finalizeGrades(CLASS_ID, LECTURER_ID)
      ).rejects.toThrow('Tidak ada nilai draft untuk difinalisasi');
    });
  });

  // ════════════════════════════════════════════════════════
  // getMyGrades
  // ════════════════════════════════════════════════════════
  describe('getMyGrades', () => {
    const makeFinalGrade = (letterGrade, gradePoint, sks = 3) => ({
      id: `grade-${Math.random().toString(36).slice(2)}`,
      letterGrade,
      gradePoint,
      numericScore: 85,
      status: 'FINALIZED',
      note: null,
      updatedAt: new Date(),
      class: {
        id: 'class-1',
        section: 'A',
        academicSemesterId: SEMESTER_ID,
        academicSemester: { academicYear: '2025/2026', semesterType: 'GANJIL' },
        course: { id: 'c1', title: 'Algo', code: 'IF101', semester: 1, sks },
        lecturer: { id: LECTURER_ID, name: 'Dosen' },
      },
      academicSemester: { id: SEMESTER_ID, academicYear: '2025/2026', semesterType: 'GANJIL', status: 'CLOSED' },
    });

    it('should return grades with GPA summary', async () => {
      const grades = [
        makeFinalGrade('A', 4.0, 3),  // 4.0 * 3 = 12
        makeFinalGrade('B', 3.0, 3),  // 3.0 * 3 = 9
      ];
      prismaMock.finalGrade.findMany.mockResolvedValue(grades);

      const result = await gradeService.getMyGrades(STUDENT_ID);

      expect(result.grades).toHaveLength(2);
      expect(result.summary.totalCourses).toBe(2);
      expect(result.summary.totalSKS).toBe(6);
      // IPK = (12 + 9) / 6 = 3.5
      expect(result.summary.ipk).toBe(3.5);
    });

    it('should return empty results for student with no grades', async () => {
      prismaMock.finalGrade.findMany.mockResolvedValue([]);

      const result = await gradeService.getMyGrades(STUDENT_ID);

      expect(result.grades).toHaveLength(0);
      expect(result.summary.totalCourses).toBe(0);
      expect(result.summary.totalSKS).toBe(0);
      expect(result.summary.ipk).toBe(0);
    });

    it('should calculate IPK correctly with different SKS weights', async () => {
      const grades = [
        makeFinalGrade('A', 4.0, 4),   // 4.0 * 4 = 16
        makeFinalGrade('B+', 3.3, 2),  // 3.3 * 2 = 6.6
      ];
      prismaMock.finalGrade.findMany.mockResolvedValue(grades);

      const result = await gradeService.getMyGrades(STUDENT_ID);

      expect(result.summary.totalSKS).toBe(6);
      // IPK = (16 + 6.6) / 6 = 3.77 → rounded to 3.77
      expect(result.summary.ipk).toBe(3.77);
    });

    it('should pass academicSemesterId filter when provided', async () => {
      prismaMock.finalGrade.findMany.mockResolvedValue([]);

      await gradeService.getMyGrades(STUDENT_ID, { academicSemesterId: 'sem-2' });

      expect(prismaMock.finalGrade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            studentId: STUDENT_ID,
            status: 'FINALIZED',
            academicSemesterId: 'sem-2',
          }),
        })
      );
    });

    it('should filter to only CLOSED semesters by default', async () => {
      prismaMock.finalGrade.findMany.mockResolvedValue([]);

      await gradeService.getMyGrades(STUDENT_ID);

      expect(prismaMock.finalGrade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { academicSemester: { status: 'CLOSED' } },
              { academicSemesterId: '' },
            ],
          }),
        })
      );
    });

    it('should include ongoing semesters when includeOngoing is true', async () => {
      prismaMock.finalGrade.findMany.mockResolvedValue([]);

      await gradeService.getMyGrades(STUDENT_ID, { includeOngoing: true });

      const callArg = prismaMock.finalGrade.findMany.mock.calls[0][0];
      expect(callArg.where.OR).toBeUndefined();
    });

    it('should use default sks of 3 when course sks is falsy', async () => {
      const grade = makeFinalGrade('A', 4.0, 0); // sks = 0 (falsy)
      prismaMock.finalGrade.findMany.mockResolvedValue([grade]);

      const result = await gradeService.getMyGrades(STUDENT_ID);

      // When sks is 0 (falsy), service uses `grade.class.course.sks || 3` → 3
      expect(result.summary.totalSKS).toBe(3);
      expect(result.summary.ipk).toBe(4.0);
    });

    it('should return mapped grade objects without raw data', async () => {
      const grades = [makeFinalGrade('A', 4.0)];
      prismaMock.finalGrade.findMany.mockResolvedValue(grades);

      const result = await gradeService.getMyGrades(STUDENT_ID);

      const g = result.grades[0];
      expect(g).toHaveProperty('id');
      expect(g).toHaveProperty('letterGrade');
      expect(g).toHaveProperty('gradePoint');
      expect(g).toHaveProperty('numericScore');
      expect(g).toHaveProperty('status');
      expect(g).toHaveProperty('class');
      expect(g).toHaveProperty('academicSemester');
      // Should NOT have extra fields like note, updatedAt in mapped output
      expect(g).not.toHaveProperty('note');
      expect(g).not.toHaveProperty('updatedAt');
    });
  });
});
