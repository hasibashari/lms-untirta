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
  });
});
