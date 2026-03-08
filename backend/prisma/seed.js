import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  // 1. Hash password
  const hashedPassword = bcrypt.hashSync('password123', 10);

  // 2. Buat Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lms.com' },
    update: {},
    create: {
      email: 'admin@lms.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'ADMIN', // Set role explisit di sini
    },
  });

  // 3. Buat Dosen
  const dosen = await prisma.user.upsert({
    where: { email: 'dosen@lms.com' },
    update: { isDospem: true },
    create: {
      email: 'dosen@lms.com',
      name: 'Pak Dosen Santoso',
      password: hashedPassword,
      role: 'DOSEN',
      isDospem: true,
    },
  });

  // 4. Buat Mahasiswa
  const mahasiswa = await prisma.user.upsert({
    where: { email: 'mahasiswa@lms.com' },
    update: {
      nim: '230000001',
      advisorId: dosen.id,
    },
    create: {
      email: 'mahasiswa@lms.com',
      name: 'Budi Mahasiswa',
      password: hashedPassword,
      role: 'MAHASISWA',
      nim: '230000001',
      advisorId: dosen.id,
    },
  });

  // 5. Semester aktif untuk workflow berjalan
  const semester = await prisma.academicSemester.upsert({
    where: {
      academicYear_semesterType: {
        academicYear: '2026/2027',
        semesterType: 'GANJIL',
      },
    },
    update: {
      status: 'OPEN',
      isActive: true,
      maxSks: 24,
    },
    create: {
      academicYear: '2026/2027',
      semesterType: 'GANJIL',
      status: 'OPEN',
      isActive: true,
      maxSks: 24,
    },
  });

  // Pastikan semester lain tidak aktif agar konsisten dengan business rule.
  await prisma.academicSemester.updateMany({
    where: { id: { not: semester.id }, isActive: true },
    data: { isActive: false },
  });

  // 6. Course baseline
  const course = await prisma.course.upsert({
    where: { code: 'IF-101' },
    update: {
      teacherId: dosen.id,
      sks: 3,
    },
    create: {
      title: 'Pemrograman Web',
      description: 'Pengantar pemrograman web modern',
      code: 'IF-101',
      semester: 1,
      sks: 3,
      teacherId: dosen.id,
    },
  });

  // 7. Class offering baseline
  let classOffering = await prisma.class.findFirst({
    where: {
      courseId: course.id,
      academicSemesterId: semester.id,
      section: 'A',
    },
  });

  if (!classOffering) {
    classOffering = await prisma.class.create({
      data: {
        courseId: course.id,
        lecturerId: dosen.id,
        academicSemesterId: semester.id,
        section: 'A',
        schedule: 'Senin 08:00-10:00',
        room: 'A1.01',
        capacity: 40,
        isEnrollmentOpen: true,
      },
    });
  }

  // 8. Legacy enrollment (dipakai modul assignment/material)
  await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: mahasiswa.id,
        courseId: course.id,
      },
    },
    update: {},
    create: {
      userId: mahasiswa.id,
      courseId: course.id,
    },
  });

  // 9. KRS enrollment (dipakai modul class/grade/transcript)
  let krsEnrollment = await prisma.krsEnrollment.findFirst({
    where: { studentId: mahasiswa.id, classId: classOffering.id },
  });

  if (!krsEnrollment) {
    krsEnrollment = await prisma.krsEnrollment.create({
      data: {
        studentId: mahasiswa.id,
        classId: classOffering.id,
        status: 'APPROVED',
        submittedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: dosen.id,
      },
    });
  }

  // 10. Material baseline
  let material = await prisma.material.findFirst({
    where: { courseId: course.id, title: 'Pertemuan 1' },
  });

  if (!material) {
    material = await prisma.material.create({
      data: {
        courseId: course.id,
        title: 'Pertemuan 1',
        content: 'Pengenalan LMS dan struktur perkuliahan',
        order: 1,
        isPublished: true,
      },
    });
  }

  // 11. Assignment baseline
  let assignment = await prisma.assignment.findFirst({
    where: { courseId: course.id, title: 'Tugas 1' },
  });

  if (!assignment) {
    assignment = await prisma.assignment.create({
      data: {
        courseId: course.id,
        title: 'Tugas 1',
        description: 'Kumpulkan ringkasan materi pertemuan pertama',
        dueDate: new Date('2027-01-31T23:59:59.000Z'),
      },
    });
  }

  // 12. Submission baseline
  let submission = await prisma.submission.findFirst({
    where: { assignmentId: assignment.id, studentId: mahasiswa.id },
  });

  if (!submission) {
    submission = await prisma.submission.create({
      data: {
        assignmentId: assignment.id,
        studentId: mahasiswa.id,
        fileUrl: 'https://example.com/submission/tugas1.pdf',
        note: 'Submission seeded by prisma seed',
        grade: 88,
        feedback: 'Bagus, pertahankan',
      },
    });
  }

  // 13. Final grade baseline
  let finalGrade = await prisma.finalGrade.findFirst({
    where: { studentId: mahasiswa.id, classId: classOffering.id },
  });

  if (!finalGrade) {
    finalGrade = await prisma.finalGrade.create({
      data: {
        studentId: mahasiswa.id,
        classId: classOffering.id,
        academicSemesterId: semester.id,
        lecturerId: dosen.id,
        letterGrade: 'A',
        gradePoint: 4.0,
        numericScore: 88,
        status: 'DRAFT',
      },
    });
  }

  console.log({
    admin: admin.email,
    dosen: dosen.email,
    mahasiswa: mahasiswa.email,
    semester: `${semester.academicYear} ${semester.semesterType}`,
    course: course.code,
    classId: classOffering.id,
    materialId: material.id,
    assignmentId: assignment.id,
    submissionId: submission.id,
    finalGradeId: finalGrade.id,
    krsEnrollmentId: krsEnrollment.id,
  });
}

// Jalankan seeding
main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
