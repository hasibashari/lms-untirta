/**
 * Class API — Integration Tests
 *
 * Tests the full HTTP request lifecycle:
 *   Route → Middleware → Controller → Service → Database (test DB)
 *
 * What we test:
 *   ✓ Auth guards — 401 without token, 403 for wrong roles
 *   ✓ POST /api/classes — create class offering (ADMIN only)
 *   ✓ GET /api/classes — list all classes (ADMIN/DOSEN)
 *   ✓ GET /api/classes/me — my classes (DOSEN)
 *   ✓ GET /api/classes/open — open enrollment classes (MAHASISWA/ADMIN)
 *   ✓ GET /api/classes/course/:courseId — classes by course
 *   ✓ GET /api/classes/:id — class detail
 *   ✓ PUT /api/classes/:id — update class (ADMIN)
 *   ✓ PATCH /api/classes/:id/enrollment — toggle enrollment (ADMIN)
 *   ✓ DELETE /api/classes/:id — delete class (ADMIN)
 *   ✓ Validation — missing/invalid fields
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { getApp } from '../helpers/request.js';
import { cleanDatabase } from '../helpers/db.js';
import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';
import prisma from '../helpers/prisma.js';

const app = getApp();
const FAKE_UUID = '00000000-0000-0000-0000-000000000000';

describe('Class API — /api/classes', () => {
  let adminToken, admin;
  let dosenToken, dosen;
  let mhsToken, mhs;
  let semester, course;

  beforeEach(async () => {
    await cleanDatabase();

    const a = await createAdmin();
    admin = a.user; adminToken = a.token;
    const d = await createDosen();
    dosen = d.user; dosenToken = d.token;
    const m = await createMahasiswa();
    mhs = m.user; mhsToken = m.token;

    // Seed an academic semester (OPEN)
    semester = await prisma.academicSemester.create({
      data: {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
        status: 'OPEN',
        maxSks: 24,
        isActive: true,
      },
    });

    // Seed a course
    course = await prisma.course.create({
      data: {
        title: 'Pemrograman Web',
        code: 'IF-101',
        sks: 3,
        semester: 3,
        teacherId: dosen.id,
      },
    });
  });

  // ── Helper: create a class via API ─────────────────────────
  async function seedClass(overrides = {}) {
    const payload = {
      courseId: course.id,
      lecturerId: dosen.id,
      academicSemesterId: semester.id,
      section: 'A',
      schedule: 'Senin 08:00-10:00',
      room: 'R.301',
      ...overrides,
    };
    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    return res.body.data;
  }

  // ═══════════════════════════════════════════════════════════
  // Auth Guards
  // ═══════════════════════════════════════════════════════════
  describe('Auth Guards', () => {
    it('should return 401 without token on GET /api/classes', async () => {
      const res = await request(app).get('/api/classes');
      expect(res.status).toBe(401);
    });

    it('should return 401 without token on POST /api/classes', async () => {
      const res = await request(app).post('/api/classes').send({});
      expect(res.status).toBe(401);
    });

    it('should return 403 for MAHASISWA on POST /api/classes', async () => {
      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it('should return 403 for DOSEN on POST /api/classes', async () => {
      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it('should return 403 for MAHASISWA on GET /api/classes', async () => {
      const res = await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${mhsToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 for DOSEN on DELETE /api/classes/:id', async () => {
      const res = await request(app)
        .delete(`/api/classes/${FAKE_UUID}`)
        .set('Authorization', `Bearer ${dosenToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 for MAHASISWA on PUT /api/classes/:id', async () => {
      const res = await request(app)
        .put(`/api/classes/${FAKE_UUID}`)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it('should return 403 for DOSEN on PATCH enrollment', async () => {
      const res = await request(app)
        .patch(`/api/classes/${FAKE_UUID}/enrollment`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ isEnrollmentOpen: true });
      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // POST /api/classes — Create Class
  // ═══════════════════════════════════════════════════════════
  describe('POST /api/classes', () => {
    it('should create a class as ADMIN', async () => {
      const payload = {
        courseId: course.id,
        lecturerId: dosen.id,
        academicSemesterId: semester.id,
        section: 'A',
        schedule: 'Senin 08:00-10:00',
        room: 'R.301',
      };

      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          section: 'A',
          schedule: 'Senin 08:00-10:00',
          room: 'R.301',
        })
      );
    });

    it('should create a class with custom capacity', async () => {
      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId: course.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          section: 'B',
          capacity: 60,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.capacity).toBe(60);
    });

    it('should reject duplicate class (same course + semester + section)', async () => {
      await seedClass({ section: 'A' });

      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId: course.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          section: 'A',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('sudah ada');
    });

    it('should return 404 for nonexistent course', async () => {
      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId: FAKE_UUID,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          section: 'A',
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('tidak ditemukan');
    });

    it('should return 404 for nonexistent lecturer', async () => {
      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId: course.id,
          lecturerId: FAKE_UUID,
          academicSemesterId: semester.id,
          section: 'A',
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('tidak ditemukan');
    });

    it('should return 400 when lecturer is not DOSEN', async () => {
      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId: course.id,
          lecturerId: mhs.id,
          academicSemesterId: semester.id,
          section: 'A',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('bukan dosen');
    });

    it('should return 404 for nonexistent semester', async () => {
      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId: course.id,
          lecturerId: dosen.id,
          academicSemesterId: FAKE_UUID,
          section: 'A',
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('tidak ditemukan');
    });

    it('should reject on CLOSED semester', async () => {
      const closedSem = await prisma.academicSemester.create({
        data: {
          academicYear: '2024/2025',
          semesterType: 'GANJIL',
          status: 'CLOSED',
          maxSks: 24,
        },
      });

      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId: course.id,
          lecturerId: dosen.id,
          academicSemesterId: closedSem.id,
          section: 'A',
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ section: 'A' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid UUID for courseId', async () => {
      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId: 'not-a-uuid',
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          section: 'A',
        });

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/classes — List All Classes
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/classes', () => {
    it('should return all classes as ADMIN', async () => {
      await seedClass({ section: 'A' });
      await seedClass({ section: 'B' });

      const res = await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should return classes as DOSEN', async () => {
      await seedClass({ section: 'A' });

      const res = await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by academicSemesterId', async () => {
      await seedClass({ section: 'A' });

      const res = await request(app)
        .get(`/api/classes?academicSemesterId=${semester.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by courseId', async () => {
      await seedClass({ section: 'A' });

      const res = await request(app)
        .get(`/api/classes?courseId=${course.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/classes/me — My Classes (DOSEN)
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/classes/me', () => {
    it('should return classes for authenticated DOSEN', async () => {
      await seedClass({ section: 'A' });

      const res = await request(app)
        .get('/api/classes/me')
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('should return empty when DOSEN has no classes', async () => {
      const otherDosen = await createDosen({ email: 'other-dosen@test.com' });

      const res = await request(app)
        .get('/api/classes/me')
        .set('Authorization', `Bearer ${otherDosen.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should return 403 for MAHASISWA', async () => {
      const res = await request(app)
        .get('/api/classes/me')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/classes/open — Open Enrollment Classes
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/classes/open', () => {
    it('should return open enrollment classes for MAHASISWA', async () => {
      await prisma.class.create({
        data: {
          courseId: course.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          section: 'A',
          isEnrollmentOpen: true,
          capacity: 40,
        },
      });

      const res = await request(app)
        .get('/api/classes/open')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('should not return closed enrollment classes', async () => {
      await prisma.class.create({
        data: {
          courseId: course.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          section: 'A',
          isEnrollmentOpen: false,
          capacity: 40,
        },
      });

      const res = await request(app)
        .get('/api/classes/open')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('should return 403 for DOSEN', async () => {
      const res = await request(app)
        .get('/api/classes/open')
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/classes/course/:courseId — Classes by Course
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/classes/course/:courseId', () => {
    it('should return classes for a course', async () => {
      await seedClass({ section: 'A' });
      await seedClass({ section: 'B' });

      const res = await request(app)
        .get(`/api/classes/course/${course.id}`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should return empty for course with no classes', async () => {
      const course2 = await prisma.course.create({
        data: { title: 'Other', code: 'IF-999', sks: 2, semester: 1, teacherId: dosen.id },
      });

      const res = await request(app)
        .get(`/api/classes/course/${course2.id}`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GET /api/classes/:id — Class Detail
  // ═══════════════════════════════════════════════════════════
  describe('GET /api/classes/:id', () => {
    it('should return class details', async () => {
      const cls = await seedClass({ section: 'A' });

      const res = await request(app)
        .get(`/api/classes/${cls.id}`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.section).toBe('A');
      expect(res.body.data.course).toBeDefined();
      expect(res.body.data.lecturer).toBeDefined();
    });

    it('should return 404 for nonexistent class', async () => {
      const res = await request(app)
        .get(`/api/classes/${FAKE_UUID}`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // PUT /api/classes/:id — Update Class
  // ═══════════════════════════════════════════════════════════
  describe('PUT /api/classes/:id', () => {
    it('should update a class as ADMIN', async () => {
      const cls = await seedClass({ section: 'A' });

      const res = await request(app)
        .put(`/api/classes/${cls.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ room: 'R.999', schedule: 'Selasa 10:00-12:00' });

      expect(res.status).toBe(200);
      expect(res.body.data.room).toBe('R.999');
      expect(res.body.data.schedule).toBe('Selasa 10:00-12:00');
    });

    it('should return 404 for nonexistent class', async () => {
      const res = await request(app)
        .put(`/api/classes/${FAKE_UUID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ room: 'R.999' });

      expect(res.status).toBe(404);
    });

    it('should allow updating lecturer', async () => {
      const cls = await seedClass({ section: 'A' });
      const dosen2 = await createDosen({ email: 'dosen2@test.com' });

      const res = await request(app)
        .put(`/api/classes/${cls.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lecturerId: dosen2.user.id });

      expect(res.status).toBe(200);
    });

    it('should reject non-DOSEN as lecturer', async () => {
      const cls = await seedClass({ section: 'A' });

      const res = await request(app)
        .put(`/api/classes/${cls.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lecturerId: mhs.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('bukan dosen');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // PATCH /api/classes/:id/enrollment — Toggle Enrollment
  // ═══════════════════════════════════════════════════════════
  describe('PATCH /api/classes/:id/enrollment', () => {
    it('should open enrollment', async () => {
      const cls = await seedClass({ section: 'A' });

      const res = await request(app)
        .patch(`/api/classes/${cls.id}/enrollment`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isEnrollmentOpen: true });

      expect(res.status).toBe(200);
      expect(res.body.data.isEnrollmentOpen).toBe(true);
    });

    it('should close enrollment', async () => {
      const cls = await seedClass({ section: 'A' });
      await prisma.class.update({
        where: { id: cls.id },
        data: { isEnrollmentOpen: true },
      });

      const res = await request(app)
        .patch(`/api/classes/${cls.id}/enrollment`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isEnrollmentOpen: false });

      expect(res.status).toBe(200);
      expect(res.body.data.isEnrollmentOpen).toBe(false);
    });

    it('should return 404 for nonexistent class', async () => {
      const res = await request(app)
        .patch(`/api/classes/${FAKE_UUID}/enrollment`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isEnrollmentOpen: true });

      expect(res.status).toBe(404);
    });

    it('should reject missing isEnrollmentOpen', async () => {
      const cls = await seedClass({ section: 'A' });

      const res = await request(app)
        .patch(`/api/classes/${cls.id}/enrollment`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // DELETE /api/classes/:id — Delete Class
  // ═══════════════════════════════════════════════════════════
  describe('DELETE /api/classes/:id', () => {
    it('should delete a class as ADMIN', async () => {
      const cls = await seedClass({ section: 'A' });

      const res = await request(app)
        .delete(`/api/classes/${cls.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 for nonexistent class', async () => {
      const res = await request(app)
        .delete(`/api/classes/${FAKE_UUID}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should verify class is actually deleted', async () => {
      const cls = await seedClass({ section: 'A' });

      await request(app)
        .delete(`/api/classes/${cls.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .get(`/api/classes/${cls.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
