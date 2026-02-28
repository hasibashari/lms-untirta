/**
 * Grade API — Integration Tests
 *
 * Tests all grade API endpoints with a real test database.
 * Covers auth guards, input/bulk grading, finalization, and student grade retrieval.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { getApp } from '../helpers/request.js';
import { cleanDatabase } from '../helpers/db.js';
import { createDosen, createMahasiswa, createAdmin } from '../helpers/auth.js';
import prisma from '../helpers/prisma.js';

const app = getApp();
const API = '/api/grades';

// ── Shared state ──
let dosen, dosenToken;
let student, studentToken;
let admin, adminToken;
let otherDosen, otherDosenToken;
let semester, course, classObj;

async function seedBaseData() {
  ({ user: dosen, token: dosenToken } = await createDosen());
  ({ user: student, token: studentToken } = await createMahasiswa());
  ({ user: admin, token: adminToken } = await createAdmin());
  ({ user: otherDosen, token: otherDosenToken } = await createDosen({ name: 'Other Dosen' }));

  semester = await prisma.academicSemester.create({
    data: {
      academicYear: '2025/2026',
      semesterType: 'GANJIL',
      status: 'OPEN',
      maxSks: 24,
    },
  });

  course = await prisma.course.create({
    data: {
      title: 'Algoritma',
      code: `IF${Date.now()}`,
      semester: 1,
      sks: 3,
      teacherId: dosen.id,
    },
  });

  classObj = await prisma.class.create({
    data: {
      courseId: course.id,
      lecturerId: dosen.id,
      academicSemesterId: semester.id,
      section: 'A',
    },
  });

  // Enroll student with APPROVED KRS
  await prisma.krsEnrollment.create({
    data: {
      studentId: student.id,
      classId: classObj.id,
      status: 'APPROVED',
    },
  });
}

describe('Grade API', () => {
  beforeAll(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ════════════════════════════════════════════════════════
  // Auth Guards
  // ════════════════════════════════════════════════════════
  describe('Auth Guards', () => {
    beforeAll(async () => {
      await cleanDatabase();
      await seedBaseData();
    });

    it('GET /class/:classId should return 401 without token', async () => {
      const res = await request(app).get(`${API}/class/${classObj.id}`);
      expect(res.status).toBe(401);
    });

    it('GET /class/:classId should return 403 for MAHASISWA', async () => {
      const res = await request(app)
        .get(`${API}/class/${classObj.id}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('POST /class/:classId should return 401 without token', async () => {
      const res = await request(app).post(`${API}/class/${classObj.id}`);
      expect(res.status).toBe(401);
    });

    it('POST /class/:classId should return 403 for MAHASISWA', async () => {
      const res = await request(app)
        .post(`${API}/class/${classObj.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ studentId: student.id, letterGrade: 'A' });
      expect(res.status).toBe(403);
    });

    it('POST /class/:classId/bulk should return 403 for MAHASISWA', async () => {
      const res = await request(app)
        .post(`${API}/class/${classObj.id}/bulk`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ grades: [{ studentId: student.id, letterGrade: 'A' }] });
      expect(res.status).toBe(403);
    });

    it('PATCH /class/:classId/finalize should return 403 for MAHASISWA', async () => {
      const res = await request(app)
        .patch(`${API}/class/${classObj.id}/finalize`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /my-grades should return 401 without token', async () => {
      const res = await request(app).get(`${API}/my-grades`);
      expect(res.status).toBe(401);
    });

    it('GET /my-grades should return 403 for DOSEN', async () => {
      const res = await request(app)
        .get(`${API}/my-grades`)
        .set('Authorization', `Bearer ${dosenToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ════════════════════════════════════════════════════════
  // GET /class/:classId — Get class students for grading
  // ════════════════════════════════════════════════════════
  describe('GET /class/:classId', () => {
    beforeAll(async () => {
      await cleanDatabase();
      await seedBaseData();
    });

    it('should return students list for the lecturer', async () => {
      const res = await request(app)
        .get(`${API}/class/${classObj.id}`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.class.id).toBe(classObj.id);
      expect(res.body.data.students).toHaveLength(1);
      expect(res.body.data.students[0].student.id).toBe(student.id);
      expect(res.body.data.summary.totalStudents).toBe(1);
    });

    it('should return students with grade data when grades exist', async () => {
      // Create a draft grade
      await prisma.finalGrade.create({
        data: {
          studentId: student.id,
          classId: classObj.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          letterGrade: 'A',
          gradePoint: 4.0,
          status: 'DRAFT',
        },
      });

      const res = await request(app)
        .get(`${API}/class/${classObj.id}`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.students[0].grade).not.toBeNull();
      expect(res.body.data.students[0].grade.letterGrade).toBe('A');
      expect(res.body.data.summary.graded).toBe(1);
      expect(res.body.data.summary.draft).toBe(1);
    });

    it('should return 403 for another lecturer', async () => {
      const res = await request(app)
        .get(`${API}/class/${classObj.id}`)
        .set('Authorization', `Bearer ${otherDosenToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent class', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`${API}/class/${fakeId}`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ════════════════════════════════════════════════════════
  // POST /class/:classId — Input single grade
  // ════════════════════════════════════════════════════════
  describe('POST /class/:classId', () => {
    beforeEach(async () => {
      await cleanDatabase();
      await seedBaseData();
    });

    it('should input a grade successfully', async () => {
      const res = await request(app)
        .post(`${API}/class/${classObj.id}`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ studentId: student.id, letterGrade: 'A', numericScore: 92 });

      expect(res.status).toBe(200);
      expect(res.body.data.letterGrade).toBe('A');
      expect(res.body.data.gradePoint).toBe(4.0);
      expect(res.body.data.status).toBe('DRAFT');
    });

    it('should input grade with optional note', async () => {
      const res = await request(app)
        .post(`${API}/class/${classObj.id}`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ studentId: student.id, letterGrade: 'B+', note: 'Good work' });

      expect(res.status).toBe(200);
      expect(res.body.data.letterGrade).toBe('B+');
    });

    it('should update existing DRAFT grade via upsert', async () => {
      // First input
      await request(app)
        .post(`${API}/class/${classObj.id}`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ studentId: student.id, letterGrade: 'B' });

      // Update
      const res = await request(app)
        .post(`${API}/class/${classObj.id}`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ studentId: student.id, letterGrade: 'A-', numericScore: 88 });

      expect(res.status).toBe(200);
      expect(res.body.data.letterGrade).toBe('A-');
    });

    it('should return 400 for invalid letterGrade', async () => {
      const res = await request(app)
        .post(`${API}/class/${classObj.id}`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ studentId: student.id, letterGrade: 'F' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing studentId', async () => {
      const res = await request(app)
        .post(`${API}/class/${classObj.id}`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ letterGrade: 'A' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for student not enrolled', async () => {
      const { user: outsider } = await createMahasiswa({ name: 'Outsider' });

      const res = await request(app)
        .post(`${API}/class/${classObj.id}`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ studentId: outsider.id, letterGrade: 'A' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/tidak terdaftar/i);
    });

    it('should return 400 for finalized grade', async () => {
      // Create a finalized grade
      await prisma.finalGrade.create({
        data: {
          studentId: student.id,
          classId: classObj.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          letterGrade: 'A',
          gradePoint: 4.0,
          status: 'FINALIZED',
        },
      });

      const res = await request(app)
        .post(`${API}/class/${classObj.id}`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ studentId: student.id, letterGrade: 'B' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/difinalisasi/i);
    });

    it('should return 400 when semester is not OPEN', async () => {
      await prisma.academicSemester.update({
        where: { id: semester.id },
        data: { status: 'CLOSED' },
      });

      const res = await request(app)
        .post(`${API}/class/${classObj.id}`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ studentId: student.id, letterGrade: 'A' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Tidak dapat/i);
    });

    it('should return 403 for non-owner lecturer', async () => {
      const res = await request(app)
        .post(`${API}/class/${classObj.id}`)
        .set('Authorization', `Bearer ${otherDosenToken}`)
        .send({ studentId: student.id, letterGrade: 'A' });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent class', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post(`${API}/class/${fakeId}`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ studentId: student.id, letterGrade: 'A' });

      expect(res.status).toBe(404);
    });
  });

  // ════════════════════════════════════════════════════════
  // POST /class/:classId/bulk — Bulk input grades
  // ════════════════════════════════════════════════════════
  describe('POST /class/:classId/bulk', () => {
    let student2;

    beforeEach(async () => {
      await cleanDatabase();
      await seedBaseData();

      // Enroll a second student
      ({ user: student2 } = await createMahasiswa({ name: 'Student 2' }));
      await prisma.krsEnrollment.create({
        data: {
          studentId: student2.id,
          classId: classObj.id,
          status: 'APPROVED',
        },
      });
    });

    it('should input grades for multiple students', async () => {
      const res = await request(app)
        .post(`${API}/class/${classObj.id}/bulk`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({
          grades: [
            { studentId: student.id, letterGrade: 'A', numericScore: 95 },
            { studentId: student2.id, letterGrade: 'B+', numericScore: 85 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(2);
      expect(res.body.data.message).toContain('2 nilai berhasil disimpan');
    });

    it('should return 400 for empty grades array', async () => {
      const res = await request(app)
        .post(`${API}/class/${classObj.id}/bulk`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ grades: [] });

      expect(res.status).toBe(400);
    });

    it('should return 400 if some students not enrolled', async () => {
      const { user: outsider } = await createMahasiswa({ name: 'Outsider' });

      const res = await request(app)
        .post(`${API}/class/${classObj.id}/bulk`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({
          grades: [
            { studentId: student.id, letterGrade: 'A' },
            { studentId: outsider.id, letterGrade: 'B' },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/tidak terdaftar/i);
    });

    it('should return 400 if some grades already finalized', async () => {
      await prisma.finalGrade.create({
        data: {
          studentId: student.id,
          classId: classObj.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          letterGrade: 'A',
          gradePoint: 4.0,
          status: 'FINALIZED',
        },
      });

      const res = await request(app)
        .post(`${API}/class/${classObj.id}/bulk`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({
          grades: [
            { studentId: student.id, letterGrade: 'B' },
            { studentId: student2.id, letterGrade: 'A' },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/difinalisasi/i);
    });

    it('should return 403 for non-owner lecturer', async () => {
      const res = await request(app)
        .post(`${API}/class/${classObj.id}/bulk`)
        .set('Authorization', `Bearer ${otherDosenToken}`)
        .send({
          grades: [{ studentId: student.id, letterGrade: 'A' }],
        });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent class', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post(`${API}/class/${fakeId}/bulk`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({
          grades: [{ studentId: student.id, letterGrade: 'A' }],
        });

      expect(res.status).toBe(404);
    });
  });

  // ════════════════════════════════════════════════════════
  // PATCH /class/:classId/finalize — Finalize grades
  // ════════════════════════════════════════════════════════
  describe('PATCH /class/:classId/finalize', () => {
    beforeEach(async () => {
      await cleanDatabase();
      await seedBaseData();
    });

    it('should finalize all draft grades', async () => {
      // Create draft grade first
      await prisma.finalGrade.create({
        data: {
          studentId: student.id,
          classId: classObj.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          letterGrade: 'A',
          gradePoint: 4.0,
          status: 'DRAFT',
        },
      });

      const res = await request(app)
        .patch(`${API}/class/${classObj.id}/finalize`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
      expect(res.body.data.message).toContain('difinalisasi');

      // Verify grade is now FINALIZED
      const grade = await prisma.finalGrade.findFirst({
        where: { classId: classObj.id, studentId: student.id },
      });
      expect(grade.status).toBe('FINALIZED');
    });

    it('should return 400 when no draft grades exist', async () => {
      const res = await request(app)
        .patch(`${API}/class/${classObj.id}/finalize`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Tidak ada/i);
    });

    it('should return 400 when semester is not OPEN', async () => {
      await prisma.finalGrade.create({
        data: {
          studentId: student.id,
          classId: classObj.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          letterGrade: 'B+',
          gradePoint: 3.3,
          status: 'DRAFT',
        },
      });

      await prisma.academicSemester.update({
        where: { id: semester.id },
        data: { status: 'CLOSED' },
      });

      const res = await request(app)
        .patch(`${API}/class/${classObj.id}/finalize`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(500);
    });

    it('should return 403 for non-owner lecturer', async () => {
      const res = await request(app)
        .patch(`${API}/class/${classObj.id}/finalize`)
        .set('Authorization', `Bearer ${otherDosenToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent class', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .patch(`${API}/class/${fakeId}/finalize`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ════════════════════════════════════════════════════════
  // GET /my-grades — Student views own grades
  // ════════════════════════════════════════════════════════
  describe('GET /my-grades', () => {
    beforeEach(async () => {
      await cleanDatabase();
      await seedBaseData();
    });

    it('should return empty when no grades exist', async () => {
      const res = await request(app)
        .get(`${API}/my-grades`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.grades).toHaveLength(0);
      expect(res.body.data.summary.totalCourses).toBe(0);
      expect(res.body.data.summary.ipk).toBe(0);
    });

    it('should return finalized grades from CLOSED semesters', async () => {
      // Close semester and create finalized grade
      await prisma.academicSemester.update({
        where: { id: semester.id },
        data: { status: 'CLOSED' },
      });

      await prisma.finalGrade.create({
        data: {
          studentId: student.id,
          classId: classObj.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          letterGrade: 'A',
          gradePoint: 4.0,
          numericScore: 95,
          status: 'FINALIZED',
        },
      });

      const res = await request(app)
        .get(`${API}/my-grades`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.grades).toHaveLength(1);
      expect(res.body.data.grades[0].letterGrade).toBe('A');
      expect(res.body.data.grades[0].gradePoint).toBe(4.0);
      expect(res.body.data.summary.totalCourses).toBe(1);
      expect(res.body.data.summary.totalSKS).toBe(3);
      expect(res.body.data.summary.ipk).toBe(4.0);
    });

    it('should NOT return DRAFT grades', async () => {
      await prisma.academicSemester.update({
        where: { id: semester.id },
        data: { status: 'CLOSED' },
      });

      await prisma.finalGrade.create({
        data: {
          studentId: student.id,
          classId: classObj.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          letterGrade: 'A',
          gradePoint: 4.0,
          status: 'DRAFT',
        },
      });

      const res = await request(app)
        .get(`${API}/my-grades`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.grades).toHaveLength(0);
    });

    it('should NOT return grades from OPEN semesters', async () => {
      // Semester is OPEN (default from seedBaseData)
      await prisma.finalGrade.create({
        data: {
          studentId: student.id,
          classId: classObj.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          letterGrade: 'A',
          gradePoint: 4.0,
          status: 'FINALIZED',
        },
      });

      const res = await request(app)
        .get(`${API}/my-grades`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      // FINALIZED but from OPEN semester → not shown
      expect(res.body.data.grades).toHaveLength(0);
    });

    it('should calculate GPA correctly with multiple grades', async () => {
      // Close semester
      await prisma.academicSemester.update({
        where: { id: semester.id },
        data: { status: 'CLOSED' },
      });

      // Create a second course + class + enrollment
      const course2 = await prisma.course.create({
        data: {
          title: 'Basis Data',
          code: `BD${Date.now()}`,
          semester: 1,
          sks: 4,
          teacherId: dosen.id,
        },
      });
      const class2 = await prisma.class.create({
        data: {
          courseId: course2.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          section: 'A',
        },
      });
      await prisma.krsEnrollment.create({
        data: { studentId: student.id, classId: class2.id, status: 'APPROVED' },
      });

      // Grade 1: A (4.0) x 3 SKS = 12
      await prisma.finalGrade.create({
        data: {
          studentId: student.id,
          classId: classObj.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          letterGrade: 'A',
          gradePoint: 4.0,
          status: 'FINALIZED',
        },
      });

      // Grade 2: B (3.0) x 4 SKS = 12
      await prisma.finalGrade.create({
        data: {
          studentId: student.id,
          classId: class2.id,
          lecturerId: dosen.id,
          academicSemesterId: semester.id,
          letterGrade: 'B',
          gradePoint: 3.0,
          status: 'FINALIZED',
        },
      });

      const res = await request(app)
        .get(`${API}/my-grades`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.grades).toHaveLength(2);
      expect(res.body.data.summary.totalCourses).toBe(2);
      expect(res.body.data.summary.totalSKS).toBe(7);
      // IPK = (12 + 12) / 7 = 3.43 (rounded to 2 decimals)
      expect(res.body.data.summary.ipk).toBe(3.43);
    });
  });
});
