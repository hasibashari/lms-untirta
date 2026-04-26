/**
 * Class API — Integration Tests
 * 
 * This suite tests the Express Gateway routes for the Class module.
 * It mocks the gRPC client to verify the Gateway's logic, request validation,
 * and error mapping.
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import request from 'supertest';
import prisma from '../helpers/prisma.js';
import { cleanDatabase } from '../helpers/db.js';
import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';

// ─── 1. MOCK DEFINITIONS ──────────────────────────────────────────────

const classClientMock = {
  CreateClass: jest.fn(),
  GetAllClasses: jest.fn(),
  GetClassById: jest.fn(),
  GetClassesByLecturer: jest.fn(),
  GetClassesByCourse: jest.fn(),
  GetOpenClasses: jest.fn(),
  UpdateClass: jest.fn(),
  ToggleEnrollment: jest.fn(),
  DeleteClass: jest.fn(),
};

// ─── 2. APPLY MODULE MOCKS (ESM HOISTING) ─────────────────────────────

jest.unstable_mockModule('../../src/grpc/clients/class.client.js', () => ({
  default: classClientMock,
}));

// ─── 3. DYNAMIC IMPORTS ───────────────────────────────────────────────

const { getApp } = await import('../helpers/request.js');
const app = getApp();

const API = '/api/classes';
const FAKE_UUID = '00000000-0000-0000-0000-000000000000';

describe('Class API Integration Tests', () => {
  let adminToken, dosenToken, mhsToken;
  let adminUser, dosenUser, mhsUser;
  let semester, course;

  beforeAll(async () => {
    await cleanDatabase();

    const a = await createAdmin();
    const d = await createDosen();
    const m = await createMahasiswa();

    adminToken = a.token;
    dosenToken = d.token;
    mhsToken = m.token;
    adminUser = a.user;
    dosenUser = d.user;
    mhsUser = m.user;

    // Seed shared context
    semester = await prisma.academicSemester.create({
      data: {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
        status: 'OPEN',
        maxSks: 24,
      },
    });

    course = await prisma.course.create({
      data: {
        title: 'Pemrograman Web',
        code: `IF-${Date.now().toString().slice(-6)}`,
        teacherId: dosenUser.id,
      },
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default Success Mock Implementations
    classClientMock.CreateClass.mockImplementation((arg, cb) => {
      cb(null, { class: { id: 'class-123', ...arg } });
    });

    classClientMock.GetAllClasses.mockImplementation((arg, cb) => {
      cb(null, { classes: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
    });

    classClientMock.GetClassById.mockImplementation((arg, cb) => {
      if (arg.id === 'non-existent') {
        return cb({ code: 5, details: 'Kelas tidak ditemukan' });
      }
      cb(null, { class: { id: arg.id, section: 'A' } });
    });

    classClientMock.GetClassesByLecturer.mockImplementation((arg, cb) => {
      cb(null, { classes: [] });
    });

    classClientMock.GetClassesByCourse.mockImplementation((arg, cb) => {
      cb(null, { classes: [] });
    });

    classClientMock.GetOpenClasses.mockImplementation((arg, cb) => {
      cb(null, { classes: [] });
    });

    classClientMock.UpdateClass.mockImplementation((arg, cb) => {
      if (arg.id === 'non-existent') {
        return cb({ code: 5, details: 'Kelas tidak ditemukan' });
      }
      cb(null, { class: { ...arg } });
    });

    classClientMock.ToggleEnrollment.mockImplementation((arg, cb) => {
      cb(null, { class: { id: arg.id, isEnrollmentOpen: arg.isEnrollmentOpen } });
    });

    classClientMock.DeleteClass.mockImplementation((arg, cb) => {
      if (arg.id === 'non-existent') {
        return cb({ code: 5, details: 'Kelas tidak ditemukan' });
      }
      cb(null, { message: 'Kelas berhasil dihapus', deletedId: arg.id });
    });
  });

  // ─── 4. AUTH & ACCESS CONTROL ────────────────────────────────────────

  describe('Auth & Access Control', () => {
    it('should return 401 if no token provided', async () => {
      const res = await request(app).get(API);
      expect(res.status).toBe(401);
    });

    it('should return 403 if student tries to create a class', async () => {
      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it('should return 403 if student tries to delete a class', async () => {
      const res = await request(app)
        .delete(`${API}/some-id`)
        .set('Authorization', `Bearer ${mhsToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ─── 5. CREATE CLASS ─────────────────────────────────────────────────

  describe('POST /', () => {
    const validPayload = () => ({
      courseId: course.id,
      lecturerId: dosenUser.id,
      academicSemesterId: semester.id,
      section: 'A',
      capacity: 40,
      schedule: 'Senin 08:00',
      room: 'R.101',
    });

    it('201 — should create successfully as ADMIN', async () => {
      const payload = validPayload();
      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.section).toBe('A');
      expect(classClientMock.CreateClass).toHaveBeenCalledWith(
        expect.objectContaining({ section: 'A' }),
        expect.any(Function)
      );
    });

    it('400 — should return error for missing required fields', async () => {
      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ section: 'A' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('409 — should handle duplicate class error from gRPC', async () => {
      classClientMock.CreateClass.mockImplementation((arg, cb) => {
        cb({ code: 6, details: 'Kelas dengan section ini sudah ada' });
      });

      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload());

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/sudah ada/);
    });
  });

  // ─── 6. GET CLASSES ──────────────────────────────────────────────────

  describe('GET /', () => {
    it('200 — should return all classes for ADMIN', async () => {
      const res = await request(app)
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('200 — should return all classes for DOSEN', async () => {
      const res = await request(app)
        .get(API)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /me', () => {
    it('200 — should return classes for lecturer', async () => {
      const res = await request(app)
        .get(`${API}/me`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(classClientMock.GetClassesByLecturer).toHaveBeenCalledWith(
        expect.objectContaining({ lecturerId: dosenUser.id }),
        expect.any(Function)
      );
    });

    it('403 — should return 403 for student', async () => {
      const res = await request(app)
        .get(`${API}/me`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /open', () => {
    it('200 — should return open classes for student', async () => {
      const res = await request(app)
        .get(`${API}/open`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /course/:courseId', () => {
    it('200 — should return classes for a specific course', async () => {
      const res = await request(app)
        .get(`${API}/course/${course.id}`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(classClientMock.GetClassesByCourse).toHaveBeenCalledWith(
        expect.objectContaining({ courseId: course.id }),
        expect.any(Function)
      );
    });
  });

  describe('GET /:id', () => {
    it('200 — should return class details', async () => {
      const res = await request(app)
        .get(`${API}/class-123`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('class-123');
    });

    it('404 — should return error for non-existent class', async () => {
      const res = await request(app)
        .get(`${API}/non-existent`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── 7. UPDATE CLASS ─────────────────────────────────────────────────

  describe('PUT /:id', () => {
    it('200 — should update class successfully as ADMIN', async () => {
      const res = await request(app)
        .put(`${API}/class-123`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ room: 'R.202', capacity: 50 });

      expect(res.status).toBe(200);
      expect(res.body.data.room).toBe('R.202');
      expect(classClientMock.UpdateClass).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'class-123', room: 'R.202' }),
        expect.any(Function)
      );
    });

    it('404 — should return 404 for non-existent class', async () => {
      const res = await request(app)
        .put(`${API}/non-existent`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ room: 'New Room' });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /:id/enrollment', () => {
    it('200 — should toggle enrollment status', async () => {
      const res = await request(app)
        .patch(`${API}/class-123/enrollment`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isEnrollmentOpen: true });

      expect(res.status).toBe(200);
      expect(res.body.data.isEnrollmentOpen).toBe(true);
      expect(classClientMock.ToggleEnrollment).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'class-123', isEnrollmentOpen: true }),
        expect.any(Function)
      );
    });
  });

  // ─── 8. DELETE CLASS ─────────────────────────────────────────────────

  describe('DELETE /:id', () => {
    it('200 — should delete class as ADMIN', async () => {
      const res = await request(app)
        .delete(`${API}/class-123`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deletedId).toBe('class-123');
    });

    it('404 — should return 404 if class not found', async () => {
      const res = await request(app)
        .delete(`${API}/non-existent`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
