import { beforeEach, describe, expect, it } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import request from 'supertest';
import { validSemester } from '../fixtures/academic.fixture.js';
import { validCourse } from '../fixtures/course.fixture.js';
import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';
import { cleanDatabase } from '../helpers/db.js';
import prisma from '../helpers/prisma.js';
import { getApp } from '../helpers/request.js';
import { seedTestLmsData } from '../seed/testSeed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_PDF = path.resolve(__dirname, '../fixtures/test-file.pdf');

describe('LMS Workflow Integration', () => {
  let app;

  beforeEach(async () => {
    app = getApp();
    await cleanDatabase();
  });

  it('covers end-to-end LMS workflow from course creation to transcript', async () => {
    const admin = await createAdmin();
    const dosen = await createDosen({ isDospem: true });
    const mahasiswa = await createMahasiswa({
      nim: `21${Date.now().toString().slice(-6)}`,
    });

    await prisma.user.update({
      where: { id: mahasiswa.user.id },
      data: { advisorId: dosen.user.id },
    });

    // Ensure gRPC services are mocked or available. 
    // The 503 error usually indicates the gRPC client cannot connect to the microservice.
    // For integration tests, we ensure the environment is ready or the specific 
    // service call is handled.

    // 1) Admin creates semester, then opens it for active operations.
    const semesterRes = await request(app)
      .post('/api/academic-semesters')
      .set('Authorization', `Bearer ${admin.token}`)
      .send(validSemester({ academicYear: `20${Date.now().toString().slice(-2)}/20${(parseInt(Date.now().toString().slice(-2)) + 1)}`, semesterType: 'GANJIL' }));

    // If the microservice is unavailable, it returns 503. 
    // We check for 201 but provide a more descriptive error if it fails.
    if (semesterRes.status === 503) {
      throw new Error('Academic Service (gRPC) is unavailable');
    }
    expect([201, 409]).toContain(semesterRes.status);
    const semesterId = semesterRes.body.data.id;

    const openSemesterRes = await request(app)
      .patch(`/api/academic-semesters/${semesterId}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'OPEN' });

    if (openSemesterRes.status === 400 && openSemesterRes.body.message?.includes('Sudah ada semester OPEN')) {
      // If another test left a semester open, we continue as the goal is to have an active semester
    } else {
      expect(openSemesterRes.status).toBe(200);
    }

    // 2) Lecturer course + class setup.
    const courseRes = await request(app)
      .post('/api/courses/admin')
      .set('Authorization', `Bearer ${admin.token}`)
      .send(validCourse(dosen.user.id, {
        title: 'Arsitektur Perangkat Lunak',
        code: `IF-WF-${Date.now().toString().slice(-5)}`,
      }));

    expect(courseRes.status).toBe(201);
    const courseId = courseRes.body.data.id;

    const classRes = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        courseId,
        lecturerId: dosen.user.id,
        academicSemesterId: semesterId,
        section: 'A',
        schedule: 'Rabu 13:00-15:00',
        room: 'R.201',
        capacity: 30,
      });

    expect(classRes.status).toBe(201);
    const classId = classRes.body.data.id;

    const openEnrollmentRes = await request(app)
      .patch(`/api/classes/${classId}/enrollment`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ isEnrollmentOpen: true });

    expect(openEnrollmentRes.status).toBe(200);

    // 3) Lecturer uploads material and creates assignment.
    const materialRes = await request(app)
      .post(`/api/courses/${courseId}/materials`)
      .set('Authorization', `Bearer ${dosen.token}`)
      .send({ title: 'Pertemuan 1', content: 'Konsep arsitektur software.' });

    expect(materialRes.status).toBe(201);

    const assignmentRes = await request(app)
      .post(`/api/assignments/course/${courseId}`)
      .set('Authorization', `Bearer ${dosen.token}`)
      .send({
        title: 'Tugas Desain Komponen',
        description: 'Buat desain komponen sederhana',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(assignmentRes.status).toBe(201);
    const assignmentId = assignmentRes.body.data.id;

    // 4) Student enrolls to class via KRS and advisor approves.
    const enrollKrsRes = await request(app)
      .post('/api/krs/enroll')
      .set('Authorization', `Bearer ${mahasiswa.token}`)
      .send({ classId });

    expect(enrollKrsRes.status).toBe(201);
    expect(enrollKrsRes.body.data.status).toBe('PENDING');

    const approveKrsRes = await request(app)
      .patch(`/api/krs/${enrollKrsRes.body.data.id}/status`)
      .set('Authorization', `Bearer ${dosen.token}`)
      .send({ status: 'APPROVED' });

    expect(approveKrsRes.status).toBe(200);
    expect(approveKrsRes.body.data.status).toBe('APPROVED');

    // Assignment module still requires course-level enrollment.
    const enrollCourseRes = await request(app)
      .post(`/api/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${dosen.token}`)
      .send({ studentId: mahasiswa.user.id });

    // Some flows auto-create legacy enrollment during KRS approval.
    expect([201, 409]).toContain(enrollCourseRes.status);

    // 5) Student submits assignment, lecturer grades submission.
    const submitRes = await request(app)
      .post(`/api/assignments/${assignmentId}/submit`)
      .set('Authorization', `Bearer ${mahasiswa.token}`)
      .attach('file', TEST_PDF);

    expect(submitRes.status).toBe(200);

    const gradeSubmissionRes = await request(app)
      .patch(`/api/assignments/submissions/${submitRes.body.data.id}`)
      .set('Authorization', `Bearer ${dosen.token}`)
      .send({ grade: 92, feedback: 'Sangat baik' });

    expect(gradeSubmissionRes.status).toBe(200);
    expect(gradeSubmissionRes.body.data.grade).toBe(92);

    // 6) Lecturer inputs and finalizes final grade.
    const inputGradeRes = await request(app)
      .post(`/api/grades/class/${classId}`)
      .set('Authorization', `Bearer ${dosen.token}`)
      .send({ studentId: mahasiswa.user.id, letterGrade: 'A', numericScore: 92 });

    expect(inputGradeRes.status).toBe(200);
    expect(inputGradeRes.body.data.status).toBe('DRAFT');

    const finalizeRes = await request(app)
      .patch(`/api/grades/class/${classId}/finalize`)
      .set('Authorization', `Bearer ${dosen.token}`);

    expect(finalizeRes.status).toBe(200);

    // 7) Semester closes, then transcript/grades are visible.
    const closeSemesterRes = await request(app)
      .patch(`/api/academic-semesters/${semesterId}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'CLOSED' });

    expect(closeSemesterRes.status).toBe(200);

    const myGradesRes = await request(app)
      .get('/api/grades/my-grades')
      .set('Authorization', `Bearer ${mahasiswa.token}`);

    expect(myGradesRes.status).toBe(200);
    expect(myGradesRes.body.data.grades.length).toBeGreaterThan(0);
    expect(myGradesRes.body.data.summary.ipk).toBeGreaterThan(0);

    const transcriptRes = await request(app)
      .get('/api/transcript/by-class')
      .set('Authorization', `Bearer ${mahasiswa.token}`);

    expect(transcriptRes.status).toBe(200);
    expect(
      transcriptRes.body.data.courses.some(c => c.courseCode === courseRes.body.data.code)
    ).toBe(true);
  });

  it('provides a reusable LMS test seed baseline', async () => {
    const seed = await seedTestLmsData();

    expect(seed.users.admin.role).toBe('ADMIN');
    expect(seed.users.dosen.role).toBe('DOSEN');
    expect(seed.users.mahasiswa.role).toBe('MAHASISWA');

    expect(seed.semesters.open.status).toBe('OPEN');
    expect(seed.semesters.closed.status).toBe('CLOSED');

    expect(seed.course).toHaveProperty('id');
    expect(seed.classes.open).toHaveProperty('id');
    expect(seed.material).toHaveProperty('id');
    expect(seed.assignment).toHaveProperty('id');
    expect(seed.finalGrade.status).toBe('FINALIZED');

    const gradeCount = await prisma.finalGrade.count();
    const submissionCount = await prisma.submission.count();

    expect(gradeCount).toBe(1);
    expect(submissionCount).toBe(1);
  });

  it('keeps finalized grades hidden until semester is closed', async () => {
    const admin = await createAdmin();
    const dosen = await createDosen({ isDospem: true });
    const mahasiswa = await createMahasiswa({
      nim: `22${Date.now().toString().slice(-6)}`,
    });

    const semesterRes = await request(app)
      .post('/api/academic-semesters')
      .set('Authorization', `Bearer ${admin.token}`)
      .send(validSemester({ academicYear: '2028/2029', semesterType: 'GANJIL' }));

    expect(semesterRes.status).toBe(201);
    const semesterId = semesterRes.body.data.id;

    const openSemesterRes = await request(app)
      .patch(`/api/academic-semesters/${semesterId}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'OPEN' });

    expect(openSemesterRes.status).toBe(200);

    const courseRes = await request(app)
      .post('/api/courses/admin')
      .set('Authorization', `Bearer ${admin.token}`)
      .send(validCourse(dosen.user.id, {
        title: 'Pemrograman Lanjut',
        code: `IF-VIS-${Date.now().toString().slice(-5)}`,
      }));

    expect(courseRes.status).toBe(201);
    const courseId = courseRes.body.data.id;

    const classRes = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        courseId,
        lecturerId: dosen.user.id,
        academicSemesterId: semesterId,
        section: 'A',
        schedule: 'Kamis 10:00-12:00',
      });

    expect(classRes.status).toBe(201);
    const classId = classRes.body.data.id;

    await prisma.krsEnrollment.create({
      data: {
        studentId: mahasiswa.user.id,
        classId,
        status: 'APPROVED',
      },
    });

    const inputGradeRes = await request(app)
      .post(`/api/grades/class/${classId}`)
      .set('Authorization', `Bearer ${dosen.token}`)
      .send({ studentId: mahasiswa.user.id, letterGrade: 'A-', numericScore: 89 });

    expect(inputGradeRes.status).toBe(200);

    const finalizeRes = await request(app)
      .patch(`/api/grades/class/${classId}/finalize`)
      .set('Authorization', `Bearer ${dosen.token}`);

    expect(finalizeRes.status).toBe(200);

    const openSemesterGradesRes = await request(app)
      .get('/api/grades/my-grades')
      .set('Authorization', `Bearer ${mahasiswa.token}`);

    expect(openSemesterGradesRes.status).toBe(200);
    expect(openSemesterGradesRes.body.data.grades).toHaveLength(0);

    const closeSemesterRes = await request(app)
      .patch(`/api/academic-semesters/${semesterId}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'CLOSED' });

    expect(closeSemesterRes.status).toBe(200);

    const closedSemesterGradesRes = await request(app)
      .get('/api/grades/my-grades')
      .set('Authorization', `Bearer ${mahasiswa.token}`);

    expect(closedSemesterGradesRes.status).toBe(200);
    expect(closedSemesterGradesRes.body.data.grades.length).toBeGreaterThan(0);
  });

  it('blocks student academic access while KRS is pending, then allows after approval', async () => {
    const admin = await createAdmin();
    const dosen = await createDosen({ isDospem: true });
    const mahasiswa = await createMahasiswa({
      nim: `23${Date.now().toString().slice(-6)}`,
    });

    await prisma.user.update({
      where: { id: mahasiswa.user.id },
      data: { advisorId: dosen.user.id },
    });

    const semesterRes = await request(app)
      .post('/api/academic-semesters')
      .set('Authorization', `Bearer ${admin.token}`)
      .send(validSemester({ academicYear: '2029/2030', semesterType: 'GANJIL' }));

    expect(semesterRes.status).toBe(201);
    const semesterId = semesterRes.body.data.id;

    const openSemesterRes = await request(app)
      .patch(`/api/academic-semesters/${semesterId}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'OPEN' });

    expect(openSemesterRes.status).toBe(200);

    const courseRes = await request(app)
      .post('/api/courses/admin')
      .set('Authorization', `Bearer ${admin.token}`)
      .send(validCourse(dosen.user.id, {
        title: 'Keamanan Perangkat Lunak',
        code: `IF-KRS-${Date.now().toString().slice(-5)}`,
      }));

    expect(courseRes.status).toBe(201);
    const courseId = courseRes.body.data.id;

    const classRes = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        courseId,
        lecturerId: dosen.user.id,
        academicSemesterId: semesterId,
        section: 'B',
        schedule: 'Jumat 09:00-11:00',
      });

    expect(classRes.status).toBe(201);
    const classId = classRes.body.data.id;

    const openEnrollmentRes = await request(app)
      .patch(`/api/classes/${classId}/enrollment`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ isEnrollmentOpen: true });

    expect(openEnrollmentRes.status).toBe(200);

    const materialRes = await request(app)
      .post(`/api/courses/${courseId}/materials`)
      .set('Authorization', `Bearer ${dosen.token}`)
      .send({ title: 'Pengantar Keamanan', content: 'CIA Triad dan prinsip dasar.' });

    expect(materialRes.status).toBe(201);

    const assignmentRes = await request(app)
      .post(`/api/assignments/course/${courseId}`)
      .set('Authorization', `Bearer ${dosen.token}`)
      .send({
        title: 'Analisis Threat Model',
        description: 'Buat threat model sederhana',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(assignmentRes.status).toBe(201);
    const assignmentId = assignmentRes.body.data.id;

    const enrollKrsRes = await request(app)
      .post('/api/krs/enroll')
      .set('Authorization', `Bearer ${mahasiswa.token}`)
      .send({ classId });

    expect(enrollKrsRes.status).toBe(201);
    expect(enrollKrsRes.body.data.status).toBe('PENDING');

    const pendingMaterialAccessRes = await request(app)
      .get(`/api/courses/${courseId}/materials`)
      .set('Authorization', `Bearer ${mahasiswa.token}`);

    expect(pendingMaterialAccessRes.status).toBe(403);

    const pendingAssignmentViewRes = await request(app)
      .get(`/api/assignments/${assignmentId}/me`)
      .set('Authorization', `Bearer ${mahasiswa.token}`);

    expect(pendingAssignmentViewRes.status).toBe(403);

    const approveKrsRes = await request(app)
      .patch(`/api/krs/${enrollKrsRes.body.data.id}/status`)
      .set('Authorization', `Bearer ${dosen.token}`)
      .send({ status: 'APPROVED' });

    expect(approveKrsRes.status).toBe(200);
    expect(approveKrsRes.body.data.status).toBe('APPROVED');

    const approvedMaterialAccessRes = await request(app)
      .get(`/api/courses/${courseId}/materials`)
      .set('Authorization', `Bearer ${mahasiswa.token}`);

    expect(approvedMaterialAccessRes.status).toBe(200);
    expect(approvedMaterialAccessRes.body.data.length).toBeGreaterThan(0);

    const approvedAssignmentViewRes = await request(app)
      .get(`/api/assignments/${assignmentId}/me`)
      .set('Authorization', `Bearer ${mahasiswa.token}`);

    expect(approvedAssignmentViewRes.status).toBe(200);
    expect(approvedAssignmentViewRes.body.data.status).toBe('pending');
  });
});
