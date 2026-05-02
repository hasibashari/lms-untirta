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

// Direct imports for gRPC Service testing
const { userService } = await import('../../src/modules/user/user.grpc-service.js');
const prisma = (await import('../helpers/prisma.js')).default;
const appPrisma = (await import('../../src/config/prisma.js')).default;

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

      it('400 — should return error for invalid role', async () => {
        const res = await request(app)
          .get(API)
          .query({ role: 'INVALID_ROLE' })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Invalid role/);
      });

      it('200 — should filter by role and dospem status', async () => {
        const res = await request(app)
          .get(API)
          .query({ role: 'DOSEN', isDospem: 'true' })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(userClientMock.GetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({ role: 'DOSEN', isDospem: true }),
          expect.any(Function)
        );
      });

      it('500 — should handle gRPC error', async () => {
        userClientMock.GetAllUsers.mockImplementation((arg, cb) => {
          cb({ code: 13, details: 'Internal' }); // INTERNAL
        });

        const res = await request(app)
          .get(API)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
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

    it('400 — should handle INVALID_ARGUMENT from gRPC', async () => {
      userClientMock.UpdateDospemStatus.mockImplementation((arg, cb) => {
        cb({ code: 3, details: 'Invalid' }); // INVALID_ARGUMENT
      });

      const res = await request(app)
        .patch(`${API}/${VALID_UUID_1}/dospem-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isDospem: true });

      expect(res.status).toBe(400);
    });

    it('401 — should handle UNAUTHENTICATED from gRPC', async () => {
      userClientMock.UpdateDospemStatus.mockImplementation((arg, cb) => {
        cb({ code: 16, details: 'Unauthenticated' }); // UNAUTHENTICATED
      });

      const res = await request(app)
        .patch(`${API}/${VALID_UUID_1}/dospem-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isDospem: true });

      expect(res.status).toBe(401);
    });

    it('403 — should handle PERMISSION_DENIED from gRPC', async () => {
      userClientMock.UpdateDospemStatus.mockImplementation((arg, cb) => {
        cb({ code: 7, details: 'Permission Denied' }); // PERMISSION_DENIED
      });

      const res = await request(app)
        .patch(`${API}/${VALID_UUID_1}/dospem-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isDospem: true });

      expect(res.status).toBe(403);
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

    it('GET /advisors/:dosenId/students — should return success', async () => {
      const res = await request(app)
        .get(`${API}/advisors/${VALID_UUID_2}/students`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(userClientMock.GetAdvisorStudents).toHaveBeenCalled();
    });

    it('GET /advisor-summary — should return success', async () => {
      const res = await request(app)
        .get(`${API}/advisor-summary`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(userClientMock.GetAdvisorSummary).toHaveBeenCalled();
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

  // ─── 8. gRPC SERVICE DIRECT TESTS ─────────────────────────────────────
  // Added to achieve >80% total coverage for the user module.
  // These tests call the gRPC handlers directly.

  describe('User gRPC Service Direct', () => {
    const mockCallback = jest.fn();

    beforeEach(async () => {
      await cleanDatabase();
      mockCallback.mockClear();
    });

    it('userService.CreateUserByAdmin — should create user', async () => {
      const call = { request: { email: 'grpc@test.com', name: 'GRPC', password: 'password123', role: 'ADMIN' } };
      await userService.CreateUserByAdmin(call, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ email: 'grpc@test.com' }));
      const user = await prisma.user.findUnique({ where: { email: 'grpc@test.com' } });
      expect(user).toBeTruthy();
    });

    it('userService.CreateUserByAdmin — should return ALREADY_EXISTS', async () => {
      await prisma.user.create({ data: { email: 'exists@test.com', name: 'E', password: '123', role: 'DOSEN' } });
      const call = { request: { email: 'exists@test.com' } };
      await userService.CreateUserByAdmin(call, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 6 }));
    });

    it('userService.GetAllUsers — should return users with pagination', async () => {
      await prisma.user.create({ data: { email: 'u1@t.com', name: 'U1', password: '123', role: 'MAHASISWA' } });
      const call = { request: { skip: 0, take: 10 } };
      await userService.GetAllUsers(call, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ data: expect.any(Array) }));
      expect(mockCallback.mock.calls[0][1].data.length).toBeGreaterThan(0);
    });

    it('userService.GetUserById — should return user', async () => {
      const u = await prisma.user.create({ data: { email: 'u2@t.com', name: 'U2', password: '123', role: 'DOSEN' } });
      const call = { request: { id: u.id } };
      await userService.GetUserById(call, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ id: u.id }));
    });

    it('userService.GetUserById — should return NOT_FOUND', async () => {
      const call = { request: { id: NON_EXISTENT_UUID } };
      await userService.GetUserById(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 5 }));
    });

    it('userService.UpdateUser — should update user fields', async () => {
      const u = await prisma.user.create({ data: { email: 'u3@t.com', name: 'Old', password: '123', role: 'DOSEN' } });
      const call = { request: { id: u.id, name: 'New Name', email: 'newemail@t.com' } };
      await userService.UpdateUser(call, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ name: 'New Name', email: 'newemail@t.com' }));
    });

    it('userService.UpdateUser — should return NOT_FOUND', async () => {
      const call = { request: { id: NON_EXISTENT_UUID, name: 'Fail' } };
      await userService.UpdateUser(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 5 }));
    });

    it('userService.UpdateUser — should return ALREADY_EXISTS if email conflict', async () => {
      await prisma.user.create({ data: { email: 'other@t.com', name: 'Other', password: '123', role: 'DOSEN' } });
      const u = await prisma.user.create({ data: { email: 'me@t.com', name: 'Me', password: '123', role: 'DOSEN' } });
      const call = { request: { id: u.id, email: 'other@t.com' } };
      await userService.UpdateUser(call, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 6 }));
    });

    it('userService.DeleteUser — should remove user', async () => {
      const u = await prisma.user.create({ data: { email: 'u4@t.com', name: 'Del', password: '123', role: 'DOSEN' } });
      const call = { request: { id: u.id } };
      await userService.DeleteUser(call, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ id: u.id }));
      const find = await prisma.user.findUnique({ where: { id: u.id } });
      expect(find).toBeNull();
    });

    it('userService.DeleteUser — should return NOT_FOUND', async () => {
      const call = { request: { id: NON_EXISTENT_UUID } };
      await userService.DeleteUser(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 5 }));
    });

    it('userService.UpdateDospemStatus — should change status', async () => {
      const u = await prisma.user.create({ data: { email: 'd1@t.com', name: 'D1', password: '123', role: 'DOSEN', isDospem: false } });
      const call = { request: { id: u.id, isDospem: true } };
      await userService.UpdateDospemStatus(call, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ isDospem: true }));
    });

    it('userService.UpdateDospemStatus — should fail if not DOSEN', async () => {
      const u = await prisma.user.create({ data: { email: 'm1@t.com', name: 'M1', password: '123', role: 'MAHASISWA' } });
      const call = { request: { id: u.id, isDospem: true } };
      await userService.UpdateDospemStatus(call, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 3 }));
    });

    it('userService.AssignAdvisor — should link student to advisor', async () => {
      const adv = await prisma.user.create({ data: { email: 'adv@t.com', name: 'Adv', password: '123', role: 'DOSEN', isDospem: true } });
      const stu = await prisma.user.create({ data: { email: 'stu@t.com', name: 'Stu', password: '123', role: 'MAHASISWA' } });
      
      const call = { request: { studentId: stu.id, advisorId: adv.id } };
      await userService.AssignAdvisor(call, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ advisorId: adv.id }));
    });

    it('userService.AssignAdvisor — should return INVALID_ARGUMENT if not MAHASISWA', async () => {
      const u1 = await prisma.user.create({ data: { email: 'u1@t.com', name: 'U1', password: '123', role: 'DOSEN' } });
      const call = { request: { studentId: u1.id, advisorId: VALID_UUID_1 } };
      await userService.AssignAdvisor(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 3 }));
    });

    it('userService.AssignAdvisor — should return INVALID_ARGUMENT if advisor not dospem', async () => {
      const adv = await prisma.user.create({ data: { email: 'adv_no@t.com', name: 'AdvNo', password: '123', role: 'DOSEN', isDospem: false } });
      const stu = await prisma.user.create({ data: { email: 'stu2@t.com', name: 'Stu2', password: '123', role: 'MAHASISWA' } });
      
      const call = { request: { studentId: stu.id, advisorId: adv.id } };
      await userService.AssignAdvisor(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 3 }));
    });

    it('userService.BulkAssignAdvisor — should link multiple students', async () => {
      const adv = await prisma.user.create({ data: { email: 'adv2@t.com', name: 'Adv2', password: '123', role: 'DOSEN', isDospem: true } });
      const s1 = await prisma.user.create({ data: { email: 's1@t.com', name: 'S1', password: '123', role: 'MAHASISWA' } });
      const s2 = await prisma.user.create({ data: { email: 's2@t.com', name: 'S2', password: '123', role: 'MAHASISWA' } });
      
      const call = { request: { studentIds: [s1.id, s2.id], advisorId: adv.id } };
      await userService.BulkAssignAdvisor(call, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ updatedCount: 2 }));
    });

    it('userService.BulkAssignAdvisor — should fail if studentIds empty', async () => {
      const call = { request: { studentIds: [], advisorId: VALID_UUID_1 } };
      await userService.BulkAssignAdvisor(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 3 }));
    });

    it('userService.GetAdvisorStudents — should return students', async () => {
      const adv = await prisma.user.create({ data: { email: 'adv4@t.com', name: 'Adv4', password: '123', role: 'DOSEN', isDospem: true } });
      await prisma.user.create({ data: { email: 's3@t.com', name: 'S3', password: '123', role: 'MAHASISWA', advisorId: adv.id } });
      
      const call = { request: { advisorId: adv.id } };
      await userService.GetAdvisorStudents(call, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ students: expect.any(Array) }));
      expect(mockCallback.mock.calls[0][1].students.length).toBe(1);
    });

    it('userService.GetAdvisorSummary — should return counts', async () => {
      await prisma.user.create({ data: { email: 'adv3@t.com', name: 'Adv3', password: '123', role: 'DOSEN', isDospem: true } });
      await userService.GetAdvisorSummary({}, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ data: expect.any(Array) }));
    });

    it('userService.GetAdminStats — should return system stats', async () => {
      await prisma.user.create({ data: { email: 'any@t.com', name: 'A', password: '123', role: 'MAHASISWA' } });
      await userService.GetAdminStats({}, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ totalUsers: expect.any(Number) }));
    });

    it('should handle internal errors in gRPC handlers', async () => {
      const spy = jest.spyOn(appPrisma.user, 'count').mockRejectedValue(new Error('Database error'));
      await userService.GetAdminStats({}, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 13 }));
      spy.mockRestore();
    });
    it('userService.UpdateUser — should update password', async () => {
      const u = await prisma.user.create({ data: { email: 'pw@t.com', name: 'PW', password: 'old', role: 'DOSEN' } });
      const call = { request: { id: u.id, password: 'newpassword' } };
      await userService.UpdateUser(call, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({ id: u.id }));
      const updated = await prisma.user.findUnique({ where: { id: u.id } });
      const match = await (await import('bcryptjs')).default.compare('newpassword', updated.password);
      expect(match).toBe(true);
    });

    it('userService.BulkAssignAdvisor — should fail if > 50 students', async () => {
      const call = { request: { studentIds: Array(51).fill(VALID_UUID_1), advisorId: VALID_UUID_2 } };
      await userService.BulkAssignAdvisor(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 3, details: expect.stringContaining('Maksimal 50') }));
    });

    it('userService.BulkAssignAdvisor — should fail if advisor is not DOSEN', async () => {
      const adv = await prisma.user.create({ data: { email: 'notadv@t.com', name: 'NotAdv', password: '123', role: 'MAHASISWA' } });
      const stu = await prisma.user.create({ data: { email: 's4@t.com', name: 'S4', password: '123', role: 'MAHASISWA' } });
      const call = { request: { studentIds: [stu.id], advisorId: adv.id } };
      await userService.BulkAssignAdvisor(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 3, details: expect.stringContaining('role DOSEN') }));
    });

    it('userService.BulkAssignAdvisor — should fail if some students not found', async () => {
      const adv = await prisma.user.create({ data: { email: 'adv5@t.com', name: 'Adv5', password: '123', role: 'DOSEN', isDospem: true } });
      const call = { request: { studentIds: [NON_EXISTENT_UUID], advisorId: adv.id } };
      await userService.BulkAssignAdvisor(call, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 3, details: expect.stringContaining('bukan mahasiswa atau tidak ditemukan') }));
    });
  });
});
