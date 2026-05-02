/**
 * Class API — Integration Tests
 * 
 * This suite tests the Express Gateway routes for the Class module.
 * It mocks the gRPC client to verify the Gateway's logic, request validation,
 * and error mapping.
 */

import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import request from 'supertest';
import prisma from '../helpers/prisma.js';
import { cleanDatabase } from '../helpers/db.js';
import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';

// ─── 1. MOCK DEFINITIONS ──────────────────────────────────────────────

const classClientMock = {
  CreateClass: jest.fn(),
  GetAllClasses: jest.fn(),
  GetClassById: jest.fn(),
  GetClassesByLecturer: jest.fn(),
  GetClassesByCourse: jest.fn(),
  GetOpenClasses: jest.fn(),
  UpdateClass: jest.fn(),
  ToggleEnrollment: jest.fn(),
  DeleteClass: jest.fn(),
};

// ─── 2. APPLY MODULE MOCKS (ESM HOISTING) ─────────────────────────────

jest.unstable_mockModule('../../src/grpc/clients/class.client.js', () => ({
  default: classClientMock,
}));

// ─── 3. DYNAMIC IMPORTS ───────────────────────────────────────────────
const { default: classClient } = await import('../../src/grpc/clients/class.client.js');
const { default: ClassService } = await import('../../src/modules/class/class.grpc-service.js');
const { getApp } = await import('../helpers/request.js');
const app = getApp();

const API = '/api/classes';
const FAKE_UUID = '00000000-0000-0000-0000-000000000000';

// Direct imports for gRPC Service testing
const appPrisma = (await import('../../src/config/prisma.js')).default;
const mockCallback = jest.fn();

describe('Class API Integration Tests', () => {
  let adminToken, dosenToken, mhsToken;
  let adminUser, dosenUser, mhsUser;
  let semester, course;

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

    // Seed shared context
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
        title: 'Pemrograman Web',
        code: `IF-${Date.now().toString().slice(-6)}`,
        teacherId: dosenUser.id,
      },
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default Success Mock Implementations
    classClientMock.CreateClass.mockImplementation((arg, cb) => {
      cb(null, { class: { id: 'class-123', ...arg } });
    });

    classClientMock.GetAllClasses.mockImplementation((arg, cb) => {
      cb(null, { classes: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } });
    });

    classClientMock.GetClassById.mockImplementation((arg, cb) => {
      if (arg.id === 'non-existent') {
        return cb({ code: 5, details: 'Kelas tidak ditemukan' });
      }
      cb(null, { class: { id: arg.id, section: 'A' } });
    });

    classClientMock.GetClassesByLecturer.mockImplementation((arg, cb) => {
      cb(null, { classes: [] });
    });

    classClientMock.GetClassesByCourse.mockImplementation((arg, cb) => {
      cb(null, { classes: [] });
    });

    classClientMock.GetOpenClasses.mockImplementation((arg, cb) => {
      cb(null, { classes: [] });
    });

    classClientMock.UpdateClass.mockImplementation((arg, cb) => {
      if (arg.id === 'non-existent') {
        return cb({ code: 5, details: 'Kelas tidak ditemukan' });
      }
      cb(null, { class: { ...arg } });
    });

    classClientMock.ToggleEnrollment.mockImplementation((arg, cb) => {
      cb(null, { class: { id: arg.id, isEnrollmentOpen: arg.isEnrollmentOpen } });
    });

    classClientMock.DeleteClass.mockImplementation((arg, cb) => {
      if (arg.id === 'non-existent') {
        return cb({ code: 5, details: 'Kelas tidak ditemukan' });
      }
      cb(null, { message: 'Kelas berhasil dihapus', deletedId: arg.id });
    });
  });

  // ─── 4. AUTH & ACCESS CONTROL ────────────────────────────────────────

  describe('Auth & Access Control', () => {
    it('should return 401 if no token provided', async () => {
      const res = await request(app).get(API);
      expect(res.status).toBe(401);
    });

    it('should return 403 if student tries to create a class', async () => {
      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it('should return 403 if student tries to delete a class', async () => {
      const res = await request(app)
        .delete(`${API}/some-id`)
        .set('Authorization', `Bearer ${mhsToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ─── 5. CREATE CLASS ─────────────────────────────────────────────────

  describe('POST /', () => {
    const validPayload = () => ({
      courseId: course.id,
      lecturerId: dosenUser.id,
      academicSemesterId: semester.id,
      section: 'A',
      capacity: 40,
      schedule: 'Senin 08:00',
      room: 'R.101',
    });

    it('201 — should create successfully as ADMIN', async () => {
      const payload = validPayload();
      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.section).toBe('A');
      expect(classClientMock.CreateClass).toHaveBeenCalledWith(
        expect.objectContaining({ section: 'A' }),
        expect.any(Function)
      );
    });

    it('400 — should return error for missing required fields', async () => {
      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ section: 'A' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('409 — should handle duplicate class error from gRPC', async () => {
      classClientMock.CreateClass.mockImplementation((arg, cb) => {
        cb({ code: 6, details: 'Kelas dengan section ini sudah ada' });
      });

      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload());

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/sudah ada/);
    });

    it('500 — should handle generic error from gRPC', async () => {
      classClientMock.CreateClass.mockImplementation((arg, cb) => {
        cb(new Error('Fatal exception'));
      });

      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload());

      expect(res.status).toBe(500);
    });
  });

  // ─── 6. GET CLASSES ──────────────────────────────────────────────────

  describe('GET /', () => {
    it('200 — should return all classes for ADMIN', async () => {
      const res = await request(app)
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('200 — should return all classes for DOSEN', async () => {
      const res = await request(app)
        .get(API)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /me', () => {
    it('200 — should return classes for lecturer', async () => {
      const res = await request(app)
        .get(`${API}/me`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(res.status).toBe(200);
      expect(classClientMock.GetClassesByLecturer).toHaveBeenCalledWith(
        expect.objectContaining({ lecturerId: dosenUser.id }),
        expect.any(Function)
      );
    });

    it('403 — should return 403 for student', async () => {
      const res = await request(app)
        .get(`${API}/me`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /open', () => {
    it('200 — should return open classes for student', async () => {
      const res = await request(app)
        .get(`${API}/open`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /course/:courseId', () => {
    it('200 — should return classes for a specific course', async () => {
      const res = await request(app)
        .get(`${API}/course/${course.id}`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(classClientMock.GetClassesByCourse).toHaveBeenCalledWith(
        expect.objectContaining({ courseId: course.id }),
        expect.any(Function)
      );
    });
  });

  describe('GET /:id', () => {
    it('200 — should return class details', async () => {
      const res = await request(app)
        .get(`${API}/class-123`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('class-123');
    });

    it('404 — should return error for non-existent class', async () => {
      const res = await request(app)
        .get(`${API}/non-existent`)
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── 7. UPDATE CLASS ─────────────────────────────────────────────────

  describe('PUT /:id', () => {
    it('200 — should update class successfully as ADMIN', async () => {
      const res = await request(app)
        .put(`${API}/class-123`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ room: 'R.202', capacity: 50 });

      expect(res.status).toBe(200);
      expect(res.body.data.room).toBe('R.202');
      expect(classClientMock.UpdateClass).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'class-123', room: 'R.202' }),
        expect.any(Function)
      );
    });

    it('404 — should return 404 for non-existent class', async () => {
      const res = await request(app)
        .put(`${API}/non-existent`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ room: 'New Room' });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /:id/enrollment', () => {
    it('200 — should toggle enrollment status', async () => {
      const res = await request(app)
        .patch(`${API}/class-123/enrollment`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isEnrollmentOpen: true });

      expect(res.status).toBe(200);
      expect(res.body.data.isEnrollmentOpen).toBe(true);
      expect(classClientMock.ToggleEnrollment).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'class-123', isEnrollmentOpen: true }),
        expect.any(Function)
      );
    });
  });

  // ─── 8. DELETE CLASS ─────────────────────────────────────────────────

  describe('DELETE /:id', () => {
    it('200 — should delete class as ADMIN', async () => {
      const res = await request(app)
        .delete(`${API}/class-123`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deletedId).toBe('class-123');
    });

    it('404 — should return 404 if class not found', async () => {
      const res = await request(app)
        .delete(`${API}/non-existent`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── 9. CONTROLLER ERROR MAPPING ─────────────────────────────────────

  describe('Controller Error Mapping', () => {
    it('should handle non-gRPC errors in controllers', async () => {
      classClientMock.GetAllClasses.mockImplementationOnce((arg, cb) => {
        throw new Error('Unexpected error');
      });

      const res = await request(app)
        .get(API)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
    });

    it('should handle gRPC errors with codes in all methods', async () => {
      classClientMock.GetClassById.mockImplementationOnce((arg, cb) => {
        cb({ code: 7, details: 'Permission denied' });
      });
      const res = await request(app).get(`${API}/123`).set('Authorization', `Bearer ${mhsToken}`);
      expect(res.status).toBe(403);
    });

    it('should handle gRPC errors in update', async () => {
      classClientMock.UpdateClass.mockImplementationOnce((arg, cb) => {
        cb({ code: 3, details: 'Invalid' });
      });
      const res = await request(app).put(`${API}/123`).set('Authorization', `Bearer ${adminToken}`).send({ room: 'X' });
      expect(res.status).toBe(400);
    });

    it('should handle gRPC errors in remove', async () => {
      classClientMock.DeleteClass.mockImplementationOnce((arg, cb) => {
        cb({ code: 13, details: 'Internal' });
      });
      const res = await request(app).delete(`${API}/123`).set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
    });

    it('should handle non-code errors in update', async () => {
      classClientMock.UpdateClass.mockImplementationOnce((arg, cb) => {
        throw new Error('Fatal');
      });
      const res = await request(app).put(`${API}/123`).set('Authorization', `Bearer ${adminToken}`).send({ room: 'X' });
      expect(res.status).toBe(500);
    });

    it('should handle gRPC errors in getMyClasses', async () => {
      classClientMock.GetClassesByLecturer.mockImplementationOnce((arg, cb) => {
        cb({ code: 5, details: 'Not found' });
      });
      const res = await request(app).get(`${API}/me`).set('Authorization', `Bearer ${dosenToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ═════════════════════════════════════════════════════════════
  // gRPC Service Implementation (Direct Handler Tests)
  // ═════════════════════════════════════════════════════════════
  describe('gRPC Service Implementation (Direct)', () => {
    const directMockCallback = (resolve, reject) => (err, response) => {
      if (err) resolve(err); // Resolve with error for assertion
      else resolve(response);
    };

    const callServiceDirect = (method, request = {}) => {
      return new Promise((resolve, reject) => {
        ClassService[method]({ request }, directMockCallback(resolve, reject));
      });
    };

    let testSemester, testCourse, testDosen;

    beforeEach(async () => {
      await cleanDatabase();
      const d = await createDosen();
      testDosen = d.user;

      testSemester = await prisma.academicSemester.create({
        data: { academicYear: '2025/2026', semesterType: 'GANJIL', status: 'OPEN' }
      });

      testCourse = await prisma.course.create({
        data: { title: 'Test Course', code: 'TC01', teacherId: testDosen.id }
      });
      
      mockCallback.mockClear();
    });

    it('CreateClass: should fail if course not found', async () => {
      const res = await callServiceDirect('CreateClass', { courseId: FAKE_UUID });
      expect(res.code).toBe(5);
    });

    it('CreateClass: should fail if lecturer not found', async () => {
      const res = await callServiceDirect('CreateClass', { courseId: testCourse.id, lecturerId: FAKE_UUID });
      expect(res.code).toBe(5);
    });

    it('CreateClass: should fail if user is not a dosen', async () => {
      const mhs = await createMahasiswa();
      const res = await callServiceDirect('CreateClass', { courseId: testCourse.id, lecturerId: mhs.user.id });
      expect(res.code).toBe(3);
    });

    it('CreateClass: should handle internal error', async () => {
      const spy = jest.spyOn(appPrisma.course, 'findUnique').mockRejectedValue(new Error('Internal DB error'));
      await ClassService.CreateClass({ request: { courseId: testCourse.id } }, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 13 }));
      spy.mockRestore();
    });

    it('GetAllClasses: should handle internal error', async () => {
      const spy = jest.spyOn(appPrisma.class, 'findMany').mockRejectedValue(new Error('Internal DB error'));
      await ClassService.GetAllClasses({ request: {} }, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 13 }));
      spy.mockRestore();
    });

    it('GetClassById: should handle internal error', async () => {
      const spy = jest.spyOn(appPrisma.class, 'findUnique').mockRejectedValue(new Error('Internal DB error'));
      await ClassService.GetClassById({ request: { id: '123' } }, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 13 }));
      spy.mockRestore();
    });

    it('UpdateClass: should fail if class not found', async () => {
      const res = await callServiceDirect('UpdateClass', { id: FAKE_UUID });
      expect(res.code).toBe(5);
    });

    it('UpdateClass: should fail if new lecturer not found', async () => {
      const cls = await appPrisma.class.create({
        data: { courseId: testCourse.id, academicSemesterId: testSemester.id, section: 'Z', lecturerId: testDosen.id }
      });
      const res = await callServiceDirect('UpdateClass', { id: cls.id, lecturerId: FAKE_UUID });
      expect(res.code).toBe(5);
    });

    it('UpdateClass: should fail if new academicSemester not found', async () => {
      const cls = await appPrisma.class.create({
        data: { courseId: testCourse.id, academicSemesterId: testSemester.id, section: 'Y', lecturerId: testDosen.id }
      });
      const res = await callServiceDirect('UpdateClass', { id: cls.id, academicSemesterId: FAKE_UUID });
      expect(res.code).toBe(5);
    });

    it('UpdateClass: should handle internal error', async () => {
      const spy = jest.spyOn(appPrisma.class, 'findUnique').mockRejectedValue(new Error('Internal DB error'));
      await ClassService.UpdateClass({ request: { id: '123' } }, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 13 }));
      spy.mockRestore();
    });

    it('ToggleEnrollment: should handle internal error', async () => {
      const spy = jest.spyOn(appPrisma.class, 'findUnique').mockRejectedValue(new Error('Internal DB error'));
      await ClassService.ToggleEnrollment({ request: { id: '123' } }, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 13 }));
      spy.mockRestore();
    });

    it('DeleteClass: should handle internal error', async () => {
      const spy = jest.spyOn(appPrisma.class, 'findUnique').mockRejectedValue(new Error('Internal DB error'));
      await ClassService.DeleteClass({ request: { id: '123' } }, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 13 }));
      spy.mockRestore();
    });
    
    it('GetAllClasses: should support pagination', async () => {
      await callServiceDirect('CreateClass', { courseId: testCourse.id, academicSemesterId: testSemester.id, section: 'A' });
      const res = await callServiceDirect('GetAllClasses', { page: 1, limit: 10 });
      expect(res.classes.length).toBeGreaterThan(0);
    });

    it('GetClassById: should return details', async () => {
      const cls = await callServiceDirect('CreateClass', { courseId: testCourse.id, academicSemesterId: testSemester.id, section: 'A' });
      const res = await callServiceDirect('GetClassById', { id: cls.class.id });
      expect(res.class.id).toBe(cls.class.id);
    });

    it('GetClassesByLecturer: should filter correctly', async () => {
      await callServiceDirect('CreateClass', {
        courseId: testCourse.id,
        academicSemesterId: testSemester.id,
        section: 'B',
        lecturerId: testDosen.id
      });
      const res = await callServiceDirect('GetClassesByLecturer', { lecturerId: testDosen.id });
      expect(res.classes.length).toBeGreaterThan(0);
    });

    it('GetClassesByCourse: should filter correctly', async () => {
      await callServiceDirect('CreateClass', { courseId: testCourse.id, academicSemesterId: testSemester.id, section: 'A' });
      const res = await callServiceDirect('GetClassesByCourse', { courseId: testCourse.id });
      expect(res.classes.length).toBeGreaterThan(0);
    });

    it('GetOpenClasses: should return classes with isEnrollmentOpen=true', async () => {
      const res0 = await callServiceDirect('CreateClass', {
        courseId: testCourse.id,
        academicSemesterId: testSemester.id,
        section: 'C',
        isEnrollmentOpen: true
      });
      const res = await callServiceDirect('GetOpenClasses');
      expect(res.classes.some(c => c.id === res0.class.id)).toBe(true);
    });

    it('DeleteClass: should delete successfully', async () => {
      const cls = await callServiceDirect('CreateClass', { courseId: testCourse.id, academicSemesterId: testSemester.id, section: 'G' });
      await callServiceDirect('DeleteClass', { id: cls.class.id });
      const res = await callServiceDirect('GetAllClasses');
      expect(res.classes.find(c => c.id === cls.class.id)).toBeUndefined();
    });

    it('CreateClass: should fail if semester is CLOSED', async () => {
      const closedSem = await prisma.academicSemester.create({
        data: { academicYear: '2024/2025', semesterType: 'GENAP', status: 'CLOSED' }
      });
      const res = await callServiceDirect('CreateClass', {
        courseId: testCourse.id,
        academicSemesterId: closedSem.id,
        section: 'B'
      });
      expect(res.code).toBe(3);
    });

    it('GetClassesByLecturer: should handle internal error', async () => {
      const spy = jest.spyOn(appPrisma.class, 'findMany').mockRejectedValue(new Error('Internal DB error'));
      await ClassService.GetClassesByLecturer({ request: { lecturerId: '123' } }, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 13 }));
      spy.mockRestore();
    });

    it('GetClassesByCourse: should handle internal error', async () => {
      const spy = jest.spyOn(appPrisma.class, 'findMany').mockRejectedValue(new Error('Internal DB error'));
      await ClassService.GetClassesByCourse({ request: { courseId: '123' } }, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 13 }));
      spy.mockRestore();
    });

    it('GetOpenClasses: should handle internal error', async () => {
      const spy = jest.spyOn(appPrisma.class, 'findMany').mockRejectedValue(new Error('Internal DB error'));
      await ClassService.GetOpenClasses({ request: {} }, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: 13 }));
      spy.mockRestore();
    });

    it('UpdateClass: should update successfully', async () => {
      const cls = await appPrisma.class.create({
        data: { courseId: testCourse.id, academicSemesterId: testSemester.id, section: 'A', lecturerId: testDosen.id }
      });
      const res = await callServiceDirect('UpdateClass', { id: cls.id, room: 'Lab A', isEnrollmentOpen: true });
      expect(res.class.room).toBe('Lab A');
    });

    it('UpdateClass: should fail on duplicate section', async () => {
      await appPrisma.class.create({
        data: { courseId: testCourse.id, academicSemesterId: testSemester.id, section: 'D', lecturerId: testDosen.id }
      });
      const cls2 = await appPrisma.class.create({
        data: { courseId: testCourse.id, academicSemesterId: testSemester.id, section: 'E', lecturerId: testDosen.id }
      });
      const res = await callServiceDirect('UpdateClass', { id: cls2.id, section: 'D' });
      expect(res.code).toBe(6);
    });

    it('ToggleEnrollment: should toggle successfully', async () => {
      const cls = await appPrisma.class.create({
        data: { courseId: testCourse.id, academicSemesterId: testSemester.id, section: 'F', lecturerId: testDosen.id }
      });
      const res = await callServiceDirect('ToggleEnrollment', { id: cls.id, isEnrollmentOpen: true });
      expect(res.class.isEnrollmentOpen).toBe(true);
    });

    it('UpdateClass: should fail if lecturer is not a DOSEN', async () => {
      const cls = await appPrisma.class.create({
        data: { courseId: testCourse.id, academicSemesterId: testSemester.id, section: 'M', lecturerId: testDosen.id }
      });
      const mhs = await createMahasiswa();
      const res = await callServiceDirect('UpdateClass', { id: cls.id, lecturerId: mhs.user.id });
      expect(res.code).toBe(3);
    });
  });
});
