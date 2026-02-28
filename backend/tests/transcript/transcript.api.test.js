/**
 * Transcript API — Integration Tests
 *
 * Tests the full HTTP request lifecycle:
 *   Route → Middleware → Controller → Service → Database (test DB)
 *
 * What we test:
 *   ✓ Auth guards — 401 without token, 403 for wrong roles
 *   ✓ GET /api/transcript/study-results — study results (MAHASISWA)
 *   ✓ GET /api/transcript/by-class — transcript by class (MAHASISWA)
 *   ✓ GET /api/transcript/summary — academic summary (MAHASISWA)
 *   ✓ GET /api/transcript/students — list students (ADMIN)
 *   ✓ GET /api/transcript/student/:studentId — full transcript (ADMIN/DOSEN)
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { getApp } from '../helpers/request.js';
import { cleanDatabase } from '../helpers/db.js';
import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';
import prisma from '../helpers/prisma.js';

const app = getApp();
const API = '/api/transcript';

// ── Shared state ──
let admin, adminToken;
let dosen, dosenToken;
let student, studentToken;
let otherStudent, otherStudentToken;
let course, semester, closedSemester, classObj, assignment;

async function seedBaseData() {
  ({ user: admin, token: adminToken } = await createAdmin());
  ({ user: dosen, token: dosenToken } = await createDosen());
  ({ user: student, token: studentToken } = await createMahasiswa({ name: 'Student One', nim: '111' }));
  ({ user: otherStudent, token: otherStudentToken } = await createMahasiswa({ name: 'Student Two', nim: '222' }));

  // Open semester — grades NOT visible to students
  semester = await prisma.academicSemester.create({
    data: { academicYear: '2025/2026', semesterType: 'GANJIL', status: 'OPEN', maxSks: 24 },
  });

  // Closed semester — grades visible to students
  closedSemester = await prisma.academicSemester.create({
    data: { academicYear: '2024/2025', semesterType: 'GENAP', status: 'CLOSED', maxSks: 24 },
  });

  course = await prisma.course.create({
    data: { title: 'Pemrograman Web', code: `IF${Date.now()}`, semester: 1, sks: 3, teacherId: dosen.id },
  });

  // Legacy enrollment (for study-results)
  await prisma.enrollment.create({
    data: {
      student: { connect: { id: student.id } },
      course: { connect: { id: course.id } },
    },
  });

  // Assignment on course with student submission
  assignment = await prisma.assignment.create({
    data: { title: 'Tugas 1', courseId: course.id, dueDate: new Date('2025-12-31') },
  });
  await prisma.submission.create({
    data: { assignmentId: assignment.id, studentId: student.id, fileUrl: 'test.pdf', grade: 88 },
  });

  // Class linked to closed semester
  classObj = await prisma.class.create({
    data: { courseId: course.id, lecturerId: dosen.id, academicSemesterId: closedSemester.id, section: 'A' },
  });

  // KRS enrollment — APPROVED
  await prisma.krsEnrollment.create({
    data: { studentId: student.id, classId: classObj.id, status: 'APPROVED' },
  });

  // Finalized grade for the closed semester class
  await prisma.finalGrade.create({
    data: {
      studentId: student.id,
      classId: classObj.id,
      lecturerId: dosen.id,
      academicSemesterId: closedSemester.id,
      numericScore: 88,
      letterGrade: 'A',
      gradePoint: 4.0,
      status: 'FINALIZED',
    },
  });
}

describe('Transcript API', () => {
  beforeAll(async () => {
    await cleanDatabase();
    await seedBaseData();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ════════════════════════════════════════════════
  // Auth Guards
  // ════════════════════════════════════════════════
  describe('Auth Guards', () => {
    it('should reject unauthenticated requests', async () => {
      const endpoints = [
        { method: 'get', url: `${API}/summary` },
        { method: 'get', url: `${API}/study-results` },
        { method: 'get', url: `${API}/by-class` },
        { method: 'get', url: `${API}/students` },
        { method: 'get', url: `${API}/student/${student.id}` },
      ];

      for (const ep of endpoints) {
        const res = await request(app)[ep.method](ep.url);
        expect(res.status).toBe(401);
      }
    });

    it('should reject non-MAHASISWA for student endpoints', async () => {
      const studentEndpoints = [
        `${API}/summary`,
        `${API}/study-results`,
        `${API}/by-class`,
      ];

      for (const url of studentEndpoints) {
        const res = await request(app)
          .get(url)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(403);
      }
    });

    it('should reject non-ADMIN for student list', async () => {
      const res = await request(app)
        .get(`${API}/students`)
        .set('Authorization', `Bearer ${dosenToken}`);
      expect(res.status).toBe(403);
    });

    it('should reject MAHASISWA for full transcript', async () => {
      const res = await request(app)
        .get(`${API}/student/${student.id}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow DOSEN to access full transcript', async () => {
      const res = await request(app)
        .get(`${API}/student/${student.id}`)
        .set('Authorization', `Bearer ${dosenToken}`);
      expect(res.status).toBe(200);
    });

    it('should allow ADMIN to access full transcript', async () => {
      const res = await request(app)
        .get(`${API}/student/${student.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  // ════════════════════════════════════════════════
  // GET /api/transcript/study-results
  // ════════════════════════════════════════════════
  describe('GET /study-results', () => {
    it('should return study results for authenticated student', async () => {
      const res = await request(app)
        .get(`${API}/study-results`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Hasil studi berhasil diambil');
      expect(res.body.data.student).toBeDefined();
      expect(res.body.data.courses).toBeInstanceOf(Array);
      expect(res.body.data.summary).toBeDefined();
    });

    it('should include graded courses with correct calculations', async () => {
      const res = await request(app)
        .get(`${API}/study-results`)
        .set('Authorization', `Bearer ${studentToken}`);

      const coursesWithGrades = res.body.data.courses.filter(c => c.averageScore !== null);
      expect(coursesWithGrades.length).toBeGreaterThan(0);
      expect(coursesWithGrades[0]).toEqual(expect.objectContaining({
        courseName: 'Pemrograman Web',
        averageScore: 88,
        letterGrade: 'A',
      }));
    });

    it('should filter by semester query param', async () => {
      const res = await request(app)
        .get(`${API}/study-results?semester=99`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.courses).toHaveLength(0); // no course in semester 99
    });

    it('should return empty courses for student with no enrollments', async () => {
      const res = await request(app)
        .get(`${API}/study-results`)
        .set('Authorization', `Bearer ${otherStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.courses).toHaveLength(0);
      expect(res.body.data.summary.totalCourses).toBe(0);
    });
  });

  // ════════════════════════════════════════════════
  // GET /api/transcript/by-class
  // ════════════════════════════════════════════════
  describe('GET /by-class', () => {
    it('should return KRS-based transcript for authenticated student', async () => {
      const res = await request(app)
        .get(`${API}/by-class`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Transkrip berhasil diambil');
      expect(res.body.data.courses).toBeInstanceOf(Array);
      expect(res.body.data.semesterBreakdown).toBeInstanceOf(Array);
      expect(res.body.data.summary).toBeDefined();
    });

    it('should show finalized grade from closed semester', async () => {
      const res = await request(app)
        .get(`${API}/by-class`)
        .set('Authorization', `Bearer ${studentToken}`);

      const courseData = res.body.data.courses.find(c => c.courseCode === course.code);
      expect(courseData).toBeDefined();
      expect(courseData.letterGrade).toBe('A');
      expect(courseData.gradePoint).toBe(4.0);
      expect(courseData.gradeSource).toBe('final_grade');
    });

    it('should filter by academicSemesterId', async () => {
      const res = await request(app)
        .get(`${API}/by-class?academicSemesterId=${closedSemester.id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.courses.length).toBeGreaterThan(0);
    });

    it('should return empty for non-matching academicSemesterId', async () => {
      const res = await request(app)
        .get(`${API}/by-class?academicSemesterId=00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.courses).toHaveLength(0);
    });

    it('should return empty for student with no KRS enrollments', async () => {
      const res = await request(app)
        .get(`${API}/by-class`)
        .set('Authorization', `Bearer ${otherStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.courses).toHaveLength(0);
    });

    it('should include semester breakdown', async () => {
      const res = await request(app)
        .get(`${API}/by-class`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.body.data.semesterBreakdown.length).toBeGreaterThan(0);
      expect(res.body.data.semesterBreakdown[0]).toEqual(expect.objectContaining({
        academicYear: expect.any(String),
        semesterType: expect.any(String),
      }));
    });
  });

  // ════════════════════════════════════════════════
  // GET /api/transcript/summary
  // ════════════════════════════════════════════════
  describe('GET /summary', () => {
    it('should return academic summary for authenticated student', async () => {
      const res = await request(app)
        .get(`${API}/summary`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Ringkasan akademik berhasil diambil');
      expect(res.body.data.student).toBeDefined();
      expect(res.body.data.legacy).toBeDefined();
      expect(res.body.data.krs).toBeDefined();
    });

    it('should include IPK in both legacy and KRS summaries', async () => {
      const res = await request(app)
        .get(`${API}/summary`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.body.data.legacy).toEqual(expect.objectContaining({
        totalCourses: expect.any(Number),
        ipk: expect.any(Number),
      }));
      expect(res.body.data.krs).toEqual(expect.objectContaining({
        totalCourses: expect.any(Number),
        ipk: expect.any(Number),
      }));
    });

    it('should return summary for student with no data', async () => {
      const res = await request(app)
        .get(`${API}/summary`)
        .set('Authorization', `Bearer ${otherStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.legacy.totalCourses).toBe(0);
      expect(res.body.data.krs.totalCourses).toBe(0);
    });
  });

  // ════════════════════════════════════════════════
  // GET /api/transcript/students
  // ════════════════════════════════════════════════
  describe('GET /students', () => {
    it('should return list of MAHASISWA students for admin', async () => {
      const res = await request(app)
        .get(`${API}/students`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Daftar mahasiswa berhasil diambil');
      expect(res.body.data).toBeInstanceOf(Array);
      // Only MAHASISWA users should appear (not admin/dosen)
      expect(res.body.data.length).toBeGreaterThanOrEqual(2); // student + otherStudent
    });

    it('should filter students by search term', async () => {
      const res = await request(app)
        .get(`${API}/students?search=Student One`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.some(s => s.name === 'Student One')).toBe(true);
    });

    it('should return empty array for non-matching search', async () => {
      const res = await request(app)
        .get(`${API}/students?search=xyznonexistent`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should include enrollment counts', async () => {
      const res = await request(app)
        .get(`${API}/students`)
        .set('Authorization', `Bearer ${adminToken}`);

      const s = res.body.data.find(s => s.id === student.id);
      expect(s).toBeDefined();
      expect(s.totalEnrollments).toBeDefined();
      expect(s.totalKrsEnrollments).toBeDefined();
    });
  });

  // ════════════════════════════════════════════════
  // GET /api/transcript/student/:studentId
  // ════════════════════════════════════════════════
  describe('GET /student/:studentId', () => {
    it('should return full transcript for dosen', async () => {
      const res = await request(app)
        .get(`${API}/student/${student.id}`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Transkrip mahasiswa berhasil diambil');
      expect(res.body.data.student).toBeDefined();
      expect(res.body.data.courses).toBeInstanceOf(Array);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.gradeDistribution).toBeDefined();
    });

    it('should return full transcript for admin', async () => {
      const res = await request(app)
        .get(`${API}/student/${student.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.courses.length).toBeGreaterThan(0);
      expect(res.body.data.gradeDistribution).toBeDefined();
    });

    it('should include grade distribution', async () => {
      const res = await request(app)
        .get(`${API}/student/${student.id}`)
        .set('Authorization', `Bearer ${dosenToken}`);

      const dist = res.body.data.gradeDistribution;
      expect(dist).toBeDefined();
      // Should have standard grade keys
      expect(dist).toEqual(expect.objectContaining({
        A: expect.any(Number),
      }));
    });

    it('should include legacy and KRS sections', async () => {
      const res = await request(app)
        .get(`${API}/student/${student.id}`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.body.data.legacy).toBeDefined();
      expect(res.body.data.krs).toBeDefined();
    });

    it('should return 404 for non-existent student', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`${API}/student/${fakeId}`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid studentId format', async () => {
      const res = await request(app)
        .get(`${API}/student/not-a-uuid`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(400);
    });

    it('should return empty courses for student with no data', async () => {
      const res = await request(app)
        .get(`${API}/student/${otherStudent.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.courses).toHaveLength(0);
    });
  });
});
