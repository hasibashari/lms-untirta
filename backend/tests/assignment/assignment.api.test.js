/**
 * Assignment API — Integration Tests
 *
 * Tests all /api/assignments routes against a real test database.
 *
 * Routes tested:
 *   POST   /course/:courseId          (DOSEN)
 *   GET    /course/:courseId          (DOSEN/auth) — with enrollment status for MAHASISWA
 *   GET    /:assignmentId             (DOSEN/ADMIN/MAHASISWA)
 *   PUT    /:assignmentId             (DOSEN/ADMIN)
 *   DELETE /:assignmentId             (DOSEN/ADMIN)
 *
 * Note: Submission-related routes (submit, grade, my-grades, etc.) are tested
 * separately in tests/submission/submission.api.test.js
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { getApp } from '../helpers/request.js';
import prisma from '../helpers/prisma.js';
import { cleanDatabase } from '../helpers/db.js';
import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';

const API = '/api/assignments';

let app;
let adminToken, dosenToken, mhsToken;
let dosenUser, mhsUser;
let course;

/** Seed a course owned by the dosen */
const seedCourse = async () => {
  return prisma.course.create({
    data: {
      title: 'Pemrograman Web',
      code: `IF-${Date.now().toString().slice(-6)}`,
      teacherId: dosenUser.id,
      sks: 3,
    },
  });
};

/** Seed an enrollment for the mahasiswa in the course */
const seedEnrollment = async (courseId, userId) => {
  return prisma.enrollment.create({
    data: { courseId, userId: userId || mhsUser.id },
  });
};

/** Seed an assignment in the course */
const seedAssignment = async (courseId, overrides = {}) => {
  return prisma.assignment.create({
    data: {
      title: 'Tugas 1',
      description: 'Desc',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      courseId,
      ...overrides,
    },
  });
};

/** Seed a submission */
const seedSubmission = async (assignmentId, studentId, overrides = {}) => {
  return prisma.submission.create({
    data: {
      assignmentId,
      studentId,
      fileUrl: 'https://example.com/file.pdf',
      ...overrides,
    },
  });
};

beforeEach(async () => {
  app = getApp();
  await cleanDatabase();

  const admin = await createAdmin();
  const dosen = await createDosen();
  const mhs = await createMahasiswa();
  adminToken = admin.token;
  dosenToken = dosen.token;
  mhsToken = mhs.token;
  dosenUser = dosen.user;
  mhsUser = mhs.user;

  course = await seedCourse();
});

// ═════════════════════════════════════════════════════════════
// Auth Guards
// ═════════════════════════════════════════════════════════════
describe('Auth Guards', () => {
  it('POST /course/:id → 403 for MAHASISWA', async () => {
    const res = await request(app)
      .post(`${API}/course/${course.id}`)
      .set('Authorization', `Bearer ${mhsToken}`)
      .send({ title: 'Tugas', dueDate: new Date().toISOString() });
    expect(res.status).toBe(403);
  });

  it('POST /course/:id → 401 without token', async () => {
    const res = await request(app)
      .post(`${API}/course/${course.id}`)
      .send({ title: 'Tugas', dueDate: new Date().toISOString() });
    expect(res.status).toBe(401);
  });

  it('DELETE /:id → 403 for MAHASISWA', async () => {
    const res = await request(app)
      .delete(`${API}/any-id`)
      .set('Authorization', `Bearer ${mhsToken}`);
    expect(res.status).toBe(403);
  });
});

// ═════════════════════════════════════════════════════════════
// POST /course/:courseId — create assignment
// ═════════════════════════════════════════════════════════════
describe('POST /course/:courseId', () => {
  it('201 — creates assignment successfully', async () => {
    const res = await request(app)
      .post(`${API}/course/${course.id}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ title: 'Tugas Baru', dueDate: new Date(Date.now() + 86400000).toISOString() });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.title).toBe('Tugas Baru');
  });

  it('201 — creates with description', async () => {
    const res = await request(app)
      .post(`${API}/course/${course.id}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({
        title: 'Tugas Detail',
        description: 'Full description',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Tugas Detail');
  });

  it('400 — validation: title too short', async () => {
    const res = await request(app)
      .post(`${API}/course/${course.id}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ title: 'ab', dueDate: new Date().toISOString() });

    expect(res.status).toBe(400);
  });

  it('400 — validation: missing dueDate', async () => {
    const res = await request(app)
      .post(`${API}/course/${course.id}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ title: 'Valid Title' });

    expect(res.status).toBe(400);
  });

  it('403 — dosen does not own the course', async () => {
    const otherDosen = await createDosen({ email: 'other@test.com' });
    const res = await request(app)
      .post(`${API}/course/${course.id}`)
      .set('Authorization', `Bearer ${otherDosen.token}`)
      .send({ title: 'Tugas', dueDate: new Date(Date.now() + 86400000).toISOString() });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('404 — course not found', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .post(`${API}/course/${fakeId}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ title: 'Tugas', dueDate: new Date(Date.now() + 86400000).toISOString() });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════
// GET /course/:courseId — list assignments for a course
// ═════════════════════════════════════════════════════════════
describe('GET /course/:courseId', () => {
  it('200 — dosen lists assignments (no enrollment needed)', async () => {
    await seedAssignment(course.id);
    const res = await request(app)
      .get(`${API}/course/${course.id}`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('200 — enrolled mahasiswa lists assignments', async () => {
    await seedEnrollment(course.id);
    await seedAssignment(course.id);

    const res = await request(app)
      .get(`${API}/course/${course.id}`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('status');
  });

  it('200 — mahasiswa sees graded status and grade when assignment is graded', async () => {
    await seedEnrollment(course.id);
    const assignment = await seedAssignment(course.id);
    await seedSubmission(assignment.id, mhsUser.id, { grade: 88 });

    const res = await request(app)
      .get(`${API}/course/${course.id}`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].status).toBe('graded');
    expect(res.body.data[0].grade).toBe(88);
  });

  it('403 — non-enrolled mahasiswa cannot list', async () => {
    const res = await request(app)
      .get(`${API}/course/${course.id}`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(403);
  });

  it('404 — course not found', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`${API}/course/${fakeId}`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(404);
  });
});
// ═════════════════════════════════════════════════════════════
// GET /:assignmentId — assignment detail
// ═════════════════════════════════════════════════════════════
describe('GET /:assignmentId', () => {
  it('200 — returns assignment detail for dosen', async () => {
    const assignment = await seedAssignment(course.id);
    const res = await request(app)
      .get(`${API}/${assignment.id}`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Tugas 1');
  });

  it('200 — returns assignment detail for mahasiswa', async () => {
    const assignment = await seedAssignment(course.id);
    const res = await request(app)
      .get(`${API}/${assignment.id}`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(200);
  });

  it('404 — assignment not found', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`${API}/${fakeId}`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════
// PUT /:assignmentId — update assignment
// ═════════════════════════════════════════════════════════════
describe('PUT /:assignmentId', () => {
  let assignment;

  beforeEach(async () => {
    assignment = await seedAssignment(course.id);
  });

  it('200 — dosen updates title', async () => {
    const res = await request(app)
      .put(`${API}/${assignment.id}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('200 — admin updates any assignment', async () => {
    const res = await request(app)
      .put(`${API}/${assignment.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Admin Updated');
  });

  it('200 — updates dueDate', async () => {
    const newDate = new Date('2026-12-31T23:59:59Z');
    const res = await request(app)
      .put(`${API}/${assignment.id}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ dueDate: newDate.toISOString() });

    expect(res.status).toBe(200);
  });

  it('403 — dosen does not own the course', async () => {
    const otherDosen = await createDosen({ email: 'upd-other@test.com' });
    const res = await request(app)
      .put(`${API}/${assignment.id}`)
      .set('Authorization', `Bearer ${otherDosen.token}`)
      .send({ title: 'Hacked' });

    expect(res.status).toBe(403);
  });

  it('404 — assignment not found', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .put(`${API}/${fakeId}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ title: 'Nope' });

    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════
// DELETE /:assignmentId — delete assignment
// ═════════════════════════════════════════════════════════════
describe('DELETE /:assignmentId', () => {
  let assignment;

  beforeEach(async () => {
    assignment = await seedAssignment(course.id);
  });

  it('200 — dosen deletes own assignment', async () => {
    const res = await request(app)
      .delete(`${API}/${assignment.id}`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('message');
  });

  it('200 — admin deletes any assignment', async () => {
    const res = await request(app)
      .delete(`${API}/${assignment.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('403 — dosen does not own the course', async () => {
    const otherDosen = await createDosen({ email: 'del-other@test.com' });
    const res = await request(app)
      .delete(`${API}/${assignment.id}`)
      .set('Authorization', `Bearer ${otherDosen.token}`);

    expect(res.status).toBe(403);
  });

  it('404 — assignment not found', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .delete(`${API}/${fakeId}`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(404);
  });
});
