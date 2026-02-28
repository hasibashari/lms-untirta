/**
 * Transcript Service — Unit Tests
 *
 * Tests all 5 service functions: getStudyResults, getTranscriptByClass,
 * getAcademicSummary, getStudentList, getFullStudentTranscript.
 *
 * The grading utility functions (convertToLetterGrade, calculateAverageGrade,
 * calculateGPA) are NOT mocked — they are pure functions that run naturally.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createPrismaMock } from '../helpers/prisma-mock.js';

// ── Prisma mock setup (top-level, before import) ──
const prismaMock = createPrismaMock();
jest.unstable_mockModule('../../src/config/prisma.js', () => ({ default: prismaMock }));

const {
  getStudyResults,
  getTranscriptByClass,
  getAcademicSummary,
  getStudentList,
  getFullStudentTranscript,
} = await import('../../src/modules/transcript/transcript.service.js');

beforeEach(() => {
  jest.resetAllMocks();
});

// ── Fixtures ──
const studentFull = {
  id: 'student-1',
  name: 'Student One',
  email: 'student@test.com',
  nim: '1234567890',
  role: 'MAHASISWA',
  createdAt: new Date('2024-01-01'),
};

const studentBasic = {
  id: 'student-1',
  name: 'Student One',
  email: 'student@test.com',
  nim: '1234567890',
};

const closedSemester = {
  id: 'sem-1',
  academicYear: '2024/2025',
  semesterType: 'GANJIL',
  status: 'CLOSED',
};

const activeSemester = {
  id: 'sem-2',
  academicYear: '2024/2025',
  semesterType: 'GENAP',
  status: 'ACTIVE',
};

// ═══════════════════════════════════════════════════
// getStudyResults
// ═══════════════════════════════════════════════════
describe('getStudyResults', () => {
  it('should throw if student not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(getStudyResults('nonexistent')).rejects.toThrow('Mahasiswa tidak ditemukan');
  });

  it('should return empty courses for student with no enrollments', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentFull);
    prismaMock.enrollment.findMany.mockResolvedValue([]);

    const result = await getStudyResults('student-1');
    expect(result.student).toEqual(studentBasic);
    expect(result.courses).toEqual([]);
    expect(result.summary.totalCourses).toBe(0);
    expect(result.summary.ipk).toBe(0);
  });

  it('should return courses with calculated grades', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentFull);
    prismaMock.enrollment.findMany.mockResolvedValue([
      {
        enrolledAt: new Date('2024-01-01'),
        course: {
          id: 'course-1', title: 'Pemrograman Web', code: 'IF101',
          semester: 1, sks: 3,
          teacher: { name: 'Dosen A' },
          assignments: [
            { id: 'a1', title: 'Tugas 1', submissions: [{ grade: 90 }] },
            { id: 'a2', title: 'Tugas 2', submissions: [{ grade: 80 }] },
          ],
        },
      },
    ]);

    const result = await getStudyResults('student-1');
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].courseName).toBe('Pemrograman Web');
    expect(result.courses[0].averageScore).toBe(85); // (90+80)/2
    expect(result.courses[0].letterGrade).toBe('A'); // >= 85
    expect(result.courses[0].gradePoint).toBe(4.0);
    expect(result.courses[0].totalAssignments).toBe(2);
    expect(result.courses[0].gradedAssignments).toBe(2);
    expect(result.summary.totalCourses).toBe(1);
    expect(result.summary.ipk).toBe(4.0);
    expect(result.summary.totalSKS).toBe(3);
  });

  it('should filter courses by semester', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentFull);
    prismaMock.enrollment.findMany.mockResolvedValue([
      {
        enrolledAt: new Date('2024-01-01'),
        course: {
          id: 'course-1', title: 'Course A', code: 'IF101', semester: 1, sks: 3,
          teacher: { name: 'Dosen A' },
          assignments: [{ id: 'a1', title: 'T1', submissions: [{ grade: 85 }] }],
        },
      },
      {
        enrolledAt: new Date('2024-06-01'),
        course: {
          id: 'course-2', title: 'Course B', code: 'IF201', semester: 2, sks: 3,
          teacher: { name: 'Dosen B' },
          assignments: [{ id: 'a2', title: 'T2', submissions: [{ grade: 75 }] }],
        },
      },
    ]);

    const result = await getStudyResults('student-1', { semester: '1' });
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].courseName).toBe('Course A');
  });

  it('should handle courses with no graded submissions', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentFull);
    prismaMock.enrollment.findMany.mockResolvedValue([
      {
        enrolledAt: new Date('2024-01-01'),
        course: {
          id: 'course-1', title: 'Course A', code: 'IF101', semester: 1, sks: 3,
          teacher: { name: 'Dosen A' },
          assignments: [
            { id: 'a1', title: 'T1', submissions: [] },
            { id: 'a2', title: 'T2', submissions: [{ grade: null }] },
          ],
        },
      },
    ]);

    const result = await getStudyResults('student-1');
    expect(result.courses[0].averageScore).toBeNull();
    expect(result.courses[0].letterGrade).toBe('-');
    expect(result.courses[0].gradePoint).toBe(0);
  });

  it('should default sks to 3 when not specified', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentFull);
    prismaMock.enrollment.findMany.mockResolvedValue([
      {
        enrolledAt: new Date('2024-01-01'),
        course: {
          id: 'course-1', title: 'Course A', code: 'IF101', semester: 1, sks: null,
          teacher: { name: 'Dosen A' },
          assignments: [{ id: 'a1', title: 'T1', submissions: [{ grade: 80 }] }],
        },
      },
    ]);

    const result = await getStudyResults('student-1');
    expect(result.courses[0].sks).toBe(3);
  });
});

// ═══════════════════════════════════════════════════
// getTranscriptByClass
// ═══════════════════════════════════════════════════
describe('getTranscriptByClass', () => {
  it('should throw if student not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(getTranscriptByClass('nonexistent')).rejects.toThrow('Mahasiswa tidak ditemukan');
  });

  it('should return empty results for student with no KRS enrollments', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentBasic);
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);
    prismaMock.finalGrade.findMany.mockResolvedValue([]);

    const result = await getTranscriptByClass('student-1');
    expect(result.student).toEqual(studentBasic);
    expect(result.courses).toEqual([]);
    expect(result.semesterBreakdown).toEqual([]);
    expect(result.summary.totalCourses).toBe(0);
    expect(result.summary.ipk).toBe(0);
  });

  it('should show finalized grade from closed semester for student view', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentBasic);
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-01-01'),
        class: {
          id: 'class-1', section: 'A',
          academicSemesterId: 'sem-1', academicSemester: closedSemester,
          course: {
            id: 'course-1', title: 'Pemrograman Web', code: 'IF101',
            semester: 1, sks: 3, assignments: [],
          },
          lecturer: { name: 'Dosen A' },
        },
      },
    ]);
    prismaMock.finalGrade.findMany.mockResolvedValue([
      { classId: 'class-1', letterGrade: 'A', gradePoint: 4.0, numericScore: 90, status: 'FINALIZED' },
    ]);

    const result = await getTranscriptByClass('student-1', {}, { isStudentView: true });
    expect(result.courses[0].letterGrade).toBe('A');
    expect(result.courses[0].gradePoint).toBe(4.0);
    expect(result.courses[0].gradeSource).toBe('final_grade');
    expect(result.summary.ipk).toBe(4.0);
  });

  it('should hide non-finalized grade in student view', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentBasic);
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-01-01'),
        class: {
          id: 'class-1', section: 'A',
          academicSemesterId: 'sem-1', academicSemester: closedSemester,
          course: {
            id: 'course-1', title: 'Course A', code: 'IF101',
            semester: 1, sks: 3, assignments: [],
          },
          lecturer: { name: 'Dosen A' },
        },
      },
    ]);
    prismaMock.finalGrade.findMany.mockResolvedValue([
      { classId: 'class-1', letterGrade: 'A', gradePoint: 4.0, numericScore: 90, status: 'DRAFT' },
    ]);

    const result = await getTranscriptByClass('student-1', {}, { isStudentView: true });
    expect(result.courses[0].letterGrade).toBe('-');
    expect(result.courses[0].gradePoint).toBe(0);
    expect(result.courses[0].gradeSource).toBe('none');
  });

  it('should hide finalized grade from ACTIVE semester in student view', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentBasic);
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-01-01'),
        class: {
          id: 'class-1', section: 'A',
          academicSemesterId: 'sem-2', academicSemester: activeSemester,
          course: {
            id: 'course-1', title: 'Course A', code: 'IF101',
            semester: 1, sks: 3, assignments: [],
          },
          lecturer: { name: 'Dosen A' },
        },
      },
    ]);
    prismaMock.finalGrade.findMany.mockResolvedValue([
      { classId: 'class-1', letterGrade: 'A', gradePoint: 4.0, numericScore: 90, status: 'FINALIZED' },
    ]);

    const result = await getTranscriptByClass('student-1', {}, { isStudentView: true });
    expect(result.courses[0].letterGrade).toBe('-');
    expect(result.courses[0].gradeSource).toBe('none');
  });

  it('should show all grades in admin/dosen view (isStudentView false)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentBasic);
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-01-01'),
        class: {
          id: 'class-1', section: 'A',
          academicSemesterId: 'sem-2', academicSemester: activeSemester,
          course: {
            id: 'course-1', title: 'Course A', code: 'IF101',
            semester: 1, sks: 3, assignments: [],
          },
          lecturer: { name: 'Dosen A' },
        },
      },
    ]);
    prismaMock.finalGrade.findMany.mockResolvedValue([
      { classId: 'class-1', letterGrade: 'B+', gradePoint: 3.3, numericScore: 78, status: 'DRAFT' },
    ]);

    const result = await getTranscriptByClass('student-1', {}, { isStudentView: false });
    expect(result.courses[0].letterGrade).toBe('B+');
    expect(result.courses[0].gradePoint).toBe(3.3);
    expect(result.courses[0].gradeSource).toBe('final_grade');
  });

  it('should fallback to assignment averages in admin view when no final grade', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentBasic);
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-01-01'),
        class: {
          id: 'class-1', section: 'A',
          academicSemesterId: 'sem-1', academicSemester: closedSemester,
          course: {
            id: 'course-1', title: 'Course A', code: 'IF101',
            semester: 1, sks: 3,
            assignments: [
              { id: 'a1', submissions: [{ grade: 80 }] },
              { id: 'a2', submissions: [{ grade: 70 }] },
            ],
          },
          lecturer: { name: 'Dosen A' },
        },
      },
    ]);
    prismaMock.finalGrade.findMany.mockResolvedValue([]);

    const result = await getTranscriptByClass('student-1', {}, { isStudentView: false });
    expect(result.courses[0].averageScore).toBe(75); // (80+70)/2
    expect(result.courses[0].letterGrade).toBe('B+');
    expect(result.courses[0].gradeSource).toBe('assignment_average');
  });

  it('should NOT fallback to assignment averages in student view', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentBasic);
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-01-01'),
        class: {
          id: 'class-1', section: 'A',
          academicSemesterId: 'sem-1', academicSemester: closedSemester,
          course: {
            id: 'course-1', title: 'Course A', code: 'IF101',
            semester: 1, sks: 3,
            assignments: [{ id: 'a1', submissions: [{ grade: 80 }] }],
          },
          lecturer: { name: 'Dosen A' },
        },
      },
    ]);
    prismaMock.finalGrade.findMany.mockResolvedValue([]);

    const result = await getTranscriptByClass('student-1', {}, { isStudentView: true });
    expect(result.courses[0].letterGrade).toBe('-');
    expect(result.courses[0].gradeSource).toBe('none');
  });

  it('should filter by academicSemesterId', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentBasic);
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);
    prismaMock.finalGrade.findMany.mockResolvedValue([]);

    await getTranscriptByClass('student-1', { academicSemesterId: 'sem-1' });

    expect(prismaMock.krsEnrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          class: { academicSemesterId: 'sem-1' },
        }),
      })
    );
  });

  it('should calculate GPA only from CLOSED semesters', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentBasic);
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-01-01'),
        class: {
          id: 'class-1', section: 'A',
          academicSemesterId: 'sem-1', academicSemester: closedSemester,
          course: { id: 'c1', title: 'Course A', code: 'IF101', semester: 1, sks: 3, assignments: [] },
          lecturer: { name: 'Dosen A' },
        },
      },
      {
        createdAt: new Date('2024-06-01'),
        class: {
          id: 'class-2', section: 'B',
          academicSemesterId: 'sem-2', academicSemester: activeSemester,
          course: { id: 'c2', title: 'Course B', code: 'IF201', semester: 2, sks: 3, assignments: [] },
          lecturer: { name: 'Dosen B' },
        },
      },
    ]);
    prismaMock.finalGrade.findMany.mockResolvedValue([
      { classId: 'class-1', letterGrade: 'A', gradePoint: 4.0, numericScore: 90, status: 'FINALIZED' },
      { classId: 'class-2', letterGrade: 'B', gradePoint: 3.0, numericScore: 70, status: 'FINALIZED' },
    ]);

    const result = await getTranscriptByClass('student-1', {}, { isStudentView: true });
    // Both courses present but only CLOSED semester counts for GPA
    expect(result.courses).toHaveLength(2);
    expect(result.summary.totalCourses).toBe(1);
    expect(result.summary.ipk).toBe(4.0);
  });

  it('should provide semester breakdown for closed semesters', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentBasic);
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-01-01'),
        class: {
          id: 'class-1', section: 'A',
          academicSemesterId: 'sem-1', academicSemester: closedSemester,
          course: { id: 'c1', title: 'Course A', code: 'IF101', semester: 1, sks: 3, assignments: [] },
          lecturer: { name: 'Dosen A' },
        },
      },
    ]);
    prismaMock.finalGrade.findMany.mockResolvedValue([
      { classId: 'class-1', letterGrade: 'A', gradePoint: 4.0, numericScore: 90, status: 'FINALIZED' },
    ]);

    const result = await getTranscriptByClass('student-1', {}, { isStudentView: true });
    expect(result.semesterBreakdown).toHaveLength(1);
    expect(result.semesterBreakdown[0]).toEqual(expect.objectContaining({
      academicSemesterId: 'sem-1',
      academicYear: '2024/2025',
      semesterType: 'GANJIL',
      totalSKS: 3,
      ips: 4.0,
    }));
  });
});

// ═══════════════════════════════════════════════════
// getAcademicSummary
// ═══════════════════════════════════════════════════
describe('getAcademicSummary', () => {
  it('should throw if student not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(getAcademicSummary('nonexistent')).rejects.toThrow('Mahasiswa tidak ditemukan');
  });

  it('should return combined summary from legacy and KRS systems', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentFull);
    prismaMock.enrollment.findMany.mockResolvedValue([]);
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);
    prismaMock.finalGrade.findMany.mockResolvedValue([]);

    const result = await getAcademicSummary('student-1');
    expect(result.student).toEqual(expect.objectContaining(studentBasic));
    expect(result.legacy).toEqual(expect.objectContaining({ totalCourses: 0, ipk: 0 }));
    expect(result.krs).toEqual(expect.objectContaining({ totalCourses: 0, ipk: 0 }));
  });
});

// ═══════════════════════════════════════════════════
// getStudentList
// ═══════════════════════════════════════════════════
describe('getStudentList', () => {
  it('should return list of MAHASISWA students', async () => {
    const mockStudents = [
      {
        id: 'student-1', name: 'Student One', email: 'one@test.com',
        nim: '111', createdAt: new Date('2024-01-01'),
        _count: { enrollments: 2, krsEnrollments: 1 },
      },
    ];
    prismaMock.user.findMany.mockResolvedValue(mockStudents);

    const result = await getStudentList();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({
      id: 'student-1',
      name: 'Student One',
      totalEnrollments: 2,
      totalKrsEnrollments: 1,
    }));
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: 'MAHASISWA' } })
    );
  });

  it('should filter by search term', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);

    await getStudentList({ search: 'john' });
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: { contains: 'john', mode: 'insensitive' } }),
          ]),
        }),
      })
    );
  });

  it('should return empty array when no students found', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);
    const result = await getStudentList();
    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════
// getFullStudentTranscript
// ═══════════════════════════════════════════════════
describe('getFullStudentTranscript', () => {
  it('should throw if student not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(getFullStudentTranscript('nonexistent')).rejects.toThrow('Mahasiswa tidak ditemukan');
  });

  it('should return full transcript with grade distribution', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentFull);
    prismaMock.enrollment.findMany.mockResolvedValue([
      {
        enrolledAt: new Date('2024-01-01'),
        course: {
          id: 'course-1', title: 'Course A', code: 'IF101', semester: 1, sks: 3,
          teacher: { name: 'Dosen A' },
          assignments: [{ id: 'a1', title: 'T1', submissions: [{ grade: 90 }] }],
        },
      },
    ]);
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);
    prismaMock.finalGrade.findMany.mockResolvedValue([]);

    const result = await getFullStudentTranscript('student-1');
    expect(result.student).toBeDefined();
    expect(result.courses).toHaveLength(1);
    expect(result.gradeDistribution).toBeDefined();
    expect(result.gradeDistribution.A).toBe(1); // score 90 → A
    expect(result.legacy).toBeDefined();
    expect(result.krs).toBeDefined();
  });

  it('should deduplicate courses preferring KRS over legacy', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentFull);
    prismaMock.enrollment.findMany.mockResolvedValue([
      {
        enrolledAt: new Date('2024-01-01'),
        course: {
          id: 'course-1', title: 'Course A', code: 'IF101', semester: 1, sks: 3,
          teacher: { name: 'Dosen A' },
          assignments: [{ id: 'a1', title: 'T1', submissions: [{ grade: 70 }] }],
        },
      },
    ]);
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-06-01'),
        class: {
          id: 'class-1', section: 'A',
          academicSemesterId: 'sem-1', academicSemester: closedSemester,
          course: { id: 'course-1', title: 'Course A', code: 'IF101', semester: 1, sks: 3, assignments: [] },
          lecturer: { name: 'Dosen A' },
        },
      },
    ]);
    prismaMock.finalGrade.findMany.mockResolvedValue([
      { classId: 'class-1', letterGrade: 'A', gradePoint: 4.0, numericScore: 90, status: 'FINALIZED' },
    ]);

    const result = await getFullStudentTranscript('student-1');
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].source).toBe('krs');
  });

  it('should combine unique courses from both systems', async () => {
    prismaMock.user.findUnique.mockResolvedValue(studentFull);
    prismaMock.enrollment.findMany.mockResolvedValue([
      {
        enrolledAt: new Date('2024-01-01'),
        course: {
          id: 'course-1', title: 'Course A', code: 'IF101', semester: 1, sks: 3,
          teacher: { name: 'Dosen A' },
          assignments: [{ id: 'a1', title: 'T1', submissions: [{ grade: 85 }] }],
        },
      },
    ]);
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-06-01'),
        class: {
          id: 'class-2', section: 'B',
          academicSemesterId: 'sem-1', academicSemester: closedSemester,
          course: { id: 'course-2', title: 'Course B', code: 'IF201', semester: 2, sks: 3, assignments: [] },
          lecturer: { name: 'Dosen B' },
        },
      },
    ]);
    prismaMock.finalGrade.findMany.mockResolvedValue([
      { classId: 'class-2', letterGrade: 'B', gradePoint: 3.0, numericScore: 72, status: 'FINALIZED' },
    ]);

    const result = await getFullStudentTranscript('student-1');
    expect(result.courses).toHaveLength(2);
    const sources = result.courses.map(c => c.source);
    expect(sources).toContain('legacy');
    expect(sources).toContain('krs');
  });
});
