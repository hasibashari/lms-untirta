/**
 * Assignment Service — Unit Tests
 *
 * Tests the business logic in assignment.service.js in isolation.
 * Prisma is fully mocked — no database calls are made.
 *
 * What we test:
 *   ✓ createAssignment — ownership checks, success
 *   ✓ submitAssignment — deadline, duplicate, success
 *   ✓ getAssignmentDetail — found, not found
 *   ✓ getAssignmentsByCourse — enrollment check, status mapping
 *   ✓ getAssignmentWithMySubmission — statuses: graded/submitted/overdue/pending
 *   ✓ getSubmissionsByAssignment — teacher ownership, returns list
 *   ✓ getAllMyGrades — flat list transform
 *   ✓ getMyDashboardStats — parallel counts
 *   ✓ getTeacherDashboardStats — course stats
 *   ✓ getRecentSubmissionsForTeacher — flat transform
 *   ✓ gradeSubmission — 2-level auth, update
 *   ✓ updateAssignment — role-based auth
 *   ✓ deleteAssignment — role-based auth, cascade
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
  createAssignment,
  submitAssignment,
  getAssignmentDetail,
  getAssignmentsByCourse,
  getAssignmentWithMySubmission,
  getSubmissionsByAssignment,
  getAllMyGrades,
  getMyDashboardStats,
  getTeacherDashboardStats,
  getRecentSubmissionsForTeacher,
  gradeSubmission,
  updateAssignment,
  deleteAssignment,
} = await import('../../src/modules/assignment/assignment.service.js');

// ─── Shared Data ─────────────────────────────────────────────

const TEACHER_ID = 'teacher-uuid-1';
const STUDENT_ID = 'student-uuid-1';
const COURSE_ID = 'course-uuid-1';
const ASSIGNMENT_ID = 'assignment-uuid-1';
const SUBMISSION_ID = 'submission-uuid-1';

const futureDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
const pastDueDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

const baseCourse = {
  id: COURSE_ID,
  teacherId: TEACHER_ID,
  title: 'Algoritma',
  code: 'IF101',
};

const baseAssignment = {
  id: ASSIGNMENT_ID,
  title: 'Tugas 1',
  description: 'Deskripsi tugas',
  dueDate: futureDueDate,
  courseId: COURSE_ID,
};

// ─── Reset mocks before each test ─────────────────────────

beforeEach(() => {
  jest.resetAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// createAssignment
// ═══════════════════════════════════════════════════════════════

describe('createAssignment', () => {
  const data = { title: 'Tugas 1', description: 'Desc', dueDate: futureDueDate.toISOString() };

  it('should create assignment when teacher owns the course', async () => {
    prismaMock.course.findUnique.mockResolvedValue(baseCourse);
    const created = { id: ASSIGNMENT_ID, title: data.title, dueDate: futureDueDate, courseId: COURSE_ID };
    prismaMock.assignment.create.mockResolvedValue(created);

    const result = await createAssignment(COURSE_ID, TEACHER_ID, data);

    expect(result).toEqual(created);
    expect(prismaMock.course.findUnique).toHaveBeenCalledWith({ where: { id: COURSE_ID } });
    expect(prismaMock.assignment.create).toHaveBeenCalledTimes(1);
  });

  it('should throw when course not found', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);

    await expect(createAssignment(COURSE_ID, TEACHER_ID, data))
      .rejects.toThrow('Kelas tidak ditemukan');
  });

  it('should throw when teacher does not own the course', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ ...baseCourse, teacherId: 'other-teacher' });

    await expect(createAssignment(COURSE_ID, TEACHER_ID, data))
      .rejects.toThrow('Akses ditolak');
  });
});

// ═══════════════════════════════════════════════════════════════
// submitAssignment
// ═══════════════════════════════════════════════════════════════

describe('submitAssignment', () => {
  const submitData = { fileUrl: 'https://example.com/file.pdf', note: 'Catatan' };

  it('should submit successfully when not late and no prior submission', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ ...baseAssignment, dueDate: futureDueDate });
    prismaMock.submission.findUnique.mockResolvedValue(null); // no duplicate
    const created = {
      id: SUBMISSION_ID,
      assignmentId: ASSIGNMENT_ID,
      submittedAt: new Date(),
      fileUrl: submitData.fileUrl,
    };
    prismaMock.submission.create.mockResolvedValue(created);

    const result = await submitAssignment(ASSIGNMENT_ID, STUDENT_ID, submitData);

    expect(result.status).toBe('Submitted');
    expect(result.isLate).toBe(false);
    expect(result.id).toBe(SUBMISSION_ID);
  });

  it('should submit but flag as late when past deadline', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ ...baseAssignment, dueDate: pastDueDate });
    prismaMock.submission.findUnique.mockResolvedValue(null);
    const created = {
      id: SUBMISSION_ID,
      assignmentId: ASSIGNMENT_ID,
      submittedAt: new Date(),
      fileUrl: submitData.fileUrl,
    };
    prismaMock.submission.create.mockResolvedValue(created);

    const result = await submitAssignment(ASSIGNMENT_ID, STUDENT_ID, submitData);

    expect(result.isLate).toBe(true);
    expect(result.status).toBe('Submitted');
  });

  it('should throw when assignment not found', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(null);

    await expect(submitAssignment(ASSIGNMENT_ID, STUDENT_ID, submitData))
      .rejects.toThrow('Tugas tidak ditemukan');
  });

  it('should throw when student already submitted', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({ ...baseAssignment, dueDate: futureDueDate });
    prismaMock.submission.findUnique.mockResolvedValue({ id: 'existing-sub' });

    await expect(submitAssignment(ASSIGNMENT_ID, STUDENT_ID, submitData))
      .rejects.toThrow('Anda sudah mengumpulkan tugas ini');
  });
});

// ═══════════════════════════════════════════════════════════════
// getAssignmentDetail
// ═══════════════════════════════════════════════════════════════

describe('getAssignmentDetail', () => {
  it('should return assignment details when found', async () => {
    const detail = { id: ASSIGNMENT_ID, title: 'Tugas 1', description: 'Desc', dueDate: futureDueDate };
    prismaMock.assignment.findUnique.mockResolvedValue(detail);

    const result = await getAssignmentDetail(ASSIGNMENT_ID);

    expect(result).toEqual(detail);
  });

  it('should return null when not found', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(null);

    const result = await getAssignmentDetail(ASSIGNMENT_ID);

    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// getAssignmentsByCourse
// ═══════════════════════════════════════════════════════════════

describe('getAssignmentsByCourse', () => {
  it('should throw when course not found', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);

    await expect(getAssignmentsByCourse(COURSE_ID, STUDENT_ID, 'MAHASISWA'))
      .rejects.toThrow('Kelas tidak ditemukan');
  });

  it('should throw when mahasiswa is not enrolled', async () => {
    prismaMock.course.findUnique.mockResolvedValue(baseCourse);
    prismaMock.enrollment.findUnique.mockResolvedValue(null);

    await expect(getAssignmentsByCourse(COURSE_ID, STUDENT_ID, 'MAHASISWA'))
      .rejects.toThrow('Anda belum terdaftar di kelas ini');
  });

  it('should skip enrollment check for DOSEN', async () => {
    prismaMock.course.findUnique.mockResolvedValue(baseCourse);
    prismaMock.assignment.findMany.mockResolvedValue([]);

    const result = await getAssignmentsByCourse(COURSE_ID, TEACHER_ID, 'DOSEN');

    expect(prismaMock.enrollment.findUnique).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('should return submitted status when student has a submission', async () => {
    prismaMock.course.findUnique.mockResolvedValue(baseCourse);
    prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'enr-1' });
    prismaMock.assignment.findMany.mockResolvedValue([
      { id: ASSIGNMENT_ID, title: 'T1', dueDate: futureDueDate, submissions: [{ id: 'sub-1' }] },
    ]);

    const result = await getAssignmentsByCourse(COURSE_ID, STUDENT_ID, 'MAHASISWA');

    expect(result[0].status).toBe('submitted');
  });

  it('should return overdue status when past deadline with no submission', async () => {
    prismaMock.course.findUnique.mockResolvedValue(baseCourse);
    prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'enr-1' });
    prismaMock.assignment.findMany.mockResolvedValue([
      { id: ASSIGNMENT_ID, title: 'T1', dueDate: pastDueDate, submissions: [] },
    ]);

    const result = await getAssignmentsByCourse(COURSE_ID, STUDENT_ID, 'MAHASISWA');

    expect(result[0].status).toBe('overdue');
  });

  it('should return pending status when before deadline with no submission', async () => {
    prismaMock.course.findUnique.mockResolvedValue(baseCourse);
    prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'enr-1' });
    prismaMock.assignment.findMany.mockResolvedValue([
      { id: ASSIGNMENT_ID, title: 'T1', dueDate: futureDueDate, submissions: [] },
    ]);

    const result = await getAssignmentsByCourse(COURSE_ID, STUDENT_ID, 'MAHASISWA');

    expect(result[0].status).toBe('pending');
  });
});

// ═══════════════════════════════════════════════════════════════
// getAssignmentWithMySubmission
// ═══════════════════════════════════════════════════════════════

describe('getAssignmentWithMySubmission', () => {
  const assignmentWithCourse = {
    ...baseAssignment,
    course: { id: COURSE_ID, title: 'Algoritma', code: 'IF101' },
  };

  it('should throw when assignment not found', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(null);

    await expect(getAssignmentWithMySubmission(ASSIGNMENT_ID, STUDENT_ID))
      .rejects.toThrow('Tugas tidak ditemukan');
  });

  it('should throw when student is not enrolled', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(assignmentWithCourse);
    prismaMock.enrollment.findUnique.mockResolvedValue(null);

    await expect(getAssignmentWithMySubmission(ASSIGNMENT_ID, STUDENT_ID))
      .rejects.toThrow('Anda belum terdaftar di kelas ini');
  });

  it('should return graded status when submission has grade', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(assignmentWithCourse);
    prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'enr-1' });
    prismaMock.submission.findUnique.mockResolvedValue({
      id: SUBMISSION_ID, fileUrl: 'url', note: 'n', submittedAt: new Date(),
      grade: 85, feedback: 'Good',
    });

    const result = await getAssignmentWithMySubmission(ASSIGNMENT_ID, STUDENT_ID);

    expect(result.status).toBe('graded');
    expect(result.grade).toBe(85);
    expect(result.feedback).toBe('Good');
  });

  it('should return submitted status when submission exists but not graded', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(assignmentWithCourse);
    prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'enr-1' });
    prismaMock.submission.findUnique.mockResolvedValue({
      id: SUBMISSION_ID, fileUrl: 'url', note: 'n', submittedAt: new Date(),
      grade: null, feedback: null,
    });

    const result = await getAssignmentWithMySubmission(ASSIGNMENT_ID, STUDENT_ID);

    expect(result.status).toBe('submitted');
    expect(result.grade).toBeNull();
  });

  it('should return overdue status when no submission and past deadline', async () => {
    const pastAssignment = { ...assignmentWithCourse, dueDate: pastDueDate };
    prismaMock.assignment.findUnique.mockResolvedValue(pastAssignment);
    prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'enr-1' });
    prismaMock.submission.findUnique.mockResolvedValue(null);

    const result = await getAssignmentWithMySubmission(ASSIGNMENT_ID, STUDENT_ID);

    expect(result.status).toBe('overdue');
    expect(result.isOverdue).toBe(true);
  });

  it('should return pending status when no submission and before deadline', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(assignmentWithCourse);
    prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'enr-1' });
    prismaMock.submission.findUnique.mockResolvedValue(null);

    const result = await getAssignmentWithMySubmission(ASSIGNMENT_ID, STUDENT_ID);

    expect(result.status).toBe('pending');
    expect(result.isOverdue).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// getSubmissionsByAssignment
// ═══════════════════════════════════════════════════════════════

describe('getSubmissionsByAssignment', () => {
  it('should throw when assignment not found', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(null);

    await expect(getSubmissionsByAssignment(ASSIGNMENT_ID, TEACHER_ID))
      .rejects.toThrow('Tugas tidak ditemukan');
  });

  it('should throw when teacher does not own the course', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { teacherId: 'other-teacher' },
    });

    await expect(getSubmissionsByAssignment(ASSIGNMENT_ID, TEACHER_ID))
      .rejects.toThrow('Akses ditolak');
  });

  it('should return submissions when teacher owns the course', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { teacherId: TEACHER_ID },
    });
    const subs = [
      { id: 'sub-1', submittedAt: new Date(), fileUrl: 'url', note: null, grade: null, student: { id: STUDENT_ID, name: 'Mhs A' } },
    ];
    prismaMock.submission.findMany.mockResolvedValue(subs);

    const result = await getSubmissionsByAssignment(ASSIGNMENT_ID, TEACHER_ID);

    expect(result).toEqual(subs);
    expect(prismaMock.submission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { assignmentId: ASSIGNMENT_ID } }),
    );
  });
});

// ═══════════════════════════════════════════════════════════════
// getAllMyGrades
// ═══════════════════════════════════════════════════════════════

describe('getAllMyGrades', () => {
  it('should return empty array when no enrollments', async () => {
    prismaMock.enrollment.findMany.mockResolvedValue([]);

    const result = await getAllMyGrades(STUDENT_ID);

    expect(result).toEqual([]);
  });

  it('should flatten enrollments into grade list with correct statuses', async () => {
    const enrollments = [
      {
        course: {
          id: COURSE_ID,
          title: 'Algoritma',
          code: 'IF101',
          teacher: { name: 'Dr. Budi' },
          assignments: [
            {
              id: 'a1', title: 'T1', dueDate: pastDueDate,
              submissions: [{ id: 's1', grade: 90, feedback: 'OK', submittedAt: new Date() }],
            },
            {
              id: 'a2', title: 'T2', dueDate: futureDueDate,
              submissions: [{ id: 's2', grade: null, feedback: null, submittedAt: new Date() }],
            },
            {
              id: 'a3', title: 'T3', dueDate: pastDueDate,
              submissions: [],
            },
            {
              id: 'a4', title: 'T4', dueDate: futureDueDate,
              submissions: [],
            },
          ],
        },
      },
    ];
    prismaMock.enrollment.findMany.mockResolvedValue(enrollments);

    const result = await getAllMyGrades(STUDENT_ID);

    expect(result).toHaveLength(4);
    expect(result[0].status).toBe('graded');
    expect(result[0].grade).toBe(90);
    expect(result[1].status).toBe('submitted');
    expect(result[2].status).toBe('overdue');
    expect(result[3].status).toBe('pending');
    // check flat fields
    expect(result[0].courseName).toBe('Algoritma');
    expect(result[0].courseCode).toBe('IF101');
    expect(result[0].teacherName).toBe('Dr. Budi');
  });

  it('should handle teacher name being null gracefully', async () => {
    const enrollments = [
      {
        course: {
          id: COURSE_ID, title: 'X', code: 'X1',
          teacher: null,
          assignments: [
            { id: 'a1', title: 'T1', dueDate: futureDueDate, submissions: [] },
          ],
        },
      },
    ];
    prismaMock.enrollment.findMany.mockResolvedValue(enrollments);

    const result = await getAllMyGrades(STUDENT_ID);

    expect(result[0].teacherName).toBe('Unknown');
  });
});

// ═══════════════════════════════════════════════════════════════
// getMyDashboardStats
// ═══════════════════════════════════════════════════════════════

describe('getMyDashboardStats', () => {
  it('should return zeros when student has no enrollments', async () => {
    prismaMock.enrollment.findMany.mockResolvedValue([]);
    prismaMock.assignment.count.mockResolvedValue(0);
    prismaMock.submission.count.mockResolvedValue(0);

    const result = await getMyDashboardStats(STUDENT_ID);

    expect(result).toEqual({
      totalCourses: 0,
      totalAssignments: 0,
      pendingAssignments: 0,
      gradedAssignments: 0,
    });
  });

  it('should correctly aggregate stats from parallel queries', async () => {
    prismaMock.enrollment.findMany.mockResolvedValue([
      { courseId: 'c1' }, { courseId: 'c2' },
    ]);
    // Promise.all resolves: [totalAssignments, pendingAssignments, gradedAssignments]
    prismaMock.assignment.count
      .mockResolvedValueOnce(10)  // totalAssignments
      .mockResolvedValueOnce(3);  // pendingAssignments
    prismaMock.submission.count.mockResolvedValue(5); // gradedAssignments

    const result = await getMyDashboardStats(STUDENT_ID);

    expect(result.totalCourses).toBe(2);
    expect(result.totalAssignments).toBe(10);
    expect(result.pendingAssignments).toBe(3);
    expect(result.gradedAssignments).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════
// gradeSubmission
// ═══════════════════════════════════════════════════════════════

describe('gradeSubmission', () => {
  const gradeData = { grade: 85, feedback: 'Good work' };

  it('should throw when submission not found', async () => {
    prismaMock.submission.findUnique.mockResolvedValue(null);

    await expect(gradeSubmission(SUBMISSION_ID, TEACHER_ID, gradeData))
      .rejects.toThrow('Submission tidak ditemukan');
  });

  it('should throw when teacher does not own the course (2-level auth)', async () => {
    prismaMock.submission.findUnique.mockResolvedValue({
      id: SUBMISSION_ID,
      assignment: { course: { teacherId: 'other-teacher' } },
    });

    await expect(gradeSubmission(SUBMISSION_ID, TEACHER_ID, gradeData))
      .rejects.toThrow('Akses ditolak: Ini bukan kelas Anda');
  });

  it('should grade submission successfully when teacher owns the course', async () => {
    prismaMock.submission.findUnique.mockResolvedValue({
      id: SUBMISSION_ID,
      assignment: { course: { teacherId: TEACHER_ID } },
    });
    const updated = { id: SUBMISSION_ID, grade: 85, feedback: 'Good work', studentId: STUDENT_ID };
    prismaMock.submission.update.mockResolvedValue(updated);

    const result = await gradeSubmission(SUBMISSION_ID, TEACHER_ID, gradeData);

    expect(result).toEqual(updated);
    expect(prismaMock.submission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SUBMISSION_ID },
        data: { grade: 85, feedback: 'Good work' },
      }),
    );
  });
});

// ═══════════════════════════════════════════════════════════════
// getTeacherDashboardStats
// ═══════════════════════════════════════════════════════════════

describe('getTeacherDashboardStats', () => {
  it('should return zeros when teacher has no courses', async () => {
    prismaMock.course.findMany.mockResolvedValue([]);
    prismaMock.submission.count
      .mockResolvedValueOnce(0)   // pendingGrading
      .mockResolvedValueOnce(0);  // recentSubmissions

    const result = await getTeacherDashboardStats(TEACHER_ID);

    expect(result).toEqual({
      totalCourses: 0,
      totalStudents: 0,
      totalMaterials: 0,
      totalAssignments: 0,
      pendingGrading: 0,
      recentSubmissions: 0,
    });
  });

  it('should aggregate stats from multiple courses', async () => {
    prismaMock.course.findMany.mockResolvedValue([
      { id: 'c1', _count: { students: 20, materials: 5, assignments: 3 } },
      { id: 'c2', _count: { students: 15, materials: 2, assignments: 4 } },
    ]);
    prismaMock.submission.count
      .mockResolvedValueOnce(7)   // pendingGrading
      .mockResolvedValueOnce(12); // recentSubmissions

    const result = await getTeacherDashboardStats(TEACHER_ID);

    expect(result.totalCourses).toBe(2);
    expect(result.totalStudents).toBe(35);
    expect(result.totalMaterials).toBe(7);
    expect(result.totalAssignments).toBe(7);
    expect(result.pendingGrading).toBe(7);
    expect(result.recentSubmissions).toBe(12);
  });
});

// ═══════════════════════════════════════════════════════════════
// getRecentSubmissionsForTeacher
// ═══════════════════════════════════════════════════════════════

describe('getRecentSubmissionsForTeacher', () => {
  it('should return empty array when no submissions', async () => {
    prismaMock.submission.findMany.mockResolvedValue([]);

    const result = await getRecentSubmissionsForTeacher(TEACHER_ID);

    expect(result).toEqual([]);
  });

  it('should transform submissions into flat objects', async () => {
    prismaMock.submission.findMany.mockResolvedValue([
      {
        id: 'sub-1',
        submittedAt: new Date('2025-12-01'),
        grade: 90,
        student: { id: STUDENT_ID, name: 'Andi', email: 'andi@test.com' },
        assignment: {
          id: ASSIGNMENT_ID, title: 'T1',
          course: { id: COURSE_ID, title: 'Algoritma', code: 'IF101' },
        },
      },
    ]);

    const result = await getRecentSubmissionsForTeacher(TEACHER_ID, 5);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'sub-1',
      studentName: 'Andi',
      studentEmail: 'andi@test.com',
      assignmentId: ASSIGNMENT_ID,
      assignmentTitle: 'T1',
      courseId: COURSE_ID,
      courseName: 'Algoritma',
      courseCode: 'IF101',
      submittedAt: new Date('2025-12-01'),
      isGraded: true,
      grade: 90,
    });
  });

  it('should set isGraded to false when grade is null', async () => {
    prismaMock.submission.findMany.mockResolvedValue([
      {
        id: 'sub-2', submittedAt: new Date(), grade: null,
        student: { id: 's1', name: 'Budi', email: 'b@test.com' },
        assignment: { id: 'a1', title: 'T2', course: { id: 'c1', title: 'C1', code: 'C1' } },
      },
    ]);

    const result = await getRecentSubmissionsForTeacher(TEACHER_ID);

    expect(result[0].isGraded).toBe(false);
    expect(result[0].grade).toBeNull();
  });

  it('should use default limit of 10', async () => {
    prismaMock.submission.findMany.mockResolvedValue([]);

    await getRecentSubmissionsForTeacher(TEACHER_ID);

    expect(prismaMock.submission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 }),
    );
  });
});

// ═══════════════════════════════════════════════════════════════
// updateAssignment
// ═══════════════════════════════════════════════════════════════

describe('updateAssignment', () => {
  const updateData = { title: 'Updated Title', description: 'Updated Desc' };

  it('should throw when assignment not found', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(null);

    await expect(updateAssignment(ASSIGNMENT_ID, TEACHER_ID, 'DOSEN', updateData))
      .rejects.toThrow('Tugas tidak ditemukan');
  });

  it('should throw when DOSEN does not own the course', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: 'other-teacher' },
    });

    await expect(updateAssignment(ASSIGNMENT_ID, TEACHER_ID, 'DOSEN', updateData))
      .rejects.toThrow('Akses ditolak: Ini bukan tugas dari kelas Anda');
  });

  it('should throw when MAHASISWA tries to update', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: TEACHER_ID },
    });

    await expect(updateAssignment(ASSIGNMENT_ID, STUDENT_ID, 'MAHASISWA', updateData))
      .rejects.toThrow('Akses ditolak: Mahasiswa tidak dapat mengedit tugas');
  });

  it('should allow DOSEN who owns the course to update', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: TEACHER_ID },
    });
    const updated = { id: ASSIGNMENT_ID, ...updateData, dueDate: futureDueDate, courseId: COURSE_ID, updatedAt: new Date() };
    prismaMock.assignment.update.mockResolvedValue(updated);

    const result = await updateAssignment(ASSIGNMENT_ID, TEACHER_ID, 'DOSEN', updateData);

    expect(result).toEqual(updated);
  });

  it('should allow ADMIN to update any assignment', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: 'some-other-teacher' },
    });
    const updated = { id: ASSIGNMENT_ID, ...updateData, dueDate: futureDueDate, courseId: COURSE_ID, updatedAt: new Date() };
    prismaMock.assignment.update.mockResolvedValue(updated);

    const result = await updateAssignment(ASSIGNMENT_ID, 'admin-1', 'ADMIN', updateData);

    expect(result).toEqual(updated);
  });

  it('should convert dueDate when provided', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: TEACHER_ID },
    });
    prismaMock.assignment.update.mockResolvedValue({ id: ASSIGNMENT_ID });

    const dateStr = '2025-12-31T23:59:59Z';
    await updateAssignment(ASSIGNMENT_ID, TEACHER_ID, 'DOSEN', { dueDate: dateStr });

    const callData = prismaMock.assignment.update.mock.calls[0][0].data;
    expect(callData.dueDate).toEqual(new Date(dateStr));
  });
});

// ═══════════════════════════════════════════════════════════════
// deleteAssignment
// ═══════════════════════════════════════════════════════════════

describe('deleteAssignment', () => {
  it('should throw when assignment not found', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(null);

    await expect(deleteAssignment(ASSIGNMENT_ID, TEACHER_ID, 'DOSEN'))
      .rejects.toThrow('Tugas tidak ditemukan');
  });

  it('should throw when DOSEN does not own the course', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: 'other-teacher' },
      _count: { submissions: 0 },
    });

    await expect(deleteAssignment(ASSIGNMENT_ID, TEACHER_ID, 'DOSEN'))
      .rejects.toThrow('Akses ditolak: Ini bukan tugas dari kelas Anda');
  });

  it('should throw when MAHASISWA tries to delete', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: TEACHER_ID },
      _count: { submissions: 0 },
    });

    await expect(deleteAssignment(ASSIGNMENT_ID, STUDENT_ID, 'MAHASISWA'))
      .rejects.toThrow('Akses ditolak: Mahasiswa tidak dapat menghapus tugas');
  });

  it('should delete assignment and return result for DOSEN owner', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: TEACHER_ID },
      _count: { submissions: 3 },
    });
    prismaMock.assignment.delete.mockResolvedValue({});

    const result = await deleteAssignment(ASSIGNMENT_ID, TEACHER_ID, 'DOSEN');

    expect(result.message).toBe('Tugas berhasil dihapus');
    expect(result.deletedSubmissions).toBe(3);
    expect(prismaMock.assignment.delete).toHaveBeenCalledWith({ where: { id: ASSIGNMENT_ID } });
  });

  it('should allow ADMIN to delete any assignment', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: 'other-teacher' },
      _count: { submissions: 1 },
    });
    prismaMock.assignment.delete.mockResolvedValue({});

    const result = await deleteAssignment(ASSIGNMENT_ID, 'admin-1', 'ADMIN');

    expect(result.message).toBe('Tugas berhasil dihapus');
    expect(result.deletedSubmissions).toBe(1);
  });
});
