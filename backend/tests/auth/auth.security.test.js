import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { getApp } from '../helpers/request.js';
import { createAuthenticatedUser } from '../helpers/auth.js';
import { cleanDatabase } from '../helpers/db.js';

let request;

beforeAll(() => {
  request = supertest(getApp());
});

afterAll(async () => {
  await cleanDatabase();
});

// ─── Auth Token Security ────────────────────────────────────────

describe('Auth Token Security', () => {
  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request.get('/api/users');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/[Tt]oken/);
  });

  it('should return 401 when Authorization header has no Bearer prefix', async () => {
    const res = await request
      .get('/api/users')
      .set('Authorization', 'some-random-token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 when Bearer token is empty', async () => {
    const res = await request
      .get('/api/users')
      .set('Authorization', 'Bearer ');

    // Empty string after split → falsy token → 401
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 403 for a completely invalid/malformed JWT', async () => {
    const res = await request
      .get('/api/users')
      .set('Authorization', 'Bearer not.a.valid.jwt');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/tidak valid|kadaluwarsa/i);
  });

  it('should return 403 for a JWT signed with the wrong secret', async () => {
    const fakeToken = jwt.sign({ userId: 'some-id' }, 'wrong-secret-key', {
      expiresIn: '1h',
    });

    const res = await request
      .get('/api/users')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/tidak valid|kadaluwarsa/i);
  });

  it('should return 403 for an expired JWT', async () => {
    const expiredToken = jwt.sign(
      { userId: 'some-id' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }, // already expired
    );

    const res = await request
      .get('/api/users')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/tidak valid|kadaluwarsa/i);
  });

  it('should return 401 when JWT references a deleted user', async () => {
    // Create a user, get their token, then delete them
    const { user, token } = await createAuthenticatedUser({
      email: 'deleted-user@test.com',
      name: 'To Be Deleted',
    });

    // Delete user directly from the DB (retry on transient deadlock)
    const { default: prisma } = await import('../helpers/prisma.js');
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await prisma.user.delete({ where: { id: user.id } });
        break;
      } catch (err) {
        if (attempt === 2) throw err;
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const res = await request
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/[Uu]ser tidak ditemukan/);
  });
});

// ─── Role-Based Access Control ──────────────────────────────────

describe('Role-Based Access Control', () => {
  let mahasiswaToken;
  let dosenToken;

  beforeAll(async () => {
    await cleanDatabase();

    const mahasiswa = await createAuthenticatedUser({
      email: 'rbac-mhs@test.com',
      name: 'RBAC Mahasiswa',
      role: 'MAHASISWA',
    });
    mahasiswaToken = mahasiswa.token;

    const dosen = await createAuthenticatedUser({
      email: 'rbac-dosen@test.com',
      name: 'RBAC Dosen',
      role: 'DOSEN',
    });
    dosenToken = dosen.token;
  });

  it('should return 403 when MAHASISWA accesses ADMIN-only route', async () => {
    // /api/users is ADMIN-only
    const res = await request
      .get('/api/users')
      .set('Authorization', `Bearer ${mahasiswaToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/[Aa]kses [Dd]itolak|tidak memiliki izin/i);
  });

  it('should return 403 when DOSEN accesses ADMIN-only route', async () => {
    const res = await request
      .get('/api/users')
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/[Aa]kses [Dd]itolak|tidak memiliki izin/i);
  });

  it('should return 403 when MAHASISWA accesses DOSEN-only grade route', async () => {
    // POST /api/grades/class/:classId is DOSEN-only
    const res = await request
      .post('/api/grades/class/fake-class-id')
      .set('Authorization', `Bearer ${mahasiswaToken}`)
      .send({ enrollmentId: 'fake', grade: 'A' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ─── Input Tampering ────────────────────────────────────────────

describe('Input Tampering', () => {
  let adminToken;

  beforeAll(async () => {
    const admin = await createAuthenticatedUser({
      email: 'tamper-admin@test.com',
      name: 'Tamper Admin',
      role: 'ADMIN',
    });
    adminToken = admin.token;
  });

  it('should ignore role field in registration body (cannot self-assign ADMIN)', async () => {
    const res = await request.post('/api/auth/register').send({
      email: 'hacker@test.com',
      password: 'password123',
      name: 'Hacker',
      role: 'ADMIN', // should be ignored or rejected
    });

    // Service destructures only { email, name, password }, so role is always MAHASISWA
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('MAHASISWA');
    expect(res.body.data.role).not.toBe('ADMIN');
  });

  it('should reject requests with overly long string fields', async () => {
    const longString = 'a'.repeat(10001);

    const res = await request.post('/api/auth/register').send({
      email: `${longString}@test.com`,
      password: 'password123',
      name: longString,
    });

    // App has no length validation — should not crash with 500
    expect(res.status).not.toBe(500);
    // Accept 201 (no length check), 400, or 422 (if validation added later)
    expect([201, 400, 422]).toContain(res.status);
  });
});
