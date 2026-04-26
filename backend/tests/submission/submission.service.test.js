/**
 * Submission gRPC Service — Unit Tests
 *
 * Tests the gRPC handlers in submission.grpc-service.js using mocked Prisma.
 * Verifies business logic, student/teacher permissions, and status mapping.
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
const submissionService = (await import('../../src/modules/submission/submission.grpc-service.js')).default;

// ─── 2. TEST HELPERS ──────────────────────────────────────────────────

/**
 * Invokes a gRPC method and returns a promise.
 */
const invokeGrpc = (method, request = {}) => {
  return new Promise((resolve, reject) => {
    submissionService[method]({ request }, (error, response) => {
      if (error) return reject(error);
      resolve(response);
    });
  });
};

const STUDENT_ID = 'student-uuid-1';
const TEACHER_ID = 'teacher-uuid-1';
const COURSE_ID = 'course-uuid-1';
const ASSIGNMENT_ID = 'assignment-uuid-1';
const SUBMISSION_ID = 'submission-uuid-1';

const baseAssignment = {
  id: ASSIGNMENT_ID,
  title: 'Tugas Algoritma',
  dueDate: new Date(Date.now() + 86400000), // 1 day in future
  courseId: COURSE_ID,
};

const baseSubmission = {
  id: SUBMISSION_ID,
  assignmentId: ASSIGNMENT_ID,
  studentId: STUDENT_ID,
  fileUrl: 'https://storage.com/submission.zip',
  note: 'Ini tugas saya pak',
  submittedAt: new Date(),
  grade: null,
  feedback: null,
};

// ─── 3. TEST SUITE ────────────────────────────────────────────────────

describe('Submission gRPC Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SubmitAssignment', () => {
    const request = {
      assignmentId: ASSIGNMENT_ID,
      studentId: STUDENT_ID,
      fileUrl: 'https://storage.com/new.zip',
    };

    it('Success — should create a new submission', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue(baseAssignment);
      prismaMock.submission.findUnique.mockResolvedValue(null);
      prismaMock.submission.create.mockResolvedValue({
        ...baseSubmission,
        fileUrl: request.fileUrl,
      });

      const result = await invokeGrpc('SubmitAssignment', request);

      expect(result.message).toBe('Tugas berhasil dikumpulkan');
      expect(result.submission.isLate).toBe(false);
      expect(prismaMock.submission.create).toHaveBeenCalled();
    });

    it('404 — should return error if assignment missing', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue(null);
      await expect(invokeGrpc('SubmitAssignment', request))
        .rejects.toMatchObject({ code: grpc.status.NOT_FOUND });
    });

    it('409 — should return error if already submitted', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue(baseAssignment);
      prismaMock.submission.findUnique.mockResolvedValue({ id: 'exists' });
      await expect(invokeGrpc('SubmitAssignment', request))
        .rejects.toMatchObject({ code: grpc.status.ALREADY_EXISTS });
    });
  });

  describe('GetAssignmentWithMySubmission', () => {
    it('Success — should return assignment and submission details', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue({
        ...baseAssignment,
        course: { id: COURSE_ID, title: 'C1', code: 'IF1' }
      });
      prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'en1' });
      prismaMock.submission.findUnique.mockResolvedValue(baseSubmission);

      const result = await invokeGrpc('GetAssignmentWithMySubmission', { 
        assignmentId: ASSIGNMENT_ID, 
        studentId: STUDENT_ID 
      });

      expect(result.data.id).toBe(ASSIGNMENT_ID);
      expect(result.data.status).toBe('submitted');
    });

    it('403 — should return error if student not enrolled in course', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue(baseAssignment);
      prismaMock.enrollment.findUnique.mockResolvedValue(null);
      
      await expect(invokeGrpc('GetAssignmentWithMySubmission', { assignmentId: ASSIGNMENT_ID, studentId: STUDENT_ID }))
        .rejects.toMatchObject({ code: grpc.status.PERMISSION_DENIED });
    });
  });

  describe('GetSubmissionsByAssignment', () => {
    it('Success — should return list of submissions for teacher', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue({
        id: ASSIGNMENT_ID,
        course: { teacherId: TEACHER_ID }
      });
      prismaMock.submission.findMany.mockResolvedValue([
        { ...baseSubmission, student: { id: STUDENT_ID, name: 'Budi' } }
      ]);

      const result = await invokeGrpc('GetSubmissionsByAssignment', { 
        assignmentId: ASSIGNMENT_ID, 
        teacherId: TEACHER_ID 
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].student.name).toBe('Budi');
    });

    it('403 — should return error if teacher does not own course', async () => {
      prismaMock.assignment.findUnique.mockResolvedValue({
        id: ASSIGNMENT_ID,
        course: { teacherId: 'other-teacher' }
      });

      await expect(invokeGrpc('GetSubmissionsByAssignment', { assignmentId: ASSIGNMENT_ID, teacherId: TEACHER_ID }))
        .rejects.toMatchObject({ code: grpc.status.PERMISSION_DENIED });
    });
  });

  describe('GetAllMyGrades', () => {
    it('Success — should return aggregated grades', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([
        {
          course: {
            id: COURSE_ID,
            title: 'Web',
            code: 'IF1',
            teacher: { name: 'Dosen A' },
            assignments: [
              {
                id: ASSIGNMENT_ID,
                title: 'T1',
                dueDate: new Date(),
                submissions: [baseSubmission]
              }
            ]
          }
        }
      ]);

      const result = await invokeGrpc('GetAllMyGrades', { studentId: STUDENT_ID });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].courseName).toBe('Web');
    });
  });

  describe('GetMyDashboardStats', () => {
    it('Success — should return counts', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([{ courseId: COURSE_ID }]);
      prismaMock.assignment.count.mockResolvedValue(10);
      prismaMock.submission.count.mockResolvedValue(5);

      const result = await invokeGrpc('GetMyDashboardStats', { studentId: STUDENT_ID });
      expect(result.data.totalAssignments).toBe(10);
      expect(result.data.gradedAssignments).toBe(5);
    });
  });

  describe('GradeSubmission', () => {
    it('Success — should update grade and feedback', async () => {
      prismaMock.submission.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        assignment: { course: { teacherId: TEACHER_ID } }
      });
      prismaMock.submission.update.mockResolvedValue({
        ...baseSubmission,
        grade: 95,
        feedback: 'Kerja bagus!'
      });

      const result = await invokeGrpc('GradeSubmission', {
        submissionId: SUBMISSION_ID,
        teacherId: TEACHER_ID,
        grade: 95,
        feedback: 'Kerja bagus!'
      });

      expect(result.data.grade).toBe(95);
      expect(prismaMock.submission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { grade: 95, feedback: 'Kerja bagus!' }
        })
      );
    });

    it('403 — should return error if another teacher tries to grade', async () => {
      prismaMock.submission.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        assignment: { course: { teacherId: 'real-teacher' } }
      });

      await expect(invokeGrpc('GradeSubmission', { submissionId: SUBMISSION_ID, teacherId: 'fake-teacher', grade: 100 }))
        .rejects.toMatchObject({ code: grpc.status.PERMISSION_DENIED });
    });
  });

  describe('GetTeacherDashboardStats', () => {
    it('Success — should return teacher metrics', async () => {
      prismaMock.course.findMany.mockResolvedValue([
        { id: COURSE_ID, _count: { students: 30, materials: 5, assignments: 2 } }
      ]);
      prismaMock.submission.count.mockResolvedValue(10);

      const result = await invokeGrpc('GetTeacherDashboardStats', { teacherId: TEACHER_ID });
      expect(result.data.totalStudents).toBe(30);
      expect(result.data.pendingGrading).toBe(10);
    });
  });

  describe('GetRecentSubmissionsForTeacher', () => {
    it('Success — should return recent submissions list', async () => {
      prismaMock.submission.findMany.mockResolvedValue([
        {
          id: SUBMISSION_ID,
          submittedAt: new Date(),
          grade: null,
          student: { id: STUDENT_ID, name: 'S1', email: 's1@test.com' },
          assignment: {
            id: ASSIGNMENT_ID,
            title: 'A1',
            course: { id: COURSE_ID, title: 'C1', code: 'CODE1' }
          }
        }
      ]);

      const result = await invokeGrpc('GetRecentSubmissionsForTeacher', { teacherId: TEACHER_ID, limit: 5 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].studentName).toBe('S1');
    });
  });
});
