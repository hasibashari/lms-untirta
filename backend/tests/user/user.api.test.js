/**
 * User API — Integration Tests
 *
 * Tests the full HTTP request lifecycle:
 *   Route → Middleware → Controller → Service → Database (test DB)
 *
 * Uses:
 *   - supertest for HTTP assertions
 *   - Real test database (lms_db_test)
 *   - cleanDatabase() for isolation between describe blocks
 *   - createAdmin/createDosen/createMahasiswa for auth helpers
 *
 * What we test:
 *   ✓ POST /api/users — create user (admin only)
 *   ✓ GET /api/users — list users with filters
 *   ✓ GET /api/users/:id — get user by ID
 *   ✓ PATCH /api/users/:id/dospem-status — toggle dospem
 *   ✓ PATCH /api/users/:id/advisor — assign advisor
 *   ✓ Auth/Authz — 401 without token, 403 for non-admin
 */

import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { getApp } from '../helpers/request.js';
import { cleanDatabase } from '../helpers/db.js';
import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';
import { validDosen, validMahasiswa } from '../fixtures/user.fixture.js';

const app = getApp();

describe('User API — /api/users', () => {
  let adminToken;

  beforeEach(async () => {
    await cleanDatabase();
    // Create a fresh admin for each test block
    const admin = await createAdmin();
    adminToken = admin.token;
  });

  // ═══════════════════════════════════════════════════════════
  // Authentication & Authorization
  // ═══════════════════════════════════════════════════════════
  describe('Auth Guards', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 for non-admin (MAHASISWA)', async () => {
      const { token } = await createMahasiswa();

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 for non-admin (DOSEN)', async () => {
      const { token } = await createDosen();

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // POST /api/users — Create User
  // ═══════════════════════════════════════════════════════════
  describe('POST /api/users', () => {
    it('should create a DOSEN user', async () => {
      const payload = validDosen({ email: 'new-dosen@test.com' });

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          email: payload.email,
          name: payload.name,
          role: 'DOSEN',
        })
      );
      // Password should NOT be in response
      expect(res.body.data.password).toBeUndefined();
    });

    it('should create a MAHASISWA user', async () => {
      const payload = validMahasiswa({ email: 'new-mhs@test.com' });

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('MAHASISWA');
    });

    it('should return 409 on duplicate email', async () => {
      const payload = validDosen({ email: 'dup@test.com' });

      // First creation
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      // Duplicate
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('sudah terdaftar');
    });

    it('should return 400 on validation failure (short password)', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'x@test.com', password: '123', name: 'Test', role: 'DOSEN' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 on missing fields', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'partial@test.com' });

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/users — List Users
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/users', () => {
    it('should return all users', async () => {
      await createDosen();
      await createMahasiswa();

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Admin + Dosen + Mahasiswa = at least 3
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by role=DOSEN', async () => {
      await createDosen();
      await createMahasiswa();

      const res = await request(app)
        .get('/api/users?role=DOSEN')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((u) => u.role === 'DOSEN')).toBe(true);
    });

    it('should return 400 for invalid role filter', async () => {
      const res = await request(app)
        .get('/api/users?role=INVALID')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/users/:id — Get User by ID
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/users/:id', () => {
    it('should return user details', async () => {
      const { user } = await createDosen();

      const res = await request(app)
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(user.id);
      expect(res.body.data.email).toBe(user.email);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // PATCH /api/users/:id/dospem-status
  // ═══════════════════════════════════════════════════════════
  describe('PATCH /api/users/:id/dospem-status', () => {
    it('should set isDospem=true for a DOSEN', async () => {
      const { user } = await createDosen();

      const res = await request(app)
        .patch(`/api/users/${user.id}/dospem-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isDospem: true });

      expect(res.status).toBe(200);
      expect(res.body.data.isDospem).toBe(true);
    });

    it('should set isDospem=false to revoke dospem', async () => {
      const { user } = await createDosen({ isDospem: true });

      const res = await request(app)
        .patch(`/api/users/${user.id}/dospem-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isDospem: false });

      expect(res.status).toBe(200);
      expect(res.body.data.isDospem).toBe(false);
    });

    it('should return 400 if user is not DOSEN', async () => {
      const { user } = await createMahasiswa();

      const res = await request(app)
        .patch(`/api/users/${user.id}/dospem-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isDospem: true });

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // PATCH /api/users/:id/advisor — Assign Advisor
  // ═══════════════════════════════════════════════════════════
  describe('PATCH /api/users/:id/advisor', () => {
    it('should assign a dospem to a student', async () => {
      const { user: dosen } = await createDosen({ isDospem: true });
      const { user: student } = await createMahasiswa();

      const res = await request(app)
        .patch(`/api/users/${student.id}/advisor`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ advisorId: dosen.id });

      expect(res.status).toBe(200);
      expect(res.body.data.advisorId).toBe(dosen.id);
      expect(res.body.data.advisor).toEqual(
        expect.objectContaining({ id: dosen.id })
      );
    });

    it('should unassign advisor with null', async () => {
      const { user: dosen } = await createDosen({ isDospem: true });
      const { user: student } = await createMahasiswa();

      // First assign
      await request(app)
        .patch(`/api/users/${student.id}/advisor`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ advisorId: dosen.id });

      // Then unassign
      const res = await request(app)
        .patch(`/api/users/${student.id}/advisor`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ advisorId: null });

      expect(res.status).toBe(200);
      expect(res.body.data.advisorId).toBeNull();
    });

    it('should return 400 if advisor is not a dospem', async () => {
      const { user: dosen } = await createDosen({ isDospem: false });
      const { user: student } = await createMahasiswa();

      const res = await request(app)
        .patch(`/api/users/${student.id}/advisor`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ advisorId: dosen.id });

      expect(res.status).toBe(400);
    });
  });
});
