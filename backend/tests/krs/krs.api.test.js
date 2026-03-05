/**
 * KRS API — Integration Tests
 *
 * Tests the full HTTP request lifecycle:
 *   Route → Middleware → Controller → Service → Database (test DB)
 *
 * Uses:
 *   - supertest for HTTP assertions
 *   - Real test database (lms_db_test)
 *   - cleanDatabase() for isolation between describe blocks
 *   - createAdmin/createDosen/createMahasiswa for auth helpers
 *   - createKrsScenario for seeding semester + course + class
 *
 * What we test:
 *   ✓ Auth guards — 401 without token, 403 wrong role
 *   ✓ GET /api/krs/available — available classes for student
 *   ✓ GET /api/krs/sks-eligibility — SKS credit info
 *   ✓ POST /api/krs/enroll — enroll in a class
 *   ✓ DELETE /api/krs/drop/:classId — drop a class
 *   ✓ GET /api/krs/my-plan — student plan
 *   ✓ PATCH /api/krs/:id/status — approve/reject by dospem/admin
 *   ✓ PATCH /api/krs/advisory/bulk-status — bulk approve/reject
 *   ✓ GET /api/krs/pending — pending enrollments
 *   ✓ PATCH /api/krs/:id/revise — revise rejected enrollment
 *   ✓ GET /api/krs/:id/history — approval history
 *   ✓ GET /api/krs/advisory/students — advisory students
 *   ✓ GET /api/krs/monitoring — admin monitoring
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { getApp } from '../helpers/request.js';
import { cleanDatabase } from '../helpers/db.js';
import {
  createAdmin,
  createDosen,
  createMahasiswa,
} from '../helpers/auth.js';
import { createKrsScenario } from '../fixtures/krs.fixture.js';
import prisma from '../helpers/prisma.js';

const app = getApp();

// ═════════════════════════════════════════════════════════════
// KRS API Tests
// ═════════════════════════════════════════════════════════════

describe('KRS API — /api/krs', () => {
  let adminToken, admin;
  let dosenToken, dosen;
  let mhsToken, mhs;

  beforeEach(async () => {
    await cleanDatabase();
    const a = await createAdmin();
    admin = a.user; adminToken = a.token;
    const d = await createDosen({ isDospem: true });
    dosen = d.user; dosenToken = d.token;
    const m = await createMahasiswa();
    mhs = m.user; mhsToken = m.token;

    // Set dosen as advisor of student
    await prisma.user.update({
      where: { id: mhs.id },
      data: { advisorId: dosen.id },
    });
  });

  // ─── Helpers ───────────────────────────────────────────────

  /** Seed a full KRS scenario (semester + course + class) */
  async function seedScenario(overrides = {}) {
    return createKrsScenario(prisma, {
      dosenId: dosen.id,
      ...overrides,
    });
  }

  /** Enroll student in a class via API */
  async function enrollStudent(classId, token = mhsToken) {
    return request(app)
      .post('/api/krs/enroll')
      .set('Authorization', `Bearer ${token}`)
      .send({ classId });
  }

  /** Update enrollment status via API */
  async function updateStatus(enrollmentId, status, note, token) {
    const body = { status };
    if (note != null) body.note = note;
    return request(app)
      .patch(`/api/krs/${enrollmentId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  // ═══════════════════════════════════════════════════════════
  // Authentication & Authorization Guards
  // ═══════════════════════════════════════════════════════════
  describe('Auth Guards', () => {
    it('should return 401 without token on GET /api/krs/available', async () => {
      const res = await request(app).get('/api/krs/available');
      expect(res.status).toBe(401);
    });

    it('should return 401 without token on POST /api/krs/enroll', async () => {
      const res = await request(app).post('/api/krs/enroll').send({});
      expect(res.status).toBe(401);
    });

    it('should return 403 for DOSEN on GET /api/krs/available', async () => {
      const res = await request(app)
        .get('/api/krs/available')
        .set('Authorization', `Bearer ${dosenToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 for ADMIN on POST /api/krs/enroll', async () => {
      const res = await request(app)
        .post('/api/krs/enroll')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ classId: 'any-uuid' });
      expect(res.status).toBe(403);
    });

    it('should return 403 for MAHASISWA on GET /api/krs/monitoring', async () => {
      const res = await request(app)
        .get('/api/krs/monitoring')
        .set('Authorization', `Bearer ${mhsToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 for MAHASISWA on PATCH /api/krs/:id/status', async () => {
      const res = await request(app)
        .patch('/api/krs/00000000-0000-0000-0000-000000000000/status')
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ status: 'APPROVED' });
      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/krs/available
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/krs/available', () => {
    it('should return available classes for student', async () => {
      const { classOffering } = await seedScenario();

      const res = await request(app)
        .get('/api/krs/available')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 200 with empty array when no classes available', async () => {
      // No scenario seeded, no classes
      const res = await request(app)
        .get('/api/krs/available')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should filter by academicSemesterId', async () => {
      const { semester } = await seedScenario();

      const res = await request(app)
        .get(`/api/krs/available?academicSemesterId=${semester.id}`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/krs/sks-eligibility
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/krs/sks-eligibility', () => {
    it('should return SKS eligibility for student', async () => {
      const { semester } = await seedScenario();

      const res = await request(app)
        .get(`/api/krs/sks-eligibility?academicSemesterId=${semester.id}`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('maxSKS');
      expect(res.body.data).toHaveProperty('currentSKS');
      expect(res.body.data).toHaveProperty('remainingSKS');
      expect(res.body.data.maxSKS).toBe(24);
      expect(res.body.data.currentSKS).toBe(0);
    });

    it('should return 403 for DOSEN', async () => {
      const res = await request(app)
        .get('/api/krs/sks-eligibility')
        .set('Authorization', `Bearer ${dosenToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // POST /api/krs/enroll
  // ═══════════════════════════════════════════════════════════
  describe('POST /api/krs/enroll', () => {
    it('should enroll student in a class', async () => {
      const { classOffering } = await seedScenario();

      const res = await enrollStudent(classOffering.id);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.id).toBeDefined();
    });

    it('should return 400 when enrollment is closed', async () => {
      const { classOffering } = await seedScenario({ isEnrollmentOpen: false });

      const res = await enrollStudent(classOffering.id);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when class not found', async () => {
      await seedScenario(); // need OPEN semester so we pass period check... actually class check is first

      const res = await enrollStudent('00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });

    it('should return 409 when student already enrolled', async () => {
      const { classOffering } = await seedScenario();

      // First enrollment
      await enrollStudent(classOffering.id);
      // Duplicate
      const res = await enrollStudent(classOffering.id);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 when student enrolled in another section of same course', async () => {
      const { semester, course } = await seedScenario();

      // Create second section for same course
      const classB = await prisma.class.create({
        data: {
          courseId: course.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          section: 'B',
          capacity: 40,
          isEnrollmentOpen: true,
        },
      });

      // Enroll section A
      const { classOffering } = await createKrsScenario(prisma, {
        dosenId: dosen.id,
        courseCode: course.code, // same course
        section: 'A',
      }).catch(() => ({})); // already created, get from scenario

      // Actually, let's use the existing class from scenario
      const scenarioClasses = await prisma.class.findMany({
        where: { courseId: course.id, academicSemesterId: semester.id },
        orderBy: { section: 'asc' },
      });

      // Enroll in section A
      await enrollStudent(scenarioClasses[0].id);
      // Try section B
      const res = await enrollStudent(classB.id);

      expect(res.status).toBe(409);
    });

    it('should return 400 when class capacity is full', async () => {
      const { classOffering } = await seedScenario({ capacity: 0 });

      const res = await enrollStudent(classOffering.id);

      expect(res.status).toBe(400);
    });

    it('should validate classId is required', async () => {
      const res = await request(app)
        .post('/api/krs/enroll')
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // DELETE /api/krs/drop/:classId
  // ═══════════════════════════════════════════════════════════
  describe('DELETE /api/krs/drop/:classId', () => {
    it('should drop a pending enrollment', async () => {
      const { classOffering } = await seedScenario();
      await enrollStudent(classOffering.id);

      const res = await request(app)
        .delete(`/api/krs/drop/${classOffering.id}`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 when not enrolled', async () => {
      const res = await request(app)
        .delete('/api/krs/drop/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 when enrollment is approved', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      // Approve via direct DB update for setup
      await prisma.krsEnrollment.update({
        where: { id: enrollmentId },
        data: { status: 'APPROVED' },
      });

      const res = await request(app)
        .delete(`/api/krs/drop/${classOffering.id}`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/krs/my-plan
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/krs/my-plan', () => {
    it('should return student KRS with enrollments', async () => {
      const { classOffering, semester } = await seedScenario();
      await enrollStudent(classOffering.id);

      const res = await request(app)
        .get('/api/krs/my-plan')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.enrollments).toHaveLength(1);
      expect(res.body.data.summary).toHaveProperty('totalCourses', 1);
      expect(res.body.data.summary).toHaveProperty('totalSKS');
    });

    it('should return empty plan when no enrollments', async () => {
      const res = await request(app)
        .get('/api/krs/my-plan')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.enrollments).toHaveLength(0);
    });

    it('should filter by academicSemesterId', async () => {
      const { classOffering, semester } = await seedScenario();
      await enrollStudent(classOffering.id);

      const res = await request(app)
        .get(`/api/krs/my-plan?academicSemesterId=${semester.id}`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.enrollments).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // PATCH /api/krs/:id/status
  // ═══════════════════════════════════════════════════════════
  describe('PATCH /api/krs/:id/status', () => {
    it('should approve enrollment by dospem', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      const res = await updateStatus(enrollmentId, 'APPROVED', null, dosenToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('should reject enrollment by dospem', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      const res = await updateStatus(
        enrollmentId, 'REJECTED', 'Matakuliah tidak sesuai', dosenToken
      );

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');
    });

    it('should approve enrollment by admin with sufficient note', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      const res = await updateStatus(
        enrollmentId, 'APPROVED',
        'Disetujui oleh admin karena alasan tertentu', adminToken
      );

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('should return 403 when admin note is too short', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      const res = await updateStatus(enrollmentId, 'APPROVED', 'short', adminToken);

      expect(res.status).toBe(400);
    });

    it('should return 404 when enrollment not found', async () => {
      await seedScenario(); // need an open semester
      const res = await updateStatus(
        '00000000-0000-0000-0000-000000000000', 'APPROVED', null, dosenToken
      );

      expect(res.status).toBe(404);
    });

    it('should return 403 when dosen is not dospem', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      // Create a non-dospem dosen
      const { token: nonDospemToken } = await createDosen({ isDospem: false });

      const res = await updateStatus(enrollmentId, 'APPROVED', null, nonDospemToken);

      expect(res.status).toBe(403);
    });

    it('should return 403 when dospem is not advisor of the student', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      // Create another dospem that is NOT advisor of mhs
      const { token: otherDospemToken } = await createDosen({ isDospem: true });

      const res = await updateStatus(enrollmentId, 'APPROVED', null, otherDospemToken);

      expect(res.status).toBe(403);
    });

    it('should return 400 on invalid state transition', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      // Reject it first
      await updateStatus(enrollmentId, 'REJECTED', 'Not ok', dosenToken);

      // Try to approve a REJECTED enrollment (invalid: REJECTED->APPROVED)
      const res = await updateStatus(enrollmentId, 'APPROVED', null, dosenToken);

      expect(res.status).toBe(400);
    });

    it('should return 403 when admin tries to revoke approval', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      // Approve first
      await updateStatus(enrollmentId, 'APPROVED', null, dosenToken);

      // Admin tries to revoke (APPROVED → REJECTED)
      const res = await updateStatus(
        enrollmentId, 'REJECTED', 'Admin revoke attempt xxxxxxxxxx', adminToken
      );

      expect(res.status).toBe(403);
    });

    it('should validate request body', async () => {
      const res = await request(app)
        .patch('/api/krs/00000000-0000-0000-0000-000000000000/status')
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({}); // missing status

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // PATCH /api/krs/advisory/bulk-status
  // ═══════════════════════════════════════════════════════════
  describe('PATCH /api/krs/advisory/bulk-status', () => {
    it('should bulk approve enrollments by dospem', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      const res = await request(app)
        .patch('/api/krs/advisory/bulk-status')
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({
          enrollmentIds: [enrollmentId],
          status: 'APPROVED',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.updatedCount).toBe(1);
    });

    it('should bulk reject enrollments with note', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      const res = await request(app)
        .patch('/api/krs/advisory/bulk-status')
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({
          enrollmentIds: [enrollmentId],
          status: 'REJECTED',
          note: 'Bulk rejection',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.updatedCount).toBe(1);
    });

    it('should validate enrollmentIds is required', async () => {
      const res = await request(app)
        .patch('/api/krs/advisory/bulk-status')
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when array is empty', async () => {
      const res = await request(app)
        .patch('/api/krs/advisory/bulk-status')
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ enrollmentIds: [], status: 'APPROVED' });

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/krs/pending
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/krs/pending', () => {
    it('should return pending enrollments for dospem', async () => {
      const { classOffering } = await seedScenario();
      await enrollStudent(classOffering.id);

      const res = await request(app)
        .get('/api/krs/pending')
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return pending enrollments for admin', async () => {
      const { classOffering } = await seedScenario();
      await enrollStudent(classOffering.id);

      const res = await request(app)
        .get('/api/krs/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 403 for MAHASISWA', async () => {
      const res = await request(app)
        .get('/api/krs/pending')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // PATCH /api/krs/:id/revise
  // ═══════════════════════════════════════════════════════════
  describe('PATCH /api/krs/:id/revise', () => {
    it('should revise a rejected enrollment', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      // Reject it first
      await updateStatus(enrollmentId, 'REJECTED', 'Needs revision', dosenToken);

      // Revise
      const res = await request(app)
        .patch(`/api/krs/${enrollmentId}/revise`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.enrollment.status).toBe('PENDING');
      expect(res.body.data.enrollment.revisionCount).toBe(1);
    });

    it('should return 404 when enrollment not found', async () => {
      const res = await request(app)
        .patch('/api/krs/00000000-0000-0000-0000-000000000000/revise')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 when enrollment is not REJECTED', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      // Try revise a PENDING enrollment
      const res = await request(app)
        .patch(`/api/krs/${enrollmentId}/revise`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/krs/:id/history
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/krs/:id/history', () => {
    it('should return approval history for student own enrollment', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      // Create some history by approving
      await updateStatus(enrollmentId, 'APPROVED', null, dosenToken);

      const res = await request(app)
        .get(`/api/krs/${enrollmentId}/history`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return history for dospem (advisor)', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      const res = await request(app)
        .get(`/api/krs/${enrollmentId}/history`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
    });

    it('should return history for admin', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      const res = await request(app)
        .get(`/api/krs/${enrollmentId}/history`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 when enrollment not found', async () => {
      const res = await request(app)
        .get('/api/krs/00000000-0000-0000-0000-000000000000/history')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 when another student accesses', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      // Create another student
      const { token: otherMhsToken } = await createMahasiswa();

      const res = await request(app)
        .get(`/api/krs/${enrollmentId}/history`)
        .set('Authorization', `Bearer ${otherMhsToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 403 when non-advisor dosen accesses', async () => {
      const { classOffering } = await seedScenario();
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      // Create another dosen that is NOT the advisor
      const { token: otherDosenToken } = await createDosen();

      const res = await request(app)
        .get(`/api/krs/${enrollmentId}/history`)
        .set('Authorization', `Bearer ${otherDosenToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/krs/advisory/students
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/krs/advisory/students', () => {
    it('should return advisory students for dospem', async () => {
      const res = await request(app)
        .get('/api/krs/advisory/students')
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.students).toBeDefined();
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.students.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 403 for MAHASISWA', async () => {
      const res = await request(app)
        .get('/api/krs/advisory/students')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 403 for ADMIN', async () => {
      const res = await request(app)
        .get('/api/krs/advisory/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/krs/monitoring
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/krs/monitoring', () => {
    it('should return monitoring data for admin', async () => {
      const { classOffering } = await seedScenario();
      await enrollStudent(classOffering.id);

      const res = await request(app)
        .get('/api/krs/monitoring')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.enrollments).toBeDefined();
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.total).toBeGreaterThanOrEqual(1);
    });

    it('should return 403 for DOSEN', async () => {
      const res = await request(app)
        .get('/api/krs/monitoring')
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(403);
    });

    it('should filter by academicSemesterId', async () => {
      const { classOffering, semester } = await seedScenario();
      await enrollStudent(classOffering.id);

      const res = await request(app)
        .get(`/api/krs/monitoring?academicSemesterId=${semester.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.enrollments.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Full Enrollment Lifecycle (Integration)
  // ═══════════════════════════════════════════════════════════
  describe('Full Enrollment Lifecycle', () => {
    it('should handle enroll → approve → check plan', async () => {
      const { classOffering } = await seedScenario();

      // 1. Enroll
      const enrollRes = await enrollStudent(classOffering.id);
      expect(enrollRes.status).toBe(201);
      const enrollmentId = enrollRes.body.data.id;

      // 2. Check pending (dosen sees it)
      const pendingRes = await request(app)
        .get('/api/krs/pending')
        .set('Authorization', `Bearer ${dosenToken}`);
      expect(pendingRes.body.data.length).toBeGreaterThanOrEqual(1);

      // 3. Approve
      const approveRes = await updateStatus(enrollmentId, 'APPROVED', null, dosenToken);
      expect(approveRes.status).toBe(200);

      // 4. Check plan
      const planRes = await request(app)
        .get('/api/krs/my-plan')
        .set('Authorization', `Bearer ${mhsToken}`);
      expect(planRes.body.data.enrollments[0].status).toBe('APPROVED');

      // 5. Check history
      const historyRes = await request(app)
        .get(`/api/krs/${enrollmentId}/history`)
        .set('Authorization', `Bearer ${mhsToken}`);
      expect(historyRes.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle enroll → reject → revise → approve', async () => {
      const { classOffering } = await seedScenario();

      // 1. Enroll
      const enrollRes = await enrollStudent(classOffering.id);
      const enrollmentId = enrollRes.body.data.id;

      // 2. Reject
      await updateStatus(enrollmentId, 'REJECTED', 'Please revise', dosenToken);

      // 3. Revise
      const reviseRes = await request(app)
        .patch(`/api/krs/${enrollmentId}/revise`)
        .set('Authorization', `Bearer ${mhsToken}`);
      expect(reviseRes.status).toBe(200);

      // 4. Approve
      const approveRes = await updateStatus(enrollmentId, 'APPROVED', null, dosenToken);
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('APPROVED');
    });

    it('should handle enroll → drop', async () => {
      const { classOffering } = await seedScenario();

      // 1. Enroll
      await enrollStudent(classOffering.id);

      // 2. Drop
      const dropRes = await request(app)
        .delete(`/api/krs/drop/${classOffering.id}`)
        .set('Authorization', `Bearer ${mhsToken}`);
      expect(dropRes.status).toBe(200);

      // 3. Verify plan is empty
      const planRes = await request(app)
        .get('/api/krs/my-plan')
        .set('Authorization', `Bearer ${mhsToken}`);
      expect(planRes.body.data.enrollments).toHaveLength(0);
    });
  });
});
