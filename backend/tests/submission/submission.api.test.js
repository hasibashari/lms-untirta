/**
 * Submission API — Integration Tests
 * 
 * This suite tests the Express Gateway routes for the Submission module.
 * Since the backend uses a gRPC-based service architecture, these tests 
 * mock the gRPC client to verify the Gateway's mapping logic.
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import request from 'supertest';
import prisma from '../helpers/prisma.js';
import { cleanDatabase } from '../helpers/db.js';
import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';

// ─── 1. MOCK DEFINITIONS ──────────────────────────────────────────────

const submissionClientMock = {
  SubmitAssignment: jest.fn(),
  GetAssignmentWithMySubmission: jest.fn(),
  GetSubmissionsByAssignment: jest.fn(),
  GetAllMyGrades: jest.fn(),
  GetMyDashboardStats: jest.fn(),
  GradeSubmission: jest.fn(),
  GetTeacherDashboardStats: jest.fn(),
  GetRecentSubmissionsForTeacher: jest.fn(),
};

const uploadServiceMock = {
  persistUploadMeta: jest.fn().mockResolvedValue({}),
  cleanupFile: jest.fn().mockResolvedValue({}),
};

// ─── 2. APPLY MODULE MOCKS (ESM HOISTING) ─────────────────────────────

jest.unstable_mockModule('../../src/grpc/clients/submission.client.js', () => ({
  default: submissionClientMock,
}));

jest.unstable_mockModule('../../src/services/upload.service.js', () => ({
  default: uploadServiceMock,
  persistUploadMeta: uploadServiceMock.persistUploadMeta,
  cleanupFile: uploadServiceMock.cleanupFile,
}));

// ─── 3. DYNAMIC IMPORTS ───────────────────────────────────────────────

const { getApp } = await import('../helpers/request.js');
const app = getApp();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_PDF = path.resolve(__dirname, '../fixtures/test-file.pdf');
const TEST_TXT = path.resolve(__dirname, '../fixtures/test-file.txt');
const API = '/api/submissions';

// Direct imports for gRPC Service testing
const { submissionService } = await import('../../src/modules/submission/submission.grpc-service.js');
const appPrisma = (await import('../../src/config/prisma.js')).default;
const mockCallback = jest.fn();
const NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000000';

describe('Submission API Integration Tests', () => {
  let adminToken, dosenToken, mhsToken;
  let dosenUser, mhsUser;
  let course, assignment;

  beforeAll(async () => {
    await cleanDatabase();

    const admin = await createAdmin();
    const dosen = await createDosen();
    const mhs = await createMahasiswa();

    adminToken = admin.token;
    dosenToken = dosen.token;
    mhsToken = mhs.token;
    dosenUser = dosen.user;
    mhsUser = mhs.user;

    // Create a shared course and assignment for testing
    course = await prisma.course.create({
      data: {
        title: 'Pemrograman Web',
        code: `IF-${Date.now().toString().slice(-6)}`,
        description: 'Belajar membuat web modern',
        teacherId: dosenUser.id,
      },
    });

    assignment = await prisma.assignment.create({
      data: {
        title: 'Tugas Utama',
        description: 'Implementasi REST API',
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        courseId: course.id,
      },
    });

    // Enroll student in course
    await prisma.enrollment.create({
      data: {
        userId: mhsUser.id,
        courseId: course.id,
      },
    });
  });

  const VALID_UUID_1 = '7b629854-47f3-4211-9e79-509f69747976';
  const VALID_UUID_2 = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';

  beforeEach(() => {
    jest.clearAllMocks();

    // Default Success Mock Implementations
    submissionClientMock.SubmitAssignment.mockImplementation((arg, cb) => {
      if (arg.assignmentId === 'non-existent') {
        return cb({ code: 5, details: 'Tugas tidak ditemukan' });
      }
      if (arg.assignmentId === 'already-submitted') {
        return cb({ code: 6, details: 'Anda sudah mengumpulkan tugas ini' });
      }
      cb(null, {
        message: 'Tugas berhasil dikumpulkan',
        submission: { id: 'sub-1', assignmentId: arg.assignmentId, status: 'Submitted' }
      });
    });

    submissionClientMock.GetAssignmentWithMySubmission.mockImplementation((arg, cb) => {
      if (arg.assignmentId === 'non-existent') {
        return cb({ code: 5, details: 'Tugas tidak ditemukan' });
      }
      cb(null, {
        message: 'Success',
        data: { id: arg.assignmentId, title: 'Tugas', status: 'pending' }
      });
    });

    submissionClientMock.GetSubmissionsByAssignment.mockImplementation((arg, cb) => {
      cb(null, { message: 'Success', data: [] });
    });

    submissionClientMock.GradeSubmission.mockImplementation((arg, cb) => {
      if (arg.submissionId === 'non-existent') {
        return cb({ code: 5, details: 'Submission tidak ditemukan' });
      }
      cb(null, {
        message: 'Success',
        data: { id: arg.submissionId, grade: arg.grade, feedback: arg.feedback }
      });
    });

    submissionClientMock.GetAllMyGrades.mockImplementation((arg, cb) => {
      cb(null, { message: 'Success', data: [] });
    });

    submissionClientMock.GetMyDashboardStats.mockImplementation((arg, cb) => {
      cb(null, { message: 'Success', data: { totalAssignments: 10 } });
    });

    submissionClientMock.GetTeacherDashboardStats.mockImplementation((arg, cb) => {
      cb(null, { message: 'Success', data: { totalStudents: 20 } });
    });

    submissionClientMock.GetRecentSubmissionsForTeacher.mockImplementation((arg, cb) => {
      cb(null, { message: 'Success', data: [] });
    });
  });

  // ─── 4. AUTH & ACCESS CONTROL ────────────────────────────────────────

  describe('Auth & Access Control', () => {
    it('should return 401 if no token provided', async () => {
      const res = await request(app).get(`${API}/my-grades`);
      expect(res.status).toBe(401);
    });

    it('should return 403 if student accesses teacher stats', async () => {
      const res = await request(app)
        .get(`${API}/teacher-stats`)
        .set('Authorization', `Bearer ${mhsToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 if teacher accesses student grades', async () => {
      const res = await request(app)
        .get(`${API}/my-grades`)
        .set('Authorization', `Bearer ${dosenToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ─── 5. SUBMIT ASSIGNMENT ────────────────────────────────────────────

  describe('POST /:assignmentId/submit', () => {
    it('201 — should submit successfully with valid file', async () => {
      const res = await request(app)
        .post(`${API}/${assignment.id}/submit`)
        .set('Authorization', `Bearer ${mhsToken}`)
        .attach('file', TEST_PDF)
        .field('note', 'Ini tugas saya');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Submitted');
      expect(submissionClientMock.SubmitAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentId: assignment.id,
          studentId: mhsUser.id,
          note: 'Ini tugas saya'
        }),
        expect.any(Function)
      );
    });

    it('400 — should return error if file is missing', async () => {
      const res = await request(app)
        .post(`${API}/${assignment.id}/submit`)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ note: 'No file here' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/wajib diunggah/);
    });

    it('400 — should return error for invalid file type', async () => {
      const res = await request(app)
        .post(`${API}/${assignment.id}/submit`)
        .set('Authorization', `Bearer ${mhsToken}`)
        .attach('file', TEST_TXT);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not allowed/i);
    });

    it('404 — should return error if assignment not found', async () => {
      const res = await request(app)
        .post(`${API}/non-existent/submit`)
        .set('Authorization', `Bearer ${mhsToken}`)
        .attach('file', TEST_PDF);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Tugas tidak ditemukan');
    });

    it('409 — should return error for duplicate submission', async () => {
      const res = await request(app)
        .post(`${API}/already-submitted/submit`)
        .set('Authorization', `Bearer ${mhsToken}`)
        .attach('file', TEST_PDF);

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Anda sudah mengumpulkan tugas ini');
    });
  });

  // ─── 6. VIEWING SUBMISSIONS ──────────────────────────────────────────

  describe('GET /:assignmentId/me', () => {
    it('200 — should return student assignment status', async () => {
      const res = await request(app)
        .get(`${API}/${assignment.id}/me`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending');
    });

    it('404 — should return 404 if assignment not found', async () => {
      const res = await request(app)
        .get(`${API}/non-existent/me`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /:assignmentId/submissions', () => {
    it('200 — should allow teacher to view all submissions', async () => {
      const res = await request(app)
        .get(`${API}/${assignment.id}/submissions`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── 7. GRADING ──────────────────────────────────────────────────────

  describe('PATCH /:submissionId', () => {
    it('200 — should allow teacher to grade submission', async () => {
      const res = await request(app)
        .patch(`${API}/sub-123`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ grade: 90, feedback: 'Bagus sekali!' });

      expect(res.status).toBe(200);
      expect(res.body.data.grade).toBe(90);
    });

    it('400 — should return error for invalid grade', async () => {
      const res = await request(app)
        .patch(`${API}/sub-123`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ grade: 150 }); // Above limit (assuming validation in Joi)

      expect(res.status).toBe(400);
    });

    it('404 — should return error for non-existent submission', async () => {
      const res = await request(app)
        .patch(`${API}/non-existent`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ grade: 80 });

      expect(res.status).toBe(404);
    });
  });

  // ─── 8. DASHBOARD & STATS ────────────────────────────────────────────

  describe('Dashboard & Statistics', () => {
    it('GET /my-grades — should return student grades', async () => {
      const res = await request(app)
        .get(`${API}/my-grades`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /my-stats — should return student dashboard stats', async () => {
      const res = await request(app)
        .get(`${API}/my-stats`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalAssignments');
    });

    it('GET /teacher-stats — should return teacher dashboard stats', async () => {
      const res = await request(app)
        .get(`${API}/teacher-stats`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalStudents');
    });

    it('GET /recent-submissions — should return recent submissions for teacher', async () => {
      const res = await request(app)
        .get(`${API}/recent-submissions`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── 9. CONTROLLER ERROR MAPPING ─────────────────────────────────────

  describe('Controller Error Mapping', () => {
    it('should handle non-gRPC errors in controllers', async () => {
      submissionClientMock.GetMyDashboardStats.mockImplementationOnce((arg, cb) => {
        throw new Error('Unexpected error');
      });

      const res = await request(app)
        .get(`${API}/my-stats`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(500);
    });

    it('should handle internal errors in submit (with file cleanup)', async () => {
      submissionClientMock.SubmitAssignment.mockImplementationOnce((arg, cb) => {
        throw new Error('Upload error');
      });

      const res = await request(app)
        .post(`${API}/123/submit`)
        .set('Authorization', `Bearer ${mhsToken}`)
        .attach('file', TEST_PDF);

      expect(res.status).toBe(500);
      expect(uploadServiceMock.cleanupFile).toHaveBeenCalled();
    });
  });
  // ─── 9. SUBMISSION GRPC SERVICE DIRECT TESTS ──────────────────────────

  describe('Submission gRPC Service Direct', () => {
    let student, teacher, otherTeacher, course, assignment;

    beforeAll(async () => {
      // Use appPrisma for setup to ensure it's the same instance used by the service
      student = await appPrisma.user.create({ data: { email: `s_${Date.now()}@t.com`, name: 'S', password: '123', role: 'MAHASISWA' } });
      teacher = await appPrisma.user.create({ data: { email: `t_${Date.now()}@t.com`, name: 'T', password: '123', role: 'DOSEN' } });
      otherTeacher = await appPrisma.user.create({ data: { email: `ot_${Date.now()}@t.com`, name: 'OT', password: '123', role: 'DOSEN' } });
      
      course = await appPrisma.course.create({
        data: { title: 'C1', code: `CODE_${Date.now()}`, teacherId: teacher.id }
      });

      assignment = await appPrisma.assignment.create({
        data: { title: 'A1', description: 'D1', dueDate: new Date(Date.now() + 1000000), courseId: course.id }
      });
    });

    beforeEach(() => {
      mockCallback.mockClear();
    });

    it('submissionService.SubmitAssignment — should submit successfully', async () => {
      const call = { request: { assignmentId: assignment.id, studentId: student.id, fileUrl: 'http://test.com/f.pdf', note: 'N' } };
      await submissionService.SubmitAssignment(call, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ message: expect.any(String) }));
      const sub = await appPrisma.submission.findUnique({ where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: student.id } } });
      expect(sub).not.toBeNull();
    });

    it('submissionService.SubmitAssignment — should return ALREADY_EXISTS', async () => {
      const call = { request: { assignmentId: assignment.id, studentId: student.id, fileUrl: 'http://test.com/f2.pdf' } };
      await submissionService.SubmitAssignment(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 6 }));
    });

    it('submissionService.SubmitAssignment — should return NOT_FOUND for assignment', async () => {
      const call = { request: { assignmentId: NON_EXISTENT_UUID, studentId: student.id } };
      await submissionService.SubmitAssignment(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 5 }));
    });

    it('submissionService.GetAssignmentWithMySubmission — should return detail', async () => {
      await appPrisma.enrollment.create({ data: { userId: student.id, courseId: course.id } });
      const call = { request: { assignmentId: assignment.id, studentId: student.id } };
      await submissionService.GetAssignmentWithMySubmission(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ data: expect.objectContaining({ id: assignment.id }) }));
    });

    it('submissionService.GetAssignmentWithMySubmission — should return PERMISSION_DENIED if not enrolled', async () => {
      const otherMhs = await appPrisma.user.create({ data: { email: `m_${Date.now()}@t.com`, name: 'M', password: '1', role: 'MAHASISWA' } });
      const call = { request: { assignmentId: assignment.id, studentId: otherMhs.id } };
      await submissionService.GetAssignmentWithMySubmission(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 7 }));
    });

    it('submissionService.GetSubmissionsByAssignment — should return submissions', async () => {
      const call = { request: { assignmentId: assignment.id, teacherId: teacher.id } };
      await submissionService.GetSubmissionsByAssignment(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ data: expect.any(Array) }));
    });

    it('submissionService.GetSubmissionsByAssignment — should return PERMISSION_DENIED if not the teacher', async () => {
      const call = { request: { assignmentId: assignment.id, teacherId: otherTeacher.id } };
      await submissionService.GetSubmissionsByAssignment(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 7 }));
    });

    it('submissionService.GradeSubmission — should update grade', async () => {
      const sub = await appPrisma.submission.findFirst({ where: { assignmentId: assignment.id, studentId: student.id } });
      const call = { request: { submissionId: sub.id, teacherId: teacher.id, grade: 85, feedback: 'Good' } };
      await submissionService.GradeSubmission(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ data: expect.objectContaining({ grade: 85 }) }));
    });

    it('submissionService.GradeSubmission — should return PERMISSION_DENIED if not teacher of course', async () => {
      const sub = await appPrisma.submission.findFirst({ where: { assignmentId: assignment.id, studentId: student.id } });
      const call = { request: { submissionId: sub.id, teacherId: otherTeacher.id, grade: 100 } };
      await submissionService.GradeSubmission(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 7 }));
    });

    it('submissionService.GetAllMyGrades — should return grades', async () => {
      const call = { request: { studentId: student.id } };
      await submissionService.GetAllMyGrades(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ data: expect.any(Array) }));
    });

    it('submissionService.GetMyDashboardStats — should return stats', async () => {
      const call = { request: { studentId: student.id } };
      await submissionService.GetMyDashboardStats(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ data: expect.any(Object) }));
    });

    it('submissionService.GetTeacherDashboardStats — should return stats', async () => {
      const call = { request: { teacherId: teacher.id } };
      await submissionService.GetTeacherDashboardStats(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ data: expect.any(Object) }));
    });

    it('submissionService.GetRecentSubmissionsForTeacher — should return submissions', async () => {
      const call = { request: { teacherId: teacher.id, limit: 5 } };
      await submissionService.GetRecentSubmissionsForTeacher(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ data: expect.any(Array) }));
    });

    it('should handle internal errors in gRPC handlers', async () => {
      const spy = jest.spyOn(appPrisma.submission, 'findUnique').mockRejectedValue(new Error('Database error'));
      await submissionService.GradeSubmission({ request: { submissionId: VALID_UUID_1 } }, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 13 }));
      spy.mockRestore();
    });

    it('submissionService.SubmitAssignment — should be late if after dueDate', async () => {
      const lateAssignment = await appPrisma.assignment.create({
        data: { title: 'Late', description: 'D', dueDate: new Date(Date.now() - 1000000), courseId: course.id }
      });
      const call = { request: { assignmentId: lateAssignment.id, studentId: student.id, fileUrl: 'http://test.com/late.pdf' } };
      await submissionService.SubmitAssignment(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ submission: expect.objectContaining({ isLate: true }) }));
    });
  });

  describe('Additional Controller Error Mapping', () => {
    it('GET /:assignmentId/me — should handle gRPC error with code', async () => {
      submissionClientMock.GetAssignmentWithMySubmission.mockImplementationOnce((arg, cb) => {
        cb({ code: 5, details: 'Not found' });
      });
      const res = await request(app).get(`${API}/123/me`).set('Authorization', `Bearer ${mhsToken}`);
      expect(res.status).toBe(404);
    });

    it('PATCH /:submissionId — should handle gRPC error with code', async () => {
      submissionClientMock.GradeSubmission.mockImplementationOnce((arg, cb) => {
        cb({ code: 7, details: 'Denied' });
      });
      const res = await request(app).patch(`${API}/123`).set('Authorization', `Bearer ${dosenToken}`).send({ grade: 50 });
      expect(res.status).toBe(403);
    });
  });
});
