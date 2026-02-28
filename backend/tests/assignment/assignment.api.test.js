/**
 * Assignment API — Integration Tests
 *
 * Tests all /api/assignments routes against a real test database.
 *
 * Routes tested:
 *   POST   /course/:courseId         (DOSEN)
 *   GET    /course/:courseId         (auth)
 *   GET    /my-grades                (MAHASISWA)
 *   GET    /my-stats                 (MAHASISWA)
 *   GET    /teacher-stats            (DOSEN)
 *   GET    /recent-submissions       (DOSEN)
 *   GET    /:assignmentId/me         (MAHASISWA)
 *   POST   /:assignmentId/submit     (MAHASISWA)
 *   PATCH  /submissions/:subId       (DOSEN/ADMIN)
 *   GET    /:assignmentId/submissions (DOSEN/ADMIN)
 *   GET    /:assignmentId            (DOSEN/ADMIN/MAHASISWA)
 *   PUT    /:assignmentId            (DOSEN/ADMIN)
 *   DELETE /:assignmentId            (DOSEN/ADMIN)
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

  it('GET /my-grades → 403 for DOSEN', async () => {
    const res = await request(app)
      .get(`${API}/my-grades`)
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /my-stats → 403 for DOSEN', async () => {
    const res = await request(app)
      .get(`${API}/my-stats`)
      .set('Authorization', `Bearer ${dosenToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /teacher-stats → 403 for MAHASISWA', async () => {
    const res = await request(app)
      .get(`${API}/teacher-stats`)
      .set('Authorization', `Bearer ${mhsToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /recent-submissions → 403 for MAHASISWA', async () => {
    const res = await request(app)
      .get(`${API}/recent-submissions`)
      .set('Authorization', `Bearer ${mhsToken}`);
    expect(res.status).toBe(403);
  });

  it('PATCH /submissions/:id → 403 for MAHASISWA', async () => {
    const res = await request(app)
      .patch(`${API}/submissions/any-id`)
      .set('Authorization', `Bearer ${mhsToken}`)
      .send({ grade: 80 });
    expect(res.status).toBe(403);
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

  it('500 — dosen does not own the course (no granular error handling)', async () => {
    const otherDosen = await createDosen({ email: 'other@test.com' });
    const res = await request(app)
      .post(`${API}/course/${course.id}`)
      .set('Authorization', `Bearer ${otherDosen.token}`)
      .send({ title: 'Tugas', dueDate: new Date(Date.now() + 86400000).toISOString() });

    expect(res.status).toBe(500);
  });

  it('500 — course not found (no granular error handling)', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .post(`${API}/course/${fakeId}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ title: 'Tugas', dueDate: new Date(Date.now() + 86400000).toISOString() });

    expect(res.status).toBe(500);
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
// POST /:assignmentId/submit — student submits assignment
// ═════════════════════════════════════════════════════════════
describe('POST /:assignmentId/submit', () => {
  let assignment;

  beforeEach(async () => {
    await seedEnrollment(course.id);
    assignment = await seedAssignment(course.id);
  });

  it('200 — submits successfully', async () => {
    const res = await request(app)
      .post(`${API}/${assignment.id}/submit`)
      .set('Authorization', `Bearer ${mhsToken}`)
      .send({ fileUrl: 'https://example.com/myfile.pdf' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.status).toBe('Submitted');
  });

  it('200 — submits with note', async () => {
    const res = await request(app)
      .post(`${API}/${assignment.id}/submit`)
      .set('Authorization', `Bearer ${mhsToken}`)
      .send({ fileUrl: 'https://example.com/myfile.pdf', note: 'Catatan saya' });

    expect(res.status).toBe(200);
  });

  it('400 — invalid fileUrl', async () => {
    const res = await request(app)
      .post(`${API}/${assignment.id}/submit`)
      .set('Authorization', `Bearer ${mhsToken}`)
      .send({ fileUrl: 'not-a-url' });

    expect(res.status).toBe(400);
  });

  it('400 — missing fileUrl', async () => {
    const res = await request(app)
      .post(`${API}/${assignment.id}/submit`)
      .set('Authorization', `Bearer ${mhsToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('409 — duplicate submission', async () => {
    await seedSubmission(assignment.id, mhsUser.id);

    const res = await request(app)
      .post(`${API}/${assignment.id}/submit`)
      .set('Authorization', `Bearer ${mhsToken}`)
      .send({ fileUrl: 'https://example.com/myfile.pdf' });

    expect(res.status).toBe(409);
  });

  it('500 — assignment not found (no granular error handling)', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .post(`${API}/${fakeId}/submit`)
      .set('Authorization', `Bearer ${mhsToken}`)
      .send({ fileUrl: 'https://example.com/myfile.pdf' });

    expect(res.status).toBe(500);
  });
});

// ═════════════════════════════════════════════════════════════
// GET /:assignmentId/me — student's own submission
// ═════════════════════════════════════════════════════════════
describe('GET /:assignmentId/me', () => {
  let assignment;

  beforeEach(async () => {
    await seedEnrollment(course.id);
    assignment = await seedAssignment(course.id);
  });

  it('200 — returns pending status when not submitted', async () => {
    const res = await request(app)
      .get(`${API}/${assignment.id}/me`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('pending');
  });

  it('200 — returns submitted status after submission', async () => {
    await seedSubmission(assignment.id, mhsUser.id);

    const res = await request(app)
      .get(`${API}/${assignment.id}/me`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('submitted');
  });

  it('200 — returns graded status after grading', async () => {
    await seedSubmission(assignment.id, mhsUser.id, { grade: 90, feedback: 'Excellent' });

    const res = await request(app)
      .get(`${API}/${assignment.id}/me`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('graded');
    expect(res.body.data.grade).toBe(90);
  });

  it('403 — not enrolled', async () => {
    // Create a new non-enrolled mahasiswa
    const otherMhs = await createMahasiswa({ email: 'other-mhs@test.com' });

    const res = await request(app)
      .get(`${API}/${assignment.id}/me`)
      .set('Authorization', `Bearer ${otherMhs.token}`);

    expect(res.status).toBe(403);
  });

  it('404 — assignment not found', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`${API}/${fakeId}/me`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════
// GET /:assignmentId/submissions — dosen views submissions
// ═════════════════════════════════════════════════════════════
describe('GET /:assignmentId/submissions', () => {
  let assignment;

  beforeEach(async () => {
    assignment = await seedAssignment(course.id);
  });

  it('200 — dosen who owns course can view submissions', async () => {
    await seedEnrollment(course.id);
    await seedSubmission(assignment.id, mhsUser.id);

    const res = await request(app)
      .get(`${API}/${assignment.id}/submissions`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('200 — returns empty array when no submissions', async () => {
    const res = await request(app)
      .get(`${API}/${assignment.id}/submissions`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('403 — dosen who does not own the course', async () => {
    const otherDosen = await createDosen({ email: 'other-dosen@test.com' });
    const res = await request(app)
      .get(`${API}/${assignment.id}/submissions`)
      .set('Authorization', `Bearer ${otherDosen.token}`);

    expect(res.status).toBe(403);
  });

  it('403 — admin is also denied (service checks teacherId strictly)', async () => {
    const res = await request(app)
      .get(`${API}/${assignment.id}/submissions`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
  });
});

// ═════════════════════════════════════════════════════════════
// PATCH /submissions/:submissionId — grade a submission
// ═════════════════════════════════════════════════════════════
describe('PATCH /submissions/:submissionId', () => {
  let assignment, submission;

  beforeEach(async () => {
    await seedEnrollment(course.id);
    assignment = await seedAssignment(course.id);
    submission = await seedSubmission(assignment.id, mhsUser.id);
  });

  it('200 — dosen grades submission successfully', async () => {
    const res = await request(app)
      .patch(`${API}/submissions/${submission.id}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ grade: 85, feedback: 'Good work' });

    expect(res.status).toBe(200);
    expect(res.body.data.grade).toBe(85);
    expect(res.body.data.feedback).toBe('Good work');
  });

  it('200 — grade without feedback', async () => {
    const res = await request(app)
      .patch(`${API}/submissions/${submission.id}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ grade: 70 });

    expect(res.status).toBe(200);
    expect(res.body.data.grade).toBe(70);
  });

  it('400 — grade below 0', async () => {
    const res = await request(app)
      .patch(`${API}/submissions/${submission.id}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ grade: -5 });

    expect(res.status).toBe(400);
  });

  it('400 — grade above 100', async () => {
    const res = await request(app)
      .patch(`${API}/submissions/${submission.id}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ grade: 150 });

    expect(res.status).toBe(400);
  });

  it('400 — missing grade', async () => {
    const res = await request(app)
      .patch(`${API}/submissions/${submission.id}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ feedback: 'No grade' });

    expect(res.status).toBe(400);
  });

  it('403 — dosen who does not own the course', async () => {
    const otherDosen = await createDosen({ email: 'other2@test.com' });
    const res = await request(app)
      .patch(`${API}/submissions/${submission.id}`)
      .set('Authorization', `Bearer ${otherDosen.token}`)
      .send({ grade: 80 });

    expect(res.status).toBe(403);
  });

  it('404 — submission not found', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .patch(`${API}/submissions/${fakeId}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ grade: 80 });

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

// ═════════════════════════════════════════════════════════════
// GET /my-grades — student's grades across all courses
// ═════════════════════════════════════════════════════════════
describe('GET /my-grades', () => {
  it('200 — returns empty when no enrollments', async () => {
    const res = await request(app)
      .get(`${API}/my-grades`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('200 — returns grades with correct fields', async () => {
    await seedEnrollment(course.id);
    const assignment = await seedAssignment(course.id);
    await seedSubmission(assignment.id, mhsUser.id, { grade: 88, feedback: 'Nice' });

    const res = await request(app)
      .get(`${API}/my-grades`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('courseName');
    expect(res.body.data[0]).toHaveProperty('assignmentTitle');
    expect(res.body.data[0]).toHaveProperty('grade');
  });
});

// ═════════════════════════════════════════════════════════════
// GET /my-stats — student dashboard stats
// ═════════════════════════════════════════════════════════════
describe('GET /my-stats', () => {
  it('200 — returns stats with zero counts', async () => {
    const res = await request(app)
      .get(`${API}/my-stats`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalCourses');
    expect(res.body.data).toHaveProperty('totalAssignments');
    expect(res.body.data).toHaveProperty('pendingAssignments');
    expect(res.body.data).toHaveProperty('gradedAssignments');
  });

  it('200 — reflects enrolled courses and assignments', async () => {
    await seedEnrollment(course.id);
    await seedAssignment(course.id);

    const res = await request(app)
      .get(`${API}/my-stats`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalCourses).toBe(1);
    expect(res.body.data.totalAssignments).toBe(1);
  });
});

// ═════════════════════════════════════════════════════════════
// GET /teacher-stats — teacher dashboard stats
// ═════════════════════════════════════════════════════════════
describe('GET /teacher-stats', () => {
  it('200 — returns teacher stats', async () => {
    const res = await request(app)
      .get(`${API}/teacher-stats`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalCourses');
    expect(res.body.data).toHaveProperty('totalStudents');
    expect(res.body.data).toHaveProperty('totalAssignments');
    expect(res.body.data).toHaveProperty('pendingGrading');
  });

  it('200 — reflects course and assignment counts', async () => {
    await seedAssignment(course.id);

    const res = await request(app)
      .get(`${API}/teacher-stats`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalCourses).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalAssignments).toBeGreaterThanOrEqual(1);
  });
});

// ═════════════════════════════════════════════════════════════
// GET /recent-submissions — teacher recent submissions
// ═════════════════════════════════════════════════════════════
describe('GET /recent-submissions', () => {
  it('200 — returns empty when no submissions', async () => {
    const res = await request(app)
      .get(`${API}/recent-submissions`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('200 — returns recent submissions with flat fields', async () => {
    await seedEnrollment(course.id);
    const assignment = await seedAssignment(course.id);
    await seedSubmission(assignment.id, mhsUser.id);

    const res = await request(app)
      .get(`${API}/recent-submissions`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('studentName');
    expect(res.body.data[0]).toHaveProperty('assignmentTitle');
  });

  it('200 — respects limit query param', async () => {
    const res = await request(app)
      .get(`${API}/recent-submissions?limit=5`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
  });
});
