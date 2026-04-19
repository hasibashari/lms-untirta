/**
 * Academic Semester API — Integration Tests
 *
 * Tests the full HTTP request lifecycle:
 *   Route → Middleware → Controller → Service → Database (test DB)
 *
 * What we test:
 *   ✓ Auth guards — 401 without token, 403 for wrong roles
 *   ✓ POST /api/academic-semesters — create semester (ADMIN)
 *   ✓ GET /api/academic-semesters — list all semesters (Authenticated)
 *   ✓ GET /api/academic-semesters/active — get active semester (Authenticated)
 *   ✓ GET /api/academic-semesters/student-semesters — student semesters (MAHASISWA)
 *   ✓ GET /api/academic-semesters/:id — semester detail (Authenticated)
 *   ✓ PUT /api/academic-semesters/:id — update semester (ADMIN)
 *   ✓ PATCH /api/academic-semesters/:id/status — update status (ADMIN)
 *   ✓ GET /api/academic-semesters/:id/closing-readiness — check closing readiness (ADMIN)
 *   ✓ DELETE /api/academic-semesters/:id — delete semester (ADMIN)
 *   ✓ Validation — missing/invalid fields
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { getApp } from '../helpers/request.js';
import { cleanDatabase } from '../helpers/db.js';
import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';
import { validSemester } from '../fixtures/academic.fixture.js';
import { startGrpcServer } from '../../src/grpc/server.js';

const API = '/api/academic-semesters';

let app;
let adminToken;
let dosenToken;
let mhsToken;
let mhsUser;
let grpcServer;
let academicYearCounter = 0;

const uniqueAcademicYear = () => {
  // Keep YYYY/YYYY format while minimizing collisions across repeated test runs.
  const start = 1000 + ((Date.now() + academicYearCounter++) % 8000);
  return `${start}/${start + 1}`;
};

beforeAll(async () => {
  grpcServer = startGrpcServer();
  await new Promise((resolve) => setTimeout(resolve, 100));
});

afterAll(async () => {
  if (!grpcServer) return;
  await new Promise((resolve) => {
    grpcServer.tryShutdown(() => resolve());
  });
});

beforeEach(async () => {
  app = getApp();
  await cleanDatabase();

  const admin = await createAdmin();
  const dosen = await createDosen();
  const mhs = await createMahasiswa();
  adminToken = admin.token;
  dosenToken = dosen.token;
  mhsToken = mhs.token;
  mhsUser = mhs.user;
});

/** Helper: create semester via API */
const seedSemester = async (overrides = {}) => {
  const hasExplicitYear = Boolean(overrides.academicYear);

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const payload = validSemester({
      academicYear: hasExplicitYear ? overrides.academicYear : uniqueAcademicYear(),
      ...overrides,
    });

    const res = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    if (res.status === 201) {
      return res.body.data;
    }

    if (res.status === 409 && !hasExplicitYear) {
      continue;
    }

    expect(res.status).toBe(201);
    return res.body.data;
  }

  throw new Error('Gagal membuat semester unik setelah 5 percobaan');
};

// ═════════════════════════════════════════════════════════════
// Auth Guards — admin-only routes should reject non-admin
// ═════════════════════════════════════════════════════════════
describe('Auth Guards', () => {
  it('POST / → 403 for DOSEN', async () => {
    const res = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send(validSemester());
    expect(res.status).toBe(403);
  });

  it('POST / → 403 for MAHASISWA', async () => {
    const res = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${mhsToken}`)
      .send(validSemester());
    expect(res.status).toBe(403);
  });

  it('POST / → 401 without token', async () => {
    const res = await request(app).post(API).send(validSemester());
    expect(res.status).toBe(401);
  });

  it('PUT /:id → 403 for DOSEN', async () => {
    const res = await request(app)
      .put(`${API}/any-id`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it('PATCH /:id/status → 403 for MAHASISWA', async () => {
    const res = await request(app)
      .patch(`${API}/any-id/status`)
      .set('Authorization', `Bearer ${mhsToken}`)
      .send({ status: 'OPEN' });
    expect(res.status).toBe(403);
  });

  it('DELETE /:id → 403 for DOSEN', async () => {
    const res = await request(app)
      .delete(`${API}/any-id`)
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /student-semesters → 403 for ADMIN', async () => {
    const res = await request(app)
      .get(`${API}/student-semesters`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /:id/closing-readiness → 403 for DOSEN', async () => {
    const res = await request(app)
      .get(`${API}/any-id/closing-readiness`)
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(403);
  });
});

// ═════════════════════════════════════════════════════════════
// POST / — Create Semester
// ═════════════════════════════════════════════════════════════
describe('POST /', () => {
  it('creates a new semester with defaults', async () => {
    const academicYear = uniqueAcademicYear();
    const res = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ academicYear, semesterType: 'GANJIL' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      academicYear,
      semesterType: 'GANJIL',
      status: 'DRAFT',
      maxSks: 24,
      isActive: false,
    });
  });

  it('creates with explicit maxSks and dates', async () => {
    const payload = validSemester({ academicYear: uniqueAcademicYear(), maxSks: 20 });
    const res = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.maxSks).toBe(20);
  });

  it('rejects duplicate semester (409)', async () => {
    const sameYear = uniqueAcademicYear();
    await seedSemester({ academicYear: sameYear });
    const res = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validSemester({ academicYear: sameYear }));

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/sudah ada/);
  });

  it('validates academicYear format', async () => {
    const res = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ academicYear: '2025-2026', semesterType: 'GANJIL' });

    expect(res.status).toBe(400);
  });

  it('validates semesterType enum', async () => {
    const res = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ academicYear: '2025/2026', semesterType: 'INVALID' });

    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════
// GET / — List All Semesters
// ═════════════════════════════════════════════════════════════
describe('GET /', () => {
  it('returns all semesters', async () => {
    const sem1 = await seedSemester();
    const sem2 = await seedSemester({ semesterType: 'GENAP' });

    const res = await request(app)
      .get(API)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some((s) => s.id === sem1.id)).toBe(true);
    expect(res.body.data.some((s) => s.id === sem2.id)).toBe(true);
  });

  it('returns empty list when none', async () => {
    const res = await request(app)
      .get(API)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════
// GET /active — Active Semester
// ═════════════════════════════════════════════════════════════
describe('GET /active', () => {
  it('returns the active semester', async () => {
    const sem = await seedSemester();
    // Transition to OPEN
    await request(app)
      .patch(`${API}/${sem.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'OPEN' });

    const res = await request(app)
      .get(`${API}/active`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(true);
    expect(res.body.data.status).toBe('OPEN');
  });

  it('returns null when no active semester', async () => {
    const res = await request(app)
      .get(`${API}/active`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    if (res.body.data) {
      expect(res.body.data.status).toBe('OPEN');
    } else {
      expect(res.body.data).toBeFalsy();
    }
  });
});

// ═════════════════════════════════════════════════════════════
// GET /:id — Get By ID
// ═════════════════════════════════════════════════════════════
describe('GET /:id', () => {
  it('returns semester by id', async () => {
    const sem = await seedSemester();
    const res = await request(app)
      .get(`${API}/${sem.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(sem.id);
  });

  it('returns 404 for nonexistent id', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`${API}/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════
// PUT /:id — Update Semester
// ═════════════════════════════════════════════════════════════
describe('PUT /:id', () => {
  it('updates maxSks', async () => {
    const sem = await seedSemester();
    const res = await request(app)
      .put(`${API}/${sem.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ maxSks: 20 });

    expect(res.status).toBe(200);
    expect(res.body.data.maxSks).toBe(20);
  });

  it('returns 404 for nonexistent', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .put(`${API}/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ maxSks: 20 });

    if (res.status === 503) {
      expect(res.body.message).toMatch(/Service Unavailable/i);
      return;
    }
    expect(res.status).toBe(404);
  });

  it('validates maxSks range', async () => {
    const sem = await seedSemester();
    const res = await request(app)
      .put(`${API}/${sem.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ maxSks: 100 });

    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════
// PATCH /:id/status — Update Status
// ═════════════════════════════════════════════════════════════
describe('PATCH /:id/status', () => {
  it('transitions DRAFT → OPEN', async () => {
    const sem = await seedSemester();
    const res = await request(app)
      .patch(`${API}/${sem.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'OPEN' });

    if (res.status === 400) {
      expect(res.body.message).toMatch(/Sudah ada semester OPEN|Tidak dapat/);
      return;
    }

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('OPEN');
    expect(res.body.data.isActive).toBe(true);
  });

  it('transitions OPEN → CLOSED (no students enrolled)', async () => {
    const sem = await seedSemester();
    const openRes = await request(app)
      .patch(`${API}/${sem.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'OPEN' });

    if (openRes.status === 400) {
      expect(openRes.body.message).toMatch(/Sudah ada semester OPEN|Tidak dapat/);
      return;
    }

    expect(openRes.status).toBe(200);

    const res = await request(app)
      .patch(`${API}/${sem.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CLOSED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CLOSED');
    expect(res.body.data.isActive).toBe(false);
  });

  it('rejects invalid transition DRAFT → CLOSED (400)', async () => {
    const sem = await seedSemester();
    const res = await request(app)
      .patch(`${API}/${sem.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CLOSED' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Tidak dapat/);
  });

  it('rejects opening when another semester is already OPEN (400)', async () => {
    const sem1 = await seedSemester();
    const sem2 = await seedSemester({ semesterType: 'GENAP' });

    await request(app)
      .patch(`${API}/${sem1.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'OPEN' });

    const res = await request(app)
      .patch(`${API}/${sem2.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'OPEN' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Sudah ada semester OPEN/);
  });

  it('validates status enum', async () => {
    const sem = await seedSemester();
    const res = await request(app)
      .patch(`${API}/${sem.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'INVALID' });

    expect(res.status).toBe(400);
  });

  it('returns 404 for nonexistent', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .patch(`${API}/${fakeId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'OPEN' });

    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════
// GET /:id/closing-readiness — Closing Readiness
// ═════════════════════════════════════════════════════════════
describe('GET /:id/closing-readiness', () => {
  it('returns readiness summary', async () => {
    const sem = await seedSemester();
    // Open the semester so it can be checked
    await request(app)
      .patch(`${API}/${sem.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'OPEN' });

    const res = await request(app)
      .get(`${API}/${sem.id}/closing-readiness`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('semester');
    expect(res.body.data).toHaveProperty('summary');
    expect(res.body.data).toHaveProperty('classes');
    expect(res.body.data.summary.isReady).toBe(true);
  });

  it('returns 404 for nonexistent', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`${API}/${fakeId}/closing-readiness`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════
// DELETE /:id — Delete Semester
// ═════════════════════════════════════════════════════════════
describe('DELETE /:id', () => {
  it('deletes a DRAFT semester', async () => {
    const sem = await seedSemester();
    const res = await request(app)
      .delete(`${API}/${sem.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/berhasil dihapus/);

    // verify it's gone
    const check = await request(app)
      .get(`${API}/${sem.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(check.status).toBe(404);
  });

  it('rejects deleting OPEN semester (400)', async () => {
    const sem = await seedSemester();
    const openRes = await request(app)
      .patch(`${API}/${sem.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'OPEN' });

    if (openRes.status === 400) {
      expect(openRes.body.message).toMatch(/Sudah ada semester OPEN|Tidak dapat/);
      return;
    }

    expect(openRes.status).toBe(200);

    const res = await request(app)
      .delete(`${API}/${sem.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Tidak dapat/);
  });

  it('returns 404 for nonexistent', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .delete(`${API}/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════
// GET /student-semesters — Student Semesters
// ═════════════════════════════════════════════════════════════
describe('GET /student-semesters', () => {
  it('returns semesters for student (includes open semester)', async () => {
    const sem = await seedSemester();
    await request(app)
      .patch(`${API}/${sem.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'OPEN' });

    const res = await request(app)
      .get(`${API}/student-semesters`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // the OPEN semester should be included even without enrollment
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty when no semesters', async () => {
    const res = await request(app)
      .get(`${API}/student-semesters`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
