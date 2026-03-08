import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';
import prisma from '../helpers/prisma.js';

/**
 * Seeds a minimal but realistic LMS dataset for integration tests.
 * Returns created entities + auth tokens so tests can run full workflows
 * without repeating manual setup code.
 */
export async function seedTestLmsData() {
  const uniq = Date.now().toString().slice(-6);

  const admin = await createAdmin({
    email: `admin.${uniq}@test.local`,
    name: 'Admin Test',
  });

  const dosen = await createDosen({
    email: `dosen.${uniq}@test.local`,
    name: 'Dosen Test',
    isDospem: true,
  });

  const mahasiswa = await createMahasiswa({
    email: `mhs.${uniq}@test.local`,
    name: 'Mahasiswa Test',
    nim: `77${uniq}`,
  });

  // Assign advisor so KRS approval workflow can be tested.
  await prisma.user.update({
    where: { id: mahasiswa.user.id },
    data: { advisorId: dosen.user.id },
  });

  const openSemester = await prisma.academicSemester.create({
    data: {
      academicYear: '2026/2027',
      semesterType: 'GANJIL',
      status: 'OPEN',
      isActive: true,
      maxSks: 24,
    },
  });

  const closedSemester = await prisma.academicSemester.create({
    data: {
      academicYear: '2025/2026',
      semesterType: 'GENAP',
      status: 'CLOSED',
      isActive: false,
      maxSks: 24,
    },
  });

  const course = await prisma.course.create({
    data: {
      title: 'Rekayasa Perangkat Lunak',
      description: 'Kelas baseline untuk integration test',
      code: `IF-SEED-${uniq}`,
      semester: 5,
      sks: 3,
      teacherId: dosen.user.id,
    },
  });

  const openClass = await prisma.class.create({
    data: {
      courseId: course.id,
      lecturerId: dosen.user.id,
      academicSemesterId: openSemester.id,
      section: 'A',
      schedule: 'Senin 08:00-10:00',
      room: 'LAB-1',
      capacity: 40,
      isEnrollmentOpen: true,
    },
  });

  const closedClass = await prisma.class.create({
    data: {
      courseId: course.id,
      lecturerId: dosen.user.id,
      academicSemesterId: closedSemester.id,
      section: 'B',
      schedule: 'Selasa 10:00-12:00',
      room: 'LAB-2',
      capacity: 40,
      isEnrollmentOpen: false,
    },
  });

  const material = await prisma.material.create({
    data: {
      courseId: course.id,
      title: 'Pengantar RPL',
      content: 'Dasar-dasar rekayasa perangkat lunak',
      order: 1,
      isPublished: true,
    },
  });

  const assignment = await prisma.assignment.create({
    data: {
      courseId: course.id,
      title: 'Tugas Analisis Kebutuhan',
      description: 'Buat dokumen requirement sederhana',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  const enrollment = await prisma.enrollment.create({
    data: {
      userId: mahasiswa.user.id,
      courseId: course.id,
    },
  });

  const approvedKrs = await prisma.krsEnrollment.create({
    data: {
      studentId: mahasiswa.user.id,
      classId: openClass.id,
      status: 'APPROVED',
      submittedAt: new Date(),
      approvedAt: new Date(),
      approvedBy: dosen.user.id,
    },
  });

  const submission = await prisma.submission.create({
    data: {
      assignmentId: assignment.id,
      studentId: mahasiswa.user.id,
      fileUrl: 'https://example.com/submission.pdf',
      grade: 88,
      feedback: 'Bagus, lanjutkan',
    },
  });

  const finalGrade = await prisma.finalGrade.create({
    data: {
      studentId: mahasiswa.user.id,
      classId: closedClass.id,
      academicSemesterId: closedSemester.id,
      lecturerId: dosen.user.id,
      letterGrade: 'A',
      gradePoint: 4.0,
      numericScore: 90,
      status: 'FINALIZED',
    },
  });

  return {
    users: {
      admin: admin.user,
      dosen: dosen.user,
      mahasiswa: mahasiswa.user,
    },
    tokens: {
      admin: admin.token,
      dosen: dosen.token,
      mahasiswa: mahasiswa.token,
    },
    semesters: {
      open: openSemester,
      closed: closedSemester,
    },
    course,
    classes: {
      open: openClass,
      closed: closedClass,
    },
    material,
    assignment,
    enrollment,
    approvedKrs,
    submission,
    finalGrade,
  };
}
