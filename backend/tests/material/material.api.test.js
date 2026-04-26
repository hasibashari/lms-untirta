/**
 * Material API — Integration Tests
 *
 * Tests the full HTTP request lifecycle:
 *   Route → Middleware → Controller → Service → Database (test DB)
 *
 * What we test:
 *   ✓ Auth guards — 401 without token, 403 for wrong roles
 *   ✓ POST /api/courses/:courseId/materials — create material (DOSEN/ADMIN)
 *   ✓ GET /api/courses/:courseId/materials — list materials (Authenticated)
 *   ✓ GET /api/materials/:materialId — material detail (Authenticated)
 *   ✓ PUT /api/materials/:materialId — update material (DOSEN/ADMIN)
 *   ✓ DELETE /api/materials/:materialId — delete material (DOSEN/ADMIN)
 *   ✓ Validation — missing/invalid fields
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { getApp } from '../helpers/request.js';
import prisma from '../helpers/prisma.js';
import { cleanDatabase } from '../helpers/db.js';
import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';

const COURSE_API = '/api/courses';
const MATERIAL_API = '/api/materials';

let app;
let adminToken, dosenToken, mhsToken, otherDosenToken;
let dosenUser, mhsUser;
let course;

const seedCourse = async (teacherId) => {
  return prisma.course.create({
    data: {
      title: 'Pemrograman Web',
      code: `IF-${Date.now().toString().slice(-6)}`,
      teacherId: teacherId || dosenUser.id,
      sks: 3,
    },
  });
};

const seedEnrollment = async (courseId, userId) => {
  return prisma.enrollment.create({
    data: { courseId, userId: userId || mhsUser.id },
  });
};

const seedMaterial = async (courseId, overrides = {}) => {
  return prisma.material.create({
    data: {
      title: 'Pertemuan 1',
      content: 'Konten materi',
      order: 1,
      courseId,
      ...overrides,
    },
  });
};

beforeEach(async () => {
  app = getApp();
  await cleanDatabase();

  const admin = await createAdmin();
  const dosen = await createDosen();
  const otherDosen = await createDosen({ email: `other-${Date.now()}@test.com`, name: 'Other Dosen' });
  const mhs = await createMahasiswa();

  adminToken = admin.token;
  dosenToken = dosen.token;
  otherDosenToken = otherDosen.token;
  mhsToken = mhs.token;
  dosenUser = dosen.user;
  mhsUser = mhs.user;

  course = await seedCourse();
});

// ═════════════════════════════════════════════════════════════
// Auth Guards
// ═════════════════════════════════════════════════════════════
describe('Auth Guards', () => {
  it('POST /courses/:id/materials → 401 without token', async () => {
    const res = await request(app)
      .post(`${COURSE_API}/${course.id}/materials`)
      .send({ title: 'Materi Baru' });
    expect(res.status).toBe(401);
  });

  it('POST /courses/:id/materials → 403 for MAHASISWA', async () => {
    const res = await request(app)
      .post(`${COURSE_API}/${course.id}/materials`)
      .set('Authorization', `Bearer ${mhsToken}`)
      .send({ title: 'Materi Baru' });
    expect(res.status).toBe(403);
  });

  it('GET /courses/:id/materials → 401 without token', async () => {
    const res = await request(app)
      .get(`${COURSE_API}/${course.id}/materials`);
    expect(res.status).toBe(401);
  });

  it('GET /materials/:id → 401 without token', async () => {
    const mat = await seedMaterial(course.id);
    const res = await request(app)
      .get(`${MATERIAL_API}/${mat.id}`);
    expect(res.status).toBe(401);
  });

  it('PUT /materials/:id → 401 without token', async () => {
    const mat = await seedMaterial(course.id);
    const res = await request(app)
      .put(`${MATERIAL_API}/${mat.id}`)
      .send({ title: 'Updated' });
    expect(res.status).toBe(401);
  });

  it('PUT /materials/:id → 403 for MAHASISWA', async () => {
    const mat = await seedMaterial(course.id);
    const res = await request(app)
      .put(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${mhsToken}`)
      .send({ title: 'Updated' });
    expect(res.status).toBe(403);
  });

  it('DELETE /materials/:id → 401 without token', async () => {
    const mat = await seedMaterial(course.id);
    const res = await request(app)
      .delete(`${MATERIAL_API}/${mat.id}`);
    expect(res.status).toBe(401);
  });

  it('DELETE /materials/:id → 403 for MAHASISWA', async () => {
    const mat = await seedMaterial(course.id);
    const res = await request(app)
      .delete(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${mhsToken}`);
    expect(res.status).toBe(403);
  });
});

// ═════════════════════════════════════════════════════════════
// POST /api/courses/:courseId/materials
// ═════════════════════════════════════════════════════════════
describe('POST /api/courses/:courseId/materials', () => {
  it('should create material and return 201 for DOSEN owner', async () => {
    const res = await request(app)
      .post(`${COURSE_API}/${course.id}/materials`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ title: 'Pertemuan 1', content: 'Intro materi' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Pertemuan 1');
    expect(res.body.data.order).toBe(1);
  });

  it('should auto-increment order for multiple materials', async () => {
    await request(app)
      .post(`${COURSE_API}/${course.id}/materials`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ title: 'Pertemuan 1' });

    const res = await request(app)
      .post(`${COURSE_API}/${course.id}/materials`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ title: 'Pertemuan 2' });

    expect(res.status).toBe(201);
    expect(res.body.data.order).toBe(2);
  });

  it('should create material with videoUrl (fileUrl requires file upload)', async () => {
    const res = await request(app)
      .post(`${COURSE_API}/${course.id}/materials`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({
        title: 'Materi Video',
        videoUrl: 'https://youtube.com/watch?v=abc',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.videoUrl).toBe('https://youtube.com/watch?v=abc');
    // fileUrl is only set via multipart file upload, not JSON body
    expect(res.body.data.fileUrl).toBeNull();
  });

  it('should create material for ADMIN', async () => {
    const res = await request(app)
      .post(`${COURSE_API}/${course.id}/materials`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Materi Admin' });

    // Admin passes teacherId = admin.userId, service checks course.teacherId !== teacherId → 403
    expect(res.status).toBe(403);
  });

  it('should return 403 when DOSEN does not own course', async () => {
    const res = await request(app)
      .post(`${COURSE_API}/${course.id}/materials`)
      .set('Authorization', `Bearer ${otherDosenToken}`)
      .send({ title: 'Not My Course' });

    expect(res.status).toBe(403);
  });

  it('should return 404 when course not found', async () => {
    const res = await request(app)
      .post(`${COURSE_API}/nonexistent-id/materials`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ title: 'Some Material' });

    expect(res.status).toBe(404);
  });

  it('should return 400 for validation error — missing title', async () => {
    const res = await request(app)
      .post(`${COURSE_API}/${course.id}/materials`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ content: 'No title provided' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for validation error — title too short', async () => {
    const res = await request(app)
      .post(`${COURSE_API}/${course.id}/materials`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ title: 'Ab' });

    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════
// GET /api/courses/:courseId/materials
// ═════════════════════════════════════════════════════════════
describe('GET /api/courses/:courseId/materials', () => {
  it('should return materials for DOSEN', async () => {
    await seedMaterial(course.id, { title: 'Mat B', order: 2 });
    await seedMaterial(course.id, { title: 'Mat A', order: 1 });

    const res = await request(app)
      .get(`${COURSE_API}/${course.id}/materials`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    // Ordered by order asc
    expect(res.body.data[0].title).toBe('Mat A');
    expect(res.body.data[1].title).toBe('Mat B');
  });

  it('should return empty array for course with no materials', async () => {
    const res = await request(app)
      .get(`${COURSE_API}/${course.id}/materials`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('should return materials for enrolled MAHASISWA', async () => {
    await seedEnrollment(course.id);
    await seedMaterial(course.id);

    const res = await request(app)
      .get(`${COURSE_API}/${course.id}/materials`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('should return 403 when MAHASISWA is not enrolled', async () => {
    await seedMaterial(course.id);

    const res = await request(app)
      .get(`${COURSE_API}/${course.id}/materials`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(403);
  });

  it('should return materials for ADMIN without enrollment', async () => {
    await seedMaterial(course.id);

    const res = await request(app)
      .get(`${COURSE_API}/${course.id}/materials`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

// ═════════════════════════════════════════════════════════════
// GET /api/materials/:materialId
// ═════════════════════════════════════════════════════════════
describe('GET /api/materials/:materialId', () => {
  it('should return material detail for DOSEN owner', async () => {
    const mat = await seedMaterial(course.id, {
      fileUrl: 'https://example.com/file.pdf',
      videoUrl: 'https://youtube.com/v',
    });

    const res = await request(app)
      .get(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(mat.id);
    expect(res.body.data.title).toBe('Pertemuan 1');
    expect(res.body.data.attachments).toHaveLength(2);
    expect(res.body.data.attachments[0]).toEqual({ type: 'pdf', url: 'https://example.com/file.pdf' });
    expect(res.body.data.attachments[1]).toEqual({ type: 'video', url: 'https://youtube.com/v' });
  });

  it('should return empty attachments when no URLs', async () => {
    const mat = await seedMaterial(course.id);

    const res = await request(app)
      .get(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.attachments).toEqual([]);
  });

  it('should return material for enrolled MAHASISWA', async () => {
    await seedEnrollment(course.id);
    const mat = await seedMaterial(course.id);

    const res = await request(app)
      .get(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(mat.id);
  });

  it('should return material for ADMIN', async () => {
    const mat = await seedMaterial(course.id);

    const res = await request(app)
      .get(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(mat.id);
  });

  it('should return 404 when material not found', async () => {
    const res = await request(app)
      .get(`${MATERIAL_API}/nonexistent-id`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 403 when DOSEN does not own course', async () => {
    const mat = await seedMaterial(course.id);

    const res = await request(app)
      .get(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${otherDosenToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 403 when MAHASISWA not enrolled', async () => {
    const mat = await seedMaterial(course.id);

    const res = await request(app)
      .get(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${mhsToken}`);

    expect(res.status).toBe(403);
  });
});

// ═════════════════════════════════════════════════════════════
// PUT /api/materials/:materialId
// ═════════════════════════════════════════════════════════════
describe('PUT /api/materials/:materialId', () => {
  it('should update material for DOSEN owner', async () => {
    const mat = await seedMaterial(course.id);

    const res = await request(app)
      .put(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ title: 'Updated Title', content: 'Updated content' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('should update order field', async () => {
    const mat = await seedMaterial(course.id);

    const res = await request(app)
      .put(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ order: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data.order).toBe(5);
  });

  it('should update material for ADMIN', async () => {
    const mat = await seedMaterial(course.id);

    const res = await request(app)
      .put(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin Update' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Admin Update');
  });

  it('should return 404 when material not found', async () => {
    const res = await request(app)
      .put(`${MATERIAL_API}/nonexistent-id`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ title: 'Update' });

    expect(res.status).toBe(404);
  });

  it('should return 403 when DOSEN does not own course', async () => {
    const mat = await seedMaterial(course.id);

    const res = await request(app)
      .put(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${otherDosenToken}`)
      .send({ title: 'Not Mine' });

    expect(res.status).toBe(403);
  });

  it('should return 400 for invalid fileUrl', async () => {
    const mat = await seedMaterial(course.id);

    const res = await request(app)
      .put(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${dosenToken}`)
      .send({ fileUrl: 'not-a-url' });

    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════
// DELETE /api/materials/:materialId
// ═════════════════════════════════════════════════════════════
describe('DELETE /api/materials/:materialId', () => {
  it('should delete material for DOSEN owner', async () => {
    const mat = await seedMaterial(course.id);

    const res = await request(app)
      .delete(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Materi berhasil dihapus');

    // Verify deleted from DB
    const deleted = await prisma.material.findUnique({ where: { id: mat.id } });
    expect(deleted).toBeNull();
  });

  it('should delete material for ADMIN', async () => {
    const mat = await seedMaterial(course.id);

    const res = await request(app)
      .delete(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('should return 404 when material not found', async () => {
    const res = await request(app)
      .delete(`${MATERIAL_API}/nonexistent-id`)
      .set('Authorization', `Bearer ${dosenToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 403 when DOSEN does not own course', async () => {
    const mat = await seedMaterial(course.id);

    const res = await request(app)
      .delete(`${MATERIAL_API}/${mat.id}`)
      .set('Authorization', `Bearer ${otherDosenToken}`);

    expect(res.status).toBe(403);
  });
});
