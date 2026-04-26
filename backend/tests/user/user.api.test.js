/**
 * User API — Integration Tests
 * 
 * This suite tests the Express Gateway routes for the User module.
 * It mocks the gRPC client to verify the Gateway's logic, request validation,
 * and error mapping.
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import request from 'supertest';
import { cleanDatabase } from '../helpers/db.js';
import { createAdmin, createMahasiswa } from '../helpers/auth.js';

// ─── 1. MOCK DEFINITIONS ──────────────────────────────────────────────

const userClientMock = {
  CreateUserByAdmin: jest.fn(),
  GetAllUsers: jest.fn(),
  GetUserById: jest.fn(),
  UpdateUser: jest.fn(),
  DeleteUser: jest.fn(),
  UpdateDospemStatus: jest.fn(),
  AssignAdvisor: jest.fn(),
  BulkAssignAdvisor: jest.fn(),
  GetAdvisorSummary: jest.fn(),
  GetAdvisorStudents: jest.fn(),
  GetAdminStats: jest.fn(),
};

// ─── 2. APPLY MODULE MOCKS (ESM HOISTING) ─────────────────────────────

jest.unstable_mockModule('../../src/grpc/clients/user.client.js', () => ({
  default: userClientMock,
}));

// ─── 3. DYNAMIC IMPORTS ───────────────────────────────────────────────

const { getApp } = await import('../helpers/request.js');
const app = getApp();

const API = '/api/users';
const VALID_UUID_1 = '7b629854-47f3-4211-9e79-509f69747976';
const VALID_UUID_2 = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000000';

describe('User API Integration Tests', () => {
  let adminToken;

  beforeAll(async () => {
    await cleanDatabase();
    const a = await createAdmin();
    adminToken = a.token;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default Success Mock Implementations
    userClientMock.CreateUserByAdmin.mockImplementation((arg, cb) => {
      cb(null, { id: VALID_UUID_1, ...arg });
    });

    userClientMock.GetAllUsers.mockImplementation((arg, cb) => {
      cb(null, { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
    });

    userClientMock.GetUserById.mockImplementation((arg, cb) => {
      if (arg.id === NON_EXISTENT_UUID) {
        return cb({ code: 5, details: 'User tidak ditemukan' }); // NOT_FOUND
      }
      cb(null, { id: arg.id, name: 'Test User', email: 'test@example.com' });
    });

    userClientMock.UpdateUser.mockImplementation((arg, cb) => {
      if (arg.id === NON_EXISTENT_UUID) {
        return cb({ code: 5, details: 'User tidak ditemukan' });
      }
      cb(null, { ...arg });
    });

    userClientMock.DeleteUser.mockImplementation((arg, cb) => {
      if (arg.id === NON_EXISTENT_UUID) {
        return cb({ code: 5, details: 'User tidak ditemukan' });
      }
      cb(null, { id: arg.id });
    });

    userClientMock.UpdateDospemStatus.mockImplementation((arg, cb) => {
      if (arg.id === NON_EXISTENT_UUID) {
        return cb({ code: 5, details: 'User tidak ditemukan' });
      }
      cb(null, { id: arg.id, isDospem: arg.isDospem });
    });

    userClientMock.AssignAdvisor.mockImplementation((arg, cb) => {
      if (arg.studentId === NON_EXISTENT_UUID) {
        return cb({ code: 5, details: 'Mahasiswa tidak ditemukan' });
      }
      cb(null, { id: arg.studentId, advisorId: arg.advisorId });
    });

    userClientMock.BulkAssignAdvisor.mockImplementation((arg, cb) => {
      cb(null, { message: 'Success' });
    });

    userClientMock.GetAdvisorSummary.mockImplementation((arg, cb) => {
      cb(null, { data: [] });
    });

    userClientMock.GetAdvisorStudents.mockImplementation((arg, cb) => {
      if (arg.advisorId === NON_EXISTENT_UUID) {
        return cb({ code: 5, details: 'Dosen tidak ditemukan' });
      }
      cb(null, { advisor: { name: 'Dosen' }, students: [] });
    });

    userClientMock.GetAdminStats.mockImplementation((arg, cb) => {
      cb(null, { totalUsers: 10 });
    });
  });

  // ─── 4. AUTH & ACCESS CONTROL ────────────────────────────────────────

  describe('Auth & Access Control', () => {
    it('should return 401 if no token provided', async () => {
      const res = await request(app).get(API);
      expect(res.status).toBe(401);
    });

    it('should return 403 if non-admin tries to access', async () => {
      const { token } = await createMahasiswa();
      const res = await request(app)
        .get(API)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  // ─── 5. CRUD OPERATIONS ──────────────────────────────────────────────

  describe('CRUD Operations', () => {
    describe('POST /', () => {
      it('201 — should create user successfully', async () => {
        const payload = { email: 'new@test.com', name: 'New User', password: 'password123', role: 'DOSEN' };
        const res = await request(app)
          .post(API)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        expect(res.status).toBe(201);
        expect(userClientMock.CreateUserByAdmin).toHaveBeenCalled();
      });

      it('400 — should return error for invalid email', async () => {
        const res = await request(app)
          .post(API)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ email: 'invalid-email', name: 'Test', password: '123' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('409 — should handle duplicate email error from gRPC', async () => {
        userClientMock.CreateUserByAdmin.mockImplementation((arg, cb) => {
          cb({ code: 6, details: 'Email sudah terdaftar' }); // ALREADY_EXISTS
        });

        const res = await request(app)
          .post(API)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ email: 'existing@test.com', name: 'Existing', password: 'password123', role: 'MAHASISWA' });

        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/terdaftar/);
      });

      it('400 — should return error for missing required fields', async () => {
        const res = await request(app)
          .post(API)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ email: 'test@test.com' }); // Missing name, password, role

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /', () => {
      it('200 — should list users', async () => {
        const res = await request(app)
          .get(API)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(userClientMock.GetAllUsers).toHaveBeenCalled();
      });
    });

    describe('GET /:id', () => {
      it('200 — should get user details', async () => {
        const res = await request(app)
          .get(`${API}/${VALID_UUID_1}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(VALID_UUID_1);
      });

      it('404 — should return error for non-existent user', async () => {
        const res = await request(app)
          .get(`${API}/${NON_EXISTENT_UUID}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/tidak ditemukan/);
      });
    });

    describe('PUT /:id', () => {
      it('200 — should update user', async () => {
        const res = await request(app)
          .put(`${API}/${VALID_UUID_1}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Updated' });

        expect(res.status).toBe(200);
        expect(userClientMock.UpdateUser).toHaveBeenCalled();
      });

      it('404 — should return error if user not found', async () => {
        const res = await request(app)
          .put(`${API}/${NON_EXISTENT_UUID}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Updated' });

        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /:id', () => {
      it('200 — should delete user', async () => {
        const res = await request(app)
          .delete(`${API}/${VALID_UUID_1}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(userClientMock.DeleteUser).toHaveBeenCalled();
      });

      it('404 — should return error if user not found', async () => {
        const res = await request(app)
          .delete(`${API}/${NON_EXISTENT_UUID}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
      });
    });
  });

  // ─── 6. ADVISOR MANAGEMENT ──────────────────────────────────────────

  describe('Advisor Management', () => {
    it('PATCH /:id/dospem-status — should update dospem status', async () => {
      const res = await request(app)
        .patch(`${API}/${VALID_UUID_1}/dospem-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isDospem: true });

      expect(res.status).toBe(200);
      expect(userClientMock.UpdateDospemStatus).toHaveBeenCalled();
    });

    it('PATCH /:id/advisor — should assign advisor', async () => {
      const res = await request(app)
        .patch(`${API}/${VALID_UUID_1}/advisor`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ advisorId: VALID_UUID_2 });

      expect(res.status).toBe(200);
      expect(userClientMock.AssignAdvisor).toHaveBeenCalled();
    });

    it('400 — should return error if advisorId is invalid', async () => {
      const res = await request(app)
        .patch(`${API}/${VALID_UUID_1}/advisor`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ advisorId: 'not-a-uuid' });

      expect(res.status).toBe(400);
    });

    it('PATCH /bulk-advisor — should bulk assign', async () => {
      const res = await request(app)
        .patch(`${API}/bulk-advisor`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ advisorId: VALID_UUID_2, studentIds: [VALID_UUID_1] });

      expect(res.status).toBe(200);
      expect(userClientMock.BulkAssignAdvisor).toHaveBeenCalled();
    });

    it('400 — should return error if studentIds is not an array', async () => {
      const res = await request(app)
        .patch(`${API}/bulk-advisor`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ advisorId: VALID_UUID_2, studentIds: 'not-an-array' });

      expect(res.status).toBe(400);
    });

    it('GET /advisors/:dosenId/students — should return 404 for non-existent advisor', async () => {
      const res = await request(app)
        .get(`${API}/advisors/${NON_EXISTENT_UUID}/students`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── 7. STATISTICS ──────────────────────────────────────────────────

  describe('Statistics', () => {
    it('GET /stats — should get dashboard stats', async () => {
      const res = await request(app)
        .get(`${API}/stats`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(userClientMock.GetAdminStats).toHaveBeenCalled();
    });
  });
});
