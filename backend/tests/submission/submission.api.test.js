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
});
