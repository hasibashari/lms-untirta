/**
 * Academic Semester API — Integration Tests
 *
 * Tests the Gateway to gRPC communication for Academic module.
 * We mock the gRPC client to focus on:
 *   ✓ Auth & Role validation
 *   ✓ Request body validation
 *   ✓ Error mapping (gRPC -> HTTP)
 *   ✓ Response structure
 */

import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { cleanDatabase } from '../helpers/db.js';
import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';
import { validSemester } from '../fixtures/academic.fixture.js';
import crypto from 'crypto';

const randomUUID = () => crypto.randomUUID();

// 1. Mock gRPC client BEFORE importing app
jest.unstable_mockModule('../../src/grpc/clients/academic.client.js', () => ({
  default: {
    GetAllSemesters: jest.fn(),
    GetActiveSemester: jest.fn(),
    GetSemesterById: jest.fn(),
    CreateSemester: jest.fn(),
    UpdateSemester: jest.fn(),
    UpdateStatus: jest.fn(),
    GetClosingReadiness: jest.fn(),
    DeleteSemester: jest.fn(),
    GetStudentSemesters: jest.fn(),
  },
}));

// 2. Dynamic imports to ensure mocks are applied
const { default: academicClient } = await import('../../src/grpc/clients/academic.client.js');
const { academicService } = await import('../../src/modules/academic/academic.grpc-service.js');
const { getApp } = await import('../helpers/request.js');

const app = getApp();
const API = '/api/academic-semesters';

describe('Academic Semester API (Gateway)', () => {
  let adminToken, dosenToken, mhsToken, mhsUser;

  beforeAll(async () => {
    await cleanDatabase();
    const admin = await createAdmin();
    const dosen = await createDosen();
    const mhs = await createMahasiswa();
    adminToken = admin.token;
    dosenToken = dosen.token;
    mhsToken = mhs.token;
    mhsUser = mhs.user;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═════════════════════════════════════════════════════════════
  // Auth Guards
  // ═════════════════════════════════════════════════════════════
  describe('Auth Guards', () => {
    it('POST / → 403 for DOSEN', async () => {
      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send(validSemester());
      expect(res.status).toBe(403);
    });

    it('POST / → 401 without token', async () => {
      const res = await request(app).post(API).send(validSemester());
      expect(res.status).toBe(401);
    });

    it('PATCH /:id/status → 403 for MAHASISWA', async () => {
      const res = await request(app)
        .patch(`${API}/${randomUUID()}/status`)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ status: 'OPEN' });
      expect(res.status).toBe(403);
    });

    it('GET /student-semesters → 403 for ADMIN', async () => {
      const res = await request(app)
        .get(`${API}/student-semesters`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ═════════════════════════════════════════════════════════════
  // POST / — Create Semester
  // ═════════════════════════════════════════════════════════════
  describe('POST /', () => {
    it('should create a new semester successfully', async () => {
      const mockSemester = {
        id: randomUUID(),
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
        status: 'DRAFT',
        maxSks: 24,
      };

      academicClient.CreateSemester.mockImplementation((data, callback) => {
        callback(null, { semester: mockSemester });
      });

      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ academicYear: '2025/2026', semesterType: 'GANJIL' });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
      });
      expect(academicClient.CreateSemester).toHaveBeenCalled();
    });

    it('should return 400 for validation error (Invalid Year)', async () => {
      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ academicYear: '2025-2026', semesterType: 'GANJIL' });

      expect(res.status).toBe(400);
      expect(academicClient.CreateSemester).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid semesterType', async () => {
      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          academicYear: '2025/2026',
          semesterType: 'INVALID',
        });

      expect(res.status).toBe(400);
    });

    it('should return 500 when gRPC throws non-gRPC error', async () => {
      academicClient.CreateSemester.mockImplementation(() => {
        throw new Error('Internal Server Error');
      });

      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ academicYear: '2025/2026', semesterType: 'GANJIL' });

      expect(res.status).toBe(500);
    });

    it('should return 500 if gRPC call fails without code', async () => {
      academicClient.CreateSemester.mockImplementation((data, callback) => {
        callback(new Error('Unknown error'));
      });

      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          academicYear: '2025/2026',
          semesterType: 'GANJIL',
        });

      expect(res.status).toBe(500);
    });

    it('should handle gRPC ALREADY_EXISTS error', async () => {
      academicClient.CreateSemester.mockImplementation((data, callback) => {
        callback({ code: 6, details: 'Semester sudah ada' });
      });

      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ academicYear: '2025/2026', semesterType: 'GANJIL' });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Semester sudah ada');
    });
  });

  // ═════════════════════════════════════════════════════════════
  // GET / — List All Semesters
  // ═════════════════════════════════════════════════════════════
  describe('GET /', () => {
    it('should return all semesters', async () => {
      const mockSemesters = [
        { id: randomUUID(), academicYear: '2025/2026', semesterType: 'GANJIL' },
        { id: randomUUID(), academicYear: '2025/2026', semesterType: 'GENAP' },
      ];

      academicClient.GetAllSemesters.mockImplementation((data, callback) => {
        callback(null, { semesters: mockSemesters });
      });

      const res = await request(app)
        .get(API)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(academicClient.GetAllSemesters).toHaveBeenCalled();
    });

    it('should handle gRPC error', async () => {
      academicClient.GetAllSemesters.mockImplementation((data, callback) => {
        callback({ code: 13, details: 'Internal error' });
      });

      const res = await request(app)
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
    });

    it('should return 500 when gRPC throws non-gRPC error', async () => {
      academicClient.GetAllSemesters.mockImplementation(() => {
        throw new Error('Internal Server Error');
      });

      const res = await request(app)
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
    });
  });

  // ═════════════════════════════════════════════════════════════
  // GET /:id — Semester Details
  // ═════════════════════════════════════════════════════════════
  describe('GET /:id', () => {
    it('should return semester details', async () => {
      const id = randomUUID();
      const mockSemester = { id, academicYear: '2025/2026', semesterType: 'GANJIL' };

      academicClient.GetSemesterById.mockImplementation((data, callback) => {
        callback(null, { semester: mockSemester });
      });

      const res = await request(app)
        .get(`${API}/${id}`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(id);
      expect(academicClient.GetSemesterById).toHaveBeenCalledWith({ id }, expect.any(Function));
    });

    it('should return 404 if not found', async () => {
      academicClient.GetSemesterById.mockImplementation((data, callback) => {
        callback({ code: 5, details: 'Not found' });
      });

      const res = await request(app)
        .get(`${API}/${randomUUID()}`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 500 when gRPC throws non-gRPC error', async () => {
      academicClient.GetSemesterById.mockImplementation(() => {
        throw new Error('Internal Server Error');
      });

      const res = await request(app)
        .get(`${API}/${randomUUID()}`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(500);
    });
  });

  // ═════════════════════════════════════════════════════════════
  // GET /active — Active Semester
  // ═════════════════════════════════════════════════════════════
  describe('GET /active', () => {
    it('should return the active semester', async () => {
      const mockSemester = { id: randomUUID(), isActive: true, status: 'OPEN' };

      academicClient.GetActiveSemester.mockImplementation((data, callback) => {
        callback(null, { semester: mockSemester });
      });

      const res = await request(app)
        .get(`${API}/active`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('OPEN');
    });

    it('should return null when no active semester', async () => {
      academicClient.GetActiveSemester.mockImplementation((data, callback) => {
        callback(null, { semester: null });
      });

      const res = await request(app)
        .get(`${API}/active`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeUndefined();
    });

    it('should handle gRPC error', async () => {
      academicClient.GetActiveSemester.mockImplementation((data, callback) => {
        callback({ code: 13, details: 'Error' });
      });

      const res = await request(app)
        .get(`${API}/active`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(500);
    });

    it('should return 500 when gRPC throws non-gRPC error', async () => {
      academicClient.GetActiveSemester.mockImplementation(() => {
        throw new Error('Internal Server Error');
      });

      const res = await request(app)
        .get(`${API}/active`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(500);
    });
  });

  // ═════════════════════════════════════════════════════════════
  // PUT /:id — Update Semester
  // ═════════════════════════════════════════════════════════════
  describe('PUT /:id', () => {
    it('should update semester successfully', async () => {
      const id = randomUUID();
      const mockSemester = { id, maxSks: 20 };

      academicClient.UpdateSemester.mockImplementation((data, callback) => {
        callback(null, { semester: mockSemester });
      });

      const res = await request(app)
        .put(`${API}/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ maxSks: 20 });

      expect(res.status).toBe(200);
      expect(res.body.data.maxSks).toBe(20);
      expect(academicClient.UpdateSemester).toHaveBeenCalledWith(
        expect.objectContaining({ id, maxSks: 20 }),
        expect.any(Function)
      );
    });

    it('should return 400 for validation error', async () => {
      const res = await request(app)
        .put(`${API}/${randomUUID()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ maxSks: 50 }); // max is usually 36

      expect(res.status).toBe(400);
    });

    it('should return 500 when gRPC throws non-gRPC error', async () => {
      academicClient.UpdateSemester.mockImplementation(() => {
        throw new Error('Internal Server Error');
      });

      const res = await request(app)
        .put(`${API}/${randomUUID()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ maxSks: 20 });

      expect(res.status).toBe(500);
    });
  });

  // ═════════════════════════════════════════════════════════════
  // PATCH /:id/status — Update Status
  // ═════════════════════════════════════════════════════════════
  describe('PATCH /:id/status', () => {
    it('should update status successfully', async () => {
      const id = randomUUID();
      const mockSemester = { id, status: 'OPEN' };

      academicClient.UpdateStatus.mockImplementation((data, callback) => {
        callback(null, { semester: mockSemester });
      });

      const res = await request(app)
        .patch(`${API}/${id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'OPEN' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('OPEN');
    });

    it('should handle FAILED_PRECONDITION from gRPC', async () => {
      const id = randomUUID();
      academicClient.UpdateStatus.mockImplementation((data, callback) => {
        callback({ code: 9, details: 'Tidak dapat membuka semester baru' });
      });

      const res = await request(app)
        .patch(`${API}/${id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'OPEN' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Tidak dapat membuka semester baru');
    });

    it('should return 400 for invalid status in validation', async () => {
      const res = await request(app)
        .patch(`${API}/${randomUUID()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(res.status).toBe(400);
    });
  });

  // ═════════════════════════════════════════════════════════════
  // GET /:id/closing-readiness
  // ═════════════════════════════════════════════════════════════
  describe('GET /:id/closing-readiness', () => {
    it('should return readiness details', async () => {
      const id = randomUUID();
      const mockReadiness = {
        semester: { id },
        summary: { totalClasses: 10, gradedClasses: 8, isReady: false },
        classes: [],
      };

      academicClient.GetClosingReadiness.mockImplementation((data, callback) => {
        callback(null, mockReadiness);
      });

      const res = await request(app)
        .get(`${API}/${id}/closing-readiness`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.isReady).toBe(false);
    });
  });

  // ═════════════════════════════════════════════════════════════
  // DELETE /:id
  // ═════════════════════════════════════════════════════════════
  describe('DELETE /:id', () => {
    it('should delete semester successfully', async () => {
      academicClient.DeleteSemester.mockImplementation((data, callback) => {
        callback(null, { success: true, message: 'Semester berhasil dihapus' });
      });

      const res = await request(app)
        .delete(`${API}/${randomUUID()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/berhasil dihapus/);
    });

    it('should return 500 when gRPC throws non-gRPC error', async () => {
      academicClient.DeleteSemester.mockImplementation(() => {
        throw new Error('Internal Server Error');
      });

      const res = await request(app)
        .delete(`${API}/${randomUUID()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
    });
  });

  // ═════════════════════════════════════════════════════════════
  // GET /student-semesters
  // ═════════════════════════════════════════════════════════════
  describe('GET /student-semesters', () => {
    it('should return student specific semesters', async () => {
      const mockSemesters = [{ id: randomUUID(), academicYear: '2025/2026' }];

      academicClient.GetStudentSemesters.mockImplementation((data, callback) => {
        callback(null, { semesters: mockSemesters });
      });

      const res = await request(app)
        .get(`${API}/student-semesters`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(academicClient.GetStudentSemesters).toHaveBeenCalledWith(
        expect.objectContaining({ studentId: mhsUser.id }),
        expect.any(Function)
      );
    });

    it('should return 500 when gRPC throws non-gRPC error', async () => {
      academicClient.GetStudentSemesters.mockImplementation(() => {
        throw new Error('Internal Server Error');
      });

      const res = await request(app)
        .get(`${API}/student-semesters`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(500);
    });
  });

  // ═════════════════════════════════════════════════════════════
  // gRPC Service Implementation (Direct Handler Tests)
  // ═════════════════════════════════════════════════════════════
  describe('gRPC Service Implementation', () => {
    const mockCallback = (resolve, reject) => (err, response) => {
      if (err) reject(err);
      else resolve(response);
    };

    const callService = (method, request = {}) => {
      return new Promise((resolve, reject) => {
        academicService[method]({ request }, mockCallback(resolve, reject));
      });
    };

    beforeEach(async () => {
      await cleanDatabase();
    });

    it('GetAllSemesters: should return empty list initially', async () => {
      const res = await callService('GetAllSemesters');
      expect(res.semesters).toHaveLength(0);
    });

    it('CreateSemester & GetActiveSemester flow', async () => {
      // 1. Create DRAFT
      const createRes = await callService('CreateSemester', {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
        maxSks: 24,
      });
      expect(createRes.semester.status).toBe('DRAFT');

      // 2. Check active (should be null)
      const active1 = await callService('GetActiveSemester');
      expect(active1.semester).toBeNull();

      // 3. Update Status to OPEN
      await callService('UpdateStatus', { id: createRes.semester.id, newStatus: 'OPEN' });

      // 4. Check active again
      const active2 = await callService('GetActiveSemester');
      expect(active2.semester.id).toBe(createRes.semester.id);
      expect(active2.semester.isActive).toBe(true);
    });

    it('UpdateStatus: should enforce valid transitions', async () => {
      const sem = (await callService('CreateSemester', {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
      })).semester;

      // DRAFT -> CLOSED (Invalid)
      await expect(callService('UpdateStatus', { id: sem.id, newStatus: 'CLOSED' }))
        .rejects.toMatchObject({ code: 9 }); // FAILED_PRECONDITION

      // DRAFT -> OPEN (Valid)
      await callService('UpdateStatus', { id: sem.id, newStatus: 'OPEN' });

      // OPEN -> DRAFT (Invalid)
      await expect(callService('UpdateStatus', { id: sem.id, newStatus: 'DRAFT' }))
        .rejects.toMatchObject({ code: 9 });
    });

    it('DeleteSemester: should only allow deleting DRAFT with no classes', async () => {
      const sem = (await callService('CreateSemester', {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
      })).semester;

      // 1. Delete DRAFT (Valid)
      await callService('DeleteSemester', { id: sem.id });
      const all = await callService('GetAllSemesters');
      expect(all.semesters).toHaveLength(0);

      // 2. Try delete non-existent
      await expect(callService('DeleteSemester', { id: sem.id }))
        .rejects.toMatchObject({ code: 5 }); // NOT_FOUND
    });

    it('GetClosingReadiness: should report issues if grades are missing', async () => {
      const sem = (await callService('CreateSemester', {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
      })).semester;

      // Seeding a class with no grades
      const { user: teacher } = await createDosen();
      const course = await import('../helpers/prisma.js').then(m => m.default.course.create({
        data: { title: 'Test', code: 'T1', semester: 1, sks: 3, teacherId: teacher.id }
      }));
      const cls = await import('../helpers/prisma.js').then(m => m.default.class.create({
        data: { courseId: course.id, lecturerId: teacher.id, academicSemesterId: sem.id, section: 'A' }
      }));
      
      // Student enrolled but no grade
      const student = await createMahasiswa();
      await import('../helpers/prisma.js').then(m => m.default.krsEnrollment.create({
        data: { studentId: student.user.id, classId: cls.id, status: 'APPROVED' }
      }));

      const readiness = await callService('GetClosingReadiness', { id: sem.id });
      expect(readiness.summary.isReady).toBe(false);
      expect(readiness.summary.totalMissing).toBe(1);
    });

    it('GetStudentSemesters: should return relevant semesters for student', async () => {
      const sem = (await callService('CreateSemester', {
        academicYear: '2024/2025',
        semesterType: 'GANJIL',
      })).semester;
      await callService('UpdateStatus', { id: sem.id, newStatus: 'OPEN' });

      const mhs = await createMahasiswa();
      const res = await callService('GetStudentSemesters', { studentId: mhs.user.id });
      
      // Since it's OPEN, it should be included even if not enrolled yet
      expect(res.semesters).toHaveLength(1);
      expect(res.semesters[0].id).toBe(sem.id);
    });

    it('GetSemesterById: should return semester details', async () => {
      const sem = (await callService('CreateSemester', {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
      })).semester;

      const res = await callService('GetSemesterById', { id: sem.id });
      expect(res.semester.id).toBe(sem.id);
    });

    it('UpdateSemester: should update fields correctly', async () => {
      const sem = (await callService('CreateSemester', {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
      })).semester;

      const updated = await callService('UpdateSemester', {
        id: sem.id,
        maxSks: 30,
      });
      expect(updated.semester.maxSks).toBe(30);
    });

    it('UpdateStatus: OPEN -> CLOSED should work when ready', async () => {
      const sem = (await callService('CreateSemester', {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
      })).semester;

      await callService('UpdateStatus', { id: sem.id, newStatus: 'OPEN' });
      
      // Since no students are enrolled, missingGradeCount is 0, so it's ready
      const res = await callService('UpdateStatus', { id: sem.id, newStatus: 'CLOSED' });
      expect(res.semester.status).toBe('CLOSED');
      expect(res.semester.isActive).toBe(false);
    });

    it('UpdateStatus: OPEN -> CLOSED should fail when grades are missing', async () => {
      const sem = (await callService('CreateSemester', {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
      })).semester;
      await callService('UpdateStatus', { id: sem.id, newStatus: 'OPEN' });

      // Seeding a class with no grades
      const { user: teacher } = await createDosen();
      const course = await import('../helpers/prisma.js').then(m => m.default.course.create({
        data: { title: 'Test', code: 'T3', semester: 1, sks: 3, teacherId: teacher.id }
      }));
      const cls = await import('../helpers/prisma.js').then(m => m.default.class.create({
        data: { courseId: course.id, lecturerId: teacher.id, academicSemesterId: sem.id, section: 'A' }
      }));
      
      // Student enrolled but no grade
      const student = await createMahasiswa();
      await import('../helpers/prisma.js').then(m => m.default.krsEnrollment.create({
        data: { studentId: student.user.id, classId: cls.id, status: 'APPROVED' }
      }));

      await expect(callService('UpdateStatus', { id: sem.id, newStatus: 'CLOSED' }))
        .rejects.toMatchObject({ 
          code: 9,
          details: expect.stringContaining('belum memiliki nilai akhir')
        });
    });

    it('UpdateSemester: should fail if semester is CLOSED', async () => {
      const sem = (await callService('CreateSemester', {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
      })).semester;

      await callService('UpdateStatus', { id: sem.id, newStatus: 'OPEN' });
      await callService('UpdateStatus', { id: sem.id, newStatus: 'CLOSED' });

      await expect(callService('UpdateSemester', { id: sem.id, maxSks: 30 }))
        .rejects.toMatchObject({ code: 9 });
    });

    it('UpdateStatus: should fail if another semester is already OPEN', async () => {
      const sem1 = (await callService('CreateSemester', {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
      })).semester;
      const sem2 = (await callService('CreateSemester', {
        academicYear: '2025/2026',
        semesterType: 'GENAP',
      })).semester;

      await callService('UpdateStatus', { id: sem1.id, newStatus: 'OPEN' });

      await expect(callService('UpdateStatus', { id: sem2.id, newStatus: 'OPEN' }))
        .rejects.toMatchObject({ 
          code: 9,
          details: expect.stringContaining('Sudah ada semester OPEN')
        });
    });

    it('DeleteSemester: should fail if status is not DRAFT', async () => {
      const sem = (await callService('CreateSemester', {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
      })).semester;

      await callService('UpdateStatus', { id: sem.id, newStatus: 'OPEN' });

      await expect(callService('DeleteSemester', { id: sem.id }))
        .rejects.toMatchObject({ code: 9 });
    });

    it('DeleteSemester: should fail if it has classes', async () => {
      const sem = (await callService('CreateSemester', {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
      })).semester;

      const { user: teacher } = await createDosen();
      const course = await import('../helpers/prisma.js').then(m => m.default.course.create({
        data: { title: 'Test', code: 'T2', semester: 1, sks: 3, teacherId: teacher.id }
      }));
      await import('../helpers/prisma.js').then(m => m.default.class.create({
        data: { courseId: course.id, lecturerId: teacher.id, academicSemesterId: sem.id, section: 'A' }
      }));

      await expect(callService('DeleteSemester', { id: sem.id }))
        .rejects.toMatchObject({ code: 9 });
    });

    it('gRPC Handlers should handle unexpected errors', async () => {
      // We force a prisma error by passing invalid ID (not a string)
      await expect(callService('GetSemesterById', { id: { some: 'object' } }))
        .rejects.toMatchObject({ code: 13 });
      
      await expect(callService('UpdateSemester', { id: { some: 'object' }, maxSks: 20 }))
        .rejects.toMatchObject({ code: 13 });

      await expect(callService('UpdateStatus', { id: { some: 'object' }, newStatus: 'OPEN' }))
        .rejects.toMatchObject({ code: 13 });

      await expect(callService('DeleteSemester', { id: { some: 'object' } }))
        .rejects.toMatchObject({ code: 13 });

      await expect(callService('GetClosingReadiness', { id: { some: 'object' } }))
        .rejects.toMatchObject({ code: 13 });
    });
  });
});
