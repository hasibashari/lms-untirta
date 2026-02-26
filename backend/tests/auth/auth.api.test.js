/**
 * Auth API — Integration Tests
 *
 * Tests the auth endpoints against a real test database.
 *
 * What we test:
 *   ✓ POST /api/auth/register — register new user
 *   ✓ POST /api/auth/login — login with credentials
 *   ✓ GET /api/auth/me — get current user profile
 *   ✓ Validation — missing/invalid fields
 *   ✓ Error handling — duplicate email, wrong password
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { getApp } from '../helpers/request.js';
import { cleanDatabase } from '../helpers/db.js';
import { createMahasiswa } from '../helpers/auth.js';

const app = getApp();

describe('Auth API — /api/auth', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  // ═══════════════════════════════════════════════════════════
  // POST /api/auth/register
  // ═══════════════════════════════════════════════════════════
  describe('POST /api/auth/register', () => {
    const validPayload = {
      email: 'newstudent@test.com',
      password: 'password123',
      name: 'Test Student',
    };

    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          email: validPayload.email,
          name: validPayload.name,
          role: 'MAHASISWA', // default role
        })
      );
      // Password should NOT be in response
      expect(res.body.data.password).toBeUndefined();
    });

    it('should return 409 for duplicate email', async () => {
      // Register first time
      await request(app).post('/api/auth/register').send(validPayload);

      // Try again
      const res = await request(app)
        .post('/api/auth/register')
        .send(validPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for missing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password123', name: 'No Email' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'x@test.com', password: '123', name: 'Short Pass' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for short name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'x@test.com', password: 'password123', name: 'AB' });

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // POST /api/auth/login
  // ═══════════════════════════════════════════════════════════
  describe('POST /api/auth/login', () => {
    it('should login with correct credentials and return token', async () => {
      const { user, plainPassword } = await createMahasiswa({
        email: 'login-test@test.com',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: plainPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toEqual(
        expect.objectContaining({
          id: user.id,
          email: user.email,
          role: 'MAHASISWA',
        })
      );
    });

    it('should return 401 for wrong email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for wrong password', async () => {
      const { user } = await createMahasiswa({ email: 'wrongpass@test.com' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/auth/me
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const { user, token } = await createMahasiswa({ email: 'me@test.com' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          id: user.id,
          email: user.email,
        })
      );
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('should return 403 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-xyz');

      expect(res.status).toBe(403);
    });
  });
});
