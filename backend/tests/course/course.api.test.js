/**
 * Course API — Integration Tests
 * 
 * This suite tests the Express Gateway routes for the Course module.
 * It mocks the gRPC client to verify the Gateway's logic, request validation,
 * and error mapping.
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import request from 'supertest';
import { cleanDatabase } from '../helpers/db.js';
import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';

// ─── 1. MOCK DEFINITIONS ──────────────────────────────────────────────

const courseClientMock = {
  AddStudentToCourseById: jest.fn(),
  AddStudentToCourse: jest.fn(),
  GetEnrolledCourses: jest.fn(),
  GetTeachingCoursesWithStats: jest.fn(),
  GetTeachingCourses: jest.fn(),
  AdminGetAllCourses: jest.fn(),
  GetStudentsByCourse: jest.fn(),
  GetAvailableStudentsForCourse: jest.fn(),
  AdminCreateCourse: jest.fn(),
  AdminUpdateCourse: jest.fn(),
  AdminDeleteCourse: jest.fn(),
  AdminAssignTeacher: jest.fn(),
};

// ─── 2. APPLY MODULE MOCKS (ESM HOISTING) ─────────────────────────────

jest.unstable_mockModule('../../src/grpc/clients/course.client.js', () => ({
  default: courseClientMock,
}));

// ─── 3. DYNAMIC IMPORTS ───────────────────────────────────────────────

const { getApp } = await import('../helpers/request.js');
const app = getApp();

const API = '/api/courses';
const FAKE_UUID = '00000000-0000-0000-0000-000000000000';

describe('Course API Integration Tests', () => {
  let adminToken, dosenToken, mhsToken;
  let adminUser, dosenUser, mhsUser;

  beforeAll(async () => {
    await cleanDatabase();

    const a = await createAdmin();
    const d = await createDosen();
    const m = await createMahasiswa();

    adminToken = a.token;
    dosenToken = d.token;
    mhsToken = m.token;
    adminUser = a.user;
    dosenUser = d.user;
    mhsUser = m.user;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default Success Mock Implementations
    courseClientMock.AdminCreateCourse.mockImplementation((arg, cb) => {
      cb(null, { id: 'course-123', ...arg });
    });

    courseClientMock.AdminGetAllCourses.mockImplementation((arg, cb) => {
      cb(null, { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
    });

    courseClientMock.GetEnrolledCourses.mockImplementation((arg, cb) => {
      cb(null, { courses: [] });
    });

    courseClientMock.GetTeachingCourses.mockImplementation((arg, cb) => {
      cb(null, { courses: [] });
    });

    courseClientMock.GetTeachingCoursesWithStats.mockImplementation((arg, cb) => {
      cb(null, { courses: [] });
    });

    courseClientMock.AddStudentToCourse.mockImplementation((arg, cb) => {
      cb(null, { student: { id: 'mhs-123', email: arg.studentEmail } });
    });

    courseClientMock.AddStudentToCourseById.mockImplementation((arg, cb) => {
      cb(null, { student: { id: arg.studentId } });
    });

    courseClientMock.GetStudentsByCourse.mockImplementation((arg, cb) => {
      cb(null, { enrollments: [] });
    });

    courseClientMock.GetAvailableStudentsForCourse.mockImplementation((arg, cb) => {
      cb(null, { students: [] });
    });

    courseClientMock.AdminUpdateCourse.mockImplementation((arg, cb) => {
      cb(null, { id: arg.courseId, title: arg.title });
    });

    courseClientMock.AdminDeleteCourse.mockImplementation((arg, cb) => {
      cb(null, { message: 'Kelas berhasil dihapus' });
    });

    courseClientMock.AdminAssignTeacher.mockImplementation((arg, cb) => {
      cb(null, { id: arg.courseId, teacher: { id: arg.teacherId } });
    });
  });

  // ─── 4. AUTH & ACCESS CONTROL ────────────────────────────────────────

  describe('Auth & Access Control', () => {
    it('should return 401 if no token provided', async () => {
      const res = await request(app).get(`${API}/me`);
      expect(res.status).toBe(401);
    });

    it('should return 403 if student tries to create a course', async () => {
      const res = await request(app)
        .post(`${API}/admin`)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it('should return 403 if student tries to delete a course', async () => {
      const res = await request(app)
        .delete(`${API}/admin/some-id`)
        .set('Authorization', `Bearer ${mhsToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ─── 5. ADMIN COURSE MANAGEMENT ─────────────────────────────────────

  describe('Admin Routes', () => {
    it('POST /admin — 201 should create course successfully', async () => {
      const payload = {
        title: 'New Course',
        code: 'IF-101',
        semester: 3,
        sks: 3,
        teacherId: dosenUser.id
      };

      const res = await request(app)
        .post(`${API}/admin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('New Course');
      expect(courseClientMock.AdminCreateCourse).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Course', code: 'IF-101' }),
        expect.any(Function)
      );
    });

    it('POST /admin — 409 should handle duplicate error', async () => {
      courseClientMock.AdminCreateCourse.mockImplementation((arg, cb) => {
        cb({ code: 6, details: 'Kode mata kuliah sudah digunakan' });
      });

      const res = await request(app)
        .post(`${API}/admin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Duplicate', code: 'DUP-101' });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/sudah digunakan/);
    });

    it('GET /admin/all — 200 should return all courses', async () => {
      const res = await request(app)
        .get(`${API}/admin/all`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(courseClientMock.AdminGetAllCourses).toHaveBeenCalled();
    });

    it('PUT /admin/:id — 200 should update course', async () => {
      const res = await request(app)
        .put(`${API}/admin/course-123`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
      expect(courseClientMock.AdminUpdateCourse).toHaveBeenCalledWith(
        expect.objectContaining({ courseId: 'course-123', title: 'Updated Title' }),
        expect.any(Function)
      );
    });

    it('DELETE /admin/:id — 200 should delete course', async () => {
      const res = await request(app)
        .delete(`${API}/admin/course-123`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toMatch(/berhasil dihapus/);
      expect(courseClientMock.AdminDeleteCourse).toHaveBeenCalledWith(
        { courseId: 'course-123' },
        expect.any(Function)
      );
    });

    it('PATCH /admin/:id/assign-teacher — 200 should assign teacher', async () => {
      const res = await request(app)
        .patch(`${API}/admin/course-123/assign-teacher`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teacherId: dosenUser.id });

      expect(res.status).toBe(200);
      expect(res.body.data.teacher.id).toBe(dosenUser.id);
      expect(courseClientMock.AdminAssignTeacher).toHaveBeenCalledWith(
        { courseId: 'course-123', teacherId: dosenUser.id },
        expect.any(Function)
      );
    });
  });

  // ─── 6. ROLE-BASED COURSES ───────────────────────────────────────────

  describe('GET /me', () => {
    it('200 — should return enrolled courses for MAHASISWA', async () => {
      const res = await request(app)
        .get(`${API}/me`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(courseClientMock.GetEnrolledCourses).toHaveBeenCalledWith(
        { studentId: mhsUser.id },
        expect.any(Function)
      );
    });

    it('200 — should return teaching courses for DOSEN', async () => {
      const res = await request(app)
        .get(`${API}/me`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(courseClientMock.GetTeachingCourses).toHaveBeenCalledWith(
        { teacherId: dosenUser.id },
        expect.any(Function)
      );
    });

    it('200 — should return teaching courses with stats for DOSEN', async () => {
      const res = await request(app)
        .get(`${API}/me?includeStats=true`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(courseClientMock.GetTeachingCoursesWithStats).toHaveBeenCalledWith(
        { teacherId: dosenUser.id },
        expect.any(Function)
      );
    });

    it('200 — should return all courses for ADMIN (via AdminGetAllCourses)', async () => {
      const res = await request(app)
        .get(`${API}/me`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(courseClientMock.AdminGetAllCourses).toHaveBeenCalled();
    });
  });

  // ─── 7. ENROLLMENT ───────────────────────────────────────────────────

  describe('POST /:id/enroll', () => {
    it('201 — should enroll student by email', async () => {
      const res = await request(app)
        .post(`${API}/course-123/enroll`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ email: 'student@test.com' });

      expect(res.status).toBe(201);
      expect(res.body.data.student.email).toBe('student@test.com');
      expect(courseClientMock.AddStudentToCourse).toHaveBeenCalledWith(
        expect.objectContaining({ courseId: 'course-123', studentEmail: 'student@test.com' }),
        expect.any(Function)
      );
    });

    it('201 — should enroll student by studentId', async () => {
      const res = await request(app)
        .post(`${API}/course-123/enroll`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ studentId: mhsUser.id });

      expect(res.status).toBe(201);
      expect(res.body.data.student.id).toBe(mhsUser.id);
      expect(courseClientMock.AddStudentToCourseById).toHaveBeenCalledWith(
        expect.objectContaining({ courseId: 'course-123', studentId: mhsUser.id }),
        expect.any(Function)
      );
    });

    it('400 — should return error if both missing', async () => {
      const res = await request(app)
        .post(`${API}/course-123/enroll`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('404 — should handle not found course from gRPC', async () => {
      courseClientMock.AddStudentToCourseById.mockImplementation((arg, cb) => {
        cb({ code: 5, details: 'Kelas tidak ditemukan' });
      });

      const res = await request(app)
        .post(`${API}/course-123/enroll`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ studentId: mhsUser.id });

      expect(res.status).toBe(404);
    });
  });

  // ─── 8. STUDENT LISTS ───────────────────────────────────────────────

  describe('Student Lists', () => {
    it('GET /:id/students — 200 success', async () => {
      const res = await request(app)
        .get(`${API}/course-123/students`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(courseClientMock.GetStudentsByCourse).toHaveBeenCalledWith(
        expect.objectContaining({ courseId: 'course-123', userId: dosenUser.id }),
        expect.any(Function)
      );
    });

    it('GET /:id/available-students — 200 success', async () => {
      const res = await request(app)
        .get(`${API}/course-123/available-students`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(courseClientMock.GetAvailableStudentsForCourse).toHaveBeenCalledWith(
        expect.objectContaining({ courseId: 'course-123', userId: dosenUser.id }),
        expect.any(Function)
      );
    });
  });
});
