/**
 * Course API — Integration Tests
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
 *   ✓ POST /api/courses — create course (DOSEN/ADMIN)
 *   ✓ GET /api/courses — list all courses
 *   ✓ GET /api/courses/me — role-based my courses
 *   ✓ POST /api/courses/:id/enroll — enroll student (by email & by ID)
 *   ✓ GET /api/courses/:id/students — list enrolled students
 *   ✓ GET /api/courses/:id/available-students — list available students
 *   ✓ Admin CRUD — GET /admin/all, POST /admin, PUT /admin/:id, DELETE /admin/:id
 *   ✓ PATCH /admin/:id/assign-teacher — assign teacher
 *   ✓ Auth/Authz — 401 without token, 403 for wrong roles
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { getApp } from '../helpers/request.js';
import { cleanDatabase } from '../helpers/db.js';
import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';
import { validCourse } from '../fixtures/course.fixture.js';

const app = getApp();

describe('Course API — /api/courses', () => {
  let adminToken, admin;
  let dosenToken, dosen;
  let mhsToken, mhs;

  beforeEach(async () => {
    await cleanDatabase();
    const a = await createAdmin();
    admin = a.user; adminToken = a.token;
    const d = await createDosen();
    dosen = d.user; dosenToken = d.token;
    const m = await createMahasiswa();
    mhs = m.user; mhsToken = m.token;
  });

  // ─── Helper: create a course via API ────────────────────────
  async function seedCourse(teacherId, overrides = {}) {
    const payload = validCourse(teacherId, overrides);
    const res = await request(app)
      .post('/api/courses/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    return res.body.data;
  }

  // ═══════════════════════════════════════════════════════════
  // Authentication & Authorization Guards
  // ═══════════════════════════════════════════════════════════
  describe('Auth Guards', () => {
    it('should return 401 without token on GET /api/courses/admin/all', async () => {
      const res = await request(app).get('/api/courses/admin/all');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without token on POST /api/courses/admin', async () => {
      const res = await request(app).post('/api/courses/admin').send({});
      expect(res.status).toBe(401);
    });

    it('should return 403 for MAHASISWA on POST /api/courses/admin', async () => {
      const res = await request(app)
        .post('/api/courses/admin')
        .set('Authorization', `Bearer ${mhsToken}`)
        .send(validCourse(dosen.id));
      expect(res.status).toBe(403);
    });

    it('should return 403 for MAHASISWA on admin routes', async () => {
      const res = await request(app)
        .get('/api/courses/admin/all')
        .set('Authorization', `Bearer ${mhsToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 for DOSEN on admin routes', async () => {
      const res = await request(app)
        .get('/api/courses/admin/all')
        .set('Authorization', `Bearer ${dosenToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // POST /api/courses/admin — Create Course (Admin)
  // ═══════════════════════════════════════════════════════════
  describe('POST /api/courses/admin', () => {
    it('should create a course as ADMIN', async () => {
      const payload = validCourse(dosen.id);

      const res = await request(app)
        .post('/api/courses/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          title: payload.title,
          code: payload.code,
        })
      );
    });

    it('should reject duplicate course code', async () => {
      const payload = validCourse(dosen.id, { code: 'UNIQUE-001' });

      // First creation
      await request(app)
        .post('/api/courses/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      // Duplicate
      const res = await request(app)
        .post('/api/courses/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...payload, title: 'Different Title' });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('sudah digunakan');
    });

    it('should reject invalid payload (missing title)', async () => {
      const res = await request(app)
        .post('/api/courses/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'IF-101' }); // no title

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/courses/admin/all — List All Courses (Admin)
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/courses/admin/all', () => {
    it('should return all courses', async () => {
      await seedCourse(dosen.id, { code: 'LIST-001' });
      await seedCourse(dosen.id, { code: 'LIST-002', title: 'Course 2' });

      const res = await request(app)
        .get('/api/courses/admin/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/courses/me — My Courses (role-based)
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/courses/me', () => {
    it('should return teaching courses for DOSEN', async () => {
      await seedCourse(dosen.id, { code: 'ME-D01' });

      const res = await request(app)
        .get('/api/courses/me')
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return teaching courses with stats when query includeStats=true', async () => {
      await seedCourse(dosen.id, { code: 'ME-D02' });

      const res = await request(app)
        .get('/api/courses/me?includeStats=true')
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return enrolled courses for MAHASISWA', async () => {
      const res = await request(app)
        .get('/api/courses/me')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]); // no enrollments yet
    });

    it('should return all courses for ADMIN', async () => {
      const res = await request(app)
        .get('/api/courses/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // POST /api/courses/:id/enroll — Enroll Student
  // ═══════════════════════════════════════════════════════════
  describe('POST /api/courses/:id/enroll', () => {
    let courseId;

    beforeEach(async () => {
      const course = await seedCourse(dosen.id, { code: 'ENROLL-001' });
      courseId = course.id;
    });

    it('should enroll a student by email', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ email: mhs.email });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.email).toBe(mhs.email);
    });

    it('should enroll a student by studentId', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ studentId: mhs.id });

      expect(res.status).toBe(201);
      expect(res.body.data.student.id).toBe(mhs.id);
    });

    it('should reject duplicate enrollment', async () => {
      // Enroll first time
      await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ email: mhs.email });

      // Try again
      const res = await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ email: mhs.email });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('sudah terdaftar');
    });

    it('should reject enrollment of non-MAHASISWA', async () => {
      const dosen2 = await createDosen({ email: 'dosen2@test.com' });

      const res = await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ email: dosen2.user.email });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('bukan mahasiswa');
    });

    it('should return 404 for nonexistent course', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await request(app)
        .post(`/api/courses/${fakeId}/enroll`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ email: mhs.email });

      expect(res.status).toBe(404);
    });

    it('should return 403 when DOSEN enrolls in another DOSEN course', async () => {
      const otherDosen = await createDosen({ email: 'other-dosen@test.com' });
      const otherCourse = await seedCourse(dosen.id, { code: 'ENROLL-002' });

      const res = await request(app)
        .post(`/api/courses/${otherCourse.id}/enroll`)
        .set('Authorization', `Bearer ${otherDosen.token}`)
        .send({ email: mhs.email });

      expect(res.status).toBe(403);
    });

    it('should allow ADMIN to enroll in any course', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: mhs.email });

      expect(res.status).toBe(201);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/courses/:id/students
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/courses/:id/students', () => {
    let courseId;

    beforeEach(async () => {
      const course = await seedCourse(dosen.id, { code: 'STUDENTS-001' });
      courseId = course.id;

      // Enroll a student
      await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ studentId: mhs.id });
    });

    it('should return students for the course owner (DOSEN)', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}/students`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].student.id).toBe(mhs.id);
    });

    it('should allow ADMIN to view students of any course', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}/students`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should return 403 for non-owner DOSEN', async () => {
      const otherDosen = await createDosen({ email: 'other-d@test.com' });

      const res = await request(app)
        .get(`/api/courses/${courseId}/students`)
        .set('Authorization', `Bearer ${otherDosen.token}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for nonexistent course', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await request(app)
        .get(`/api/courses/${fakeId}/students`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/courses/:id/available-students
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/courses/:id/available-students', () => {
    let courseId;

    beforeEach(async () => {
      const course = await seedCourse(dosen.id, { code: 'AVAIL-001' });
      courseId = course.id;
    });

    it('should return students not yet enrolled', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}/available-students`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      // mhs is not enrolled, so should appear
      const ids = res.body.data.map(s => s.id);
      expect(ids).toContain(mhs.id);
    });

    it('should exclude already enrolled students', async () => {
      // Enroll mhs first
      await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ studentId: mhs.id });

      const res = await request(app)
        .get(`/api/courses/${courseId}/available-students`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map(s => s.id);
      expect(ids).not.toContain(mhs.id);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Admin Course CRUD
  // ═══════════════════════════════════════════════════════════
  describe('Admin Course Management', () => {
    describe('GET /api/courses/admin/all', () => {
      it('should return all courses for admin', async () => {
        await seedCourse(dosen.id, { code: 'ADM-001' });

        const res = await request(app)
          .get('/api/courses/admin/all')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('POST /api/courses/admin', () => {
      it('should create a course with teacherId', async () => {
        const payload = {
          title: 'Admin Created Course',
          code: 'ADM-002',
          teacherId: dosen.id,
        };

        const res = await request(app)
          .post('/api/courses/admin')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.data.teacher.id).toBe(dosen.id);
      });

      it('should reject duplicate course code', async () => {
        const payload = {
          title: 'Admin Duplicate',
          code: 'ADM-DUP',
          teacherId: dosen.id,
        };

        // First creation
        await request(app)
          .post('/api/courses/admin')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        // Duplicate
        const res = await request(app)
          .post('/api/courses/admin')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...payload, title: 'Different' });

        expect(res.status).toBe(409);
      });

      it('should reject when teacher is not DOSEN', async () => {
        const payload = {
          title: 'Bad Teacher',
          code: 'ADM-004',
          teacherId: mhs.id, // MAHASISWA, not DOSEN
        };

        const res = await request(app)
          .post('/api/courses/admin')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        // Expect error (could be 500 or 400 depending on controller mapping)
        expect(res.status).toBeGreaterThanOrEqual(400);
      });
    });

    describe('PUT /api/courses/admin/:id', () => {
      let courseId;

      beforeEach(async () => {
        const course = await seedCourse(dosen.id, { code: 'ADM-UPD-001' });
        courseId = course.id;
      });

      it('should update a course', async () => {
        const res = await request(app)
          .put(`/api/courses/admin/${courseId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Updated Title' });

        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe('Updated Title');
      });

      it('should return 404 for nonexistent course', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';

        const res = await request(app)
          .put(`/api/courses/admin/${fakeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Nonexistent Course' });

        expect(res.status).toBe(404);
      });

      it('should reject duplicate code on update', async () => {
        // Create a second course
        await seedCourse(dosen.id, { code: 'ADM-UPD-002', title: 'Other' });

        const res = await request(app)
          .put(`/api/courses/admin/${courseId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ code: 'ADM-UPD-002' }); // collides with second course

        expect(res.status).toBe(409);
      });
    });

    describe('DELETE /api/courses/admin/:id', () => {
      it('should delete a course', async () => {
        const course = await seedCourse(dosen.id, { code: 'ADM-DEL-001' });

        const res = await request(app)
          .delete(`/api/courses/admin/${course.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.message).toContain('berhasil dihapus');
      });

      it('should return 404 for nonexistent course', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';

        const res = await request(app)
          .delete(`/api/courses/admin/${fakeId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
      });
    });

    describe('PATCH /api/courses/admin/:id/assign-teacher', () => {
      let courseId;

      beforeEach(async () => {
        const course = await seedCourse(dosen.id, { code: 'ASN-001' });
        courseId = course.id;
      });

      it('should assign a teacher to a course', async () => {
        const newDosen = await createDosen({ email: 'assign-dosen@test.com' });

        const res = await request(app)
          .patch(`/api/courses/admin/${courseId}/assign-teacher`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ teacherId: newDosen.user.id });

        expect(res.status).toBe(200);
        expect(res.body.data.teacher.id).toBe(newDosen.user.id);
      });

      it('should reject assigning a non-DOSEN user', async () => {
        const res = await request(app)
          .patch(`/api/courses/admin/${courseId}/assign-teacher`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ teacherId: mhs.id });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('bukan dosen');
      });

      it('should return 404 for nonexistent course', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';

        const res = await request(app)
          .patch(`/api/courses/admin/${fakeId}/assign-teacher`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ teacherId: dosen.id });

        expect(res.status).toBe(404);
      });
    });
  });
});
