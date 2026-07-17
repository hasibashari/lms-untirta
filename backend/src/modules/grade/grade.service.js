import prisma from '../../config/prisma.js';
import { AppError } from '../../config/errors.js';

// ======================== GRADE POINT MAPPING ========================

const GRADE_POINTS = {
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'D': 1.0,
  'E': 0.0,
};

const getGradePoint = (letterGrade) => GRADE_POINTS[letterGrade] ?? 0;

// ======================== GET CLASS STUDENTS FOR GRADING ========================

export const getClassStudentsForGrading = async (classId, lecturerId) => {
  // Verify lecturer owns this class
  const classData = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      lecturerId: true,
      section: true,
      academicSemesterId: true,
      academicSemester: { select: { id: true, academicYear: true, semesterType: true, status: true } },
      course: { select: { id: true, title: true, code: true, sks: true } },
    },
  });

  if (!classData) throw new AppError(404, 'Kelas tidak ditemukan');
  if (classData.lecturerId !== lecturerId) {
    throw new AppError(403, 'Anda tidak berhak mengakses kelas ini');
  }

  // Get enrolled students (APPROVED KRS only)
  const enrollments = await prisma.krsEnrollment.findMany({
    where: {
      classId,
      status: 'APPROVED',
    },
    select: {
      studentId: true,
      student: { select: { id: true, name: true, email: true } },
    },
    orderBy: { student: { name: 'asc' } },
  });

  // Get existing grades for this class
  const existingGrades = await prisma.finalGrade.findMany({
    where: { classId },
    select: {
      id: true,
      studentId: true,
      letterGrade: true,
      gradePoint: true,
      numericScore: true,
      status: true,
      note: true,
      updatedAt: true,
    },
  });

  const gradeMap = new Map(existingGrades.map((g) => [g.studentId, g]));

  const students = enrollments.map((e) => ({
    student: e.student,
    grade: gradeMap.get(e.studentId) || null,
  }));

  const totalStudents = students.length;
  const draft = existingGrades.filter((g) => g.status === 'DRAFT').length;
  const finalized = existingGrades.filter((g) => g.status === 'FINALIZED').length;
  
  const allFinalized = totalStudents > 0 && finalized === totalStudents;
  const semesterStatus = classData.academicSemester?.status || null;
  const canEdit = !allFinalized && (!semesterStatus || semesterStatus === 'OPEN');

  return {
    class: classData,
    semesterStatus,
    students,
    summary: {
      totalStudents,
      graded: existingGrades.length,
      draft,
      finalized,
    },
    permissions: {
      canEdit,
    },
  };
};

// ======================== INPUT SINGLE GRADE ========================

export const inputGrade = async (classId, lecturerId, { studentId, letterGrade, numericScore, note }) => {
  // Verify lecturer owns this class
  const classData = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      lecturerId: true,
      academicSemesterId: true,
      academicSemester: { select: { status: true } },
    },
  });

  if (!classData) throw new AppError(404, 'Kelas tidak ditemukan');
  if (classData.lecturerId !== lecturerId) {
    throw new AppError(403, 'Anda tidak berhak memberikan nilai untuk kelas ini');
  }

  // Check semester allows grading (only when OPEN)
  const semesterStatus = classData.academicSemester?.status;
  if (semesterStatus && semesterStatus !== 'OPEN') {
    throw new AppError(
      400,
      `Tidak dapat input nilai saat status semester ${semesterStatus}. Semester harus dalam status OPEN.`
    );
  }

  // Verify student is enrolled in this class (APPROVED)
  const enrollment = await prisma.krsEnrollment.findFirst({
    where: { studentId, classId, status: 'APPROVED' },
  });

  if (!enrollment) {
    throw new AppError(400, 'Mahasiswa tidak terdaftar di kelas ini atau KRS belum disetujui');
  }

  // Check if existing finalized grade
  const existing = await prisma.finalGrade.findUnique({
    where: { studentId_classId: { studentId, classId } },
  });

  if (existing && existing.status === 'FINALIZED') {
    throw new AppError(409, 'Nilai sudah difinalisasi dan tidak dapat diubah');
  }

  const gradePoint = getGradePoint(letterGrade);

  const grade = await prisma.finalGrade.upsert({
    where: { studentId_classId: { studentId, classId } },
    create: {
      studentId,
      classId,
      lecturerId,
      academicSemesterId: classData.academicSemesterId || '',
      letterGrade,
      gradePoint,
      numericScore: numericScore || null,
      note: note || null,
      status: 'DRAFT',
    },
    update: {
      letterGrade,
      gradePoint,
      numericScore: numericScore || null,
      note: note || null,
    },
    select: {
      id: true,
      studentId: true,
      letterGrade: true,
      gradePoint: true,
      numericScore: true,
      status: true,
      note: true,
      student: { select: { name: true, email: true } },
    },
  });

  return grade;
};

// ======================== BULK INPUT GRADES ========================

export const bulkInputGrades = async (classId, lecturerId, grades) => {
  const classData = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      lecturerId: true,
      academicSemesterId: true,
      academicSemester: { select: { status: true } },
    },
  });

  if (!classData) throw new AppError(404, 'Kelas tidak ditemukan');
  if (classData.lecturerId !== lecturerId) {
    throw new AppError(403, 'Anda tidak berhak memberikan nilai untuk kelas ini');
  }

  const semesterStatus = classData.academicSemester?.status;
  if (semesterStatus && semesterStatus !== 'OPEN') {
    throw new AppError(
      400,
      `Tidak dapat input nilai saat status semester ${semesterStatus}`
    );
  }

  // Verify all students are enrolled
  const studentIds = grades.map((g) => g.studentId);
  const enrollments = await prisma.krsEnrollment.findMany({
    where: { classId, studentId: { in: studentIds }, status: 'APPROVED' },
    select: { studentId: true },
  });

  const enrolledIds = new Set(enrollments.map((e) => e.studentId));
  const notEnrolled = studentIds.filter((id) => !enrolledIds.has(id));

  if (notEnrolled.length > 0) {
    throw new AppError(400, `${notEnrolled.length} mahasiswa tidak terdaftar di kelas ini`);
  }

  // Check for already finalized grades
  const existingFinalized = await prisma.finalGrade.findMany({
    where: {
      classId,
      studentId: { in: studentIds },
      status: 'FINALIZED',
    },
    select: { studentId: true },
  });

  if (existingFinalized.length > 0) {
    throw new AppError(
      409,
      `${existingFinalized.length} nilai sudah difinalisasi dan tidak dapat diubah`
    );
  }

  // Upsert all grades in a transaction
  const results = await prisma.$transaction(
    grades.map((g) =>
      prisma.finalGrade.upsert({
        where: { studentId_classId: { studentId: g.studentId, classId } },
        create: {
          studentId: g.studentId,
          classId,
          lecturerId,
          academicSemesterId: classData.academicSemesterId || '',
          letterGrade: g.letterGrade,
          gradePoint: getGradePoint(g.letterGrade),
          numericScore: g.numericScore || null,
          note: g.note || null,
          status: 'DRAFT',
        },
        update: {
          letterGrade: g.letterGrade,
          gradePoint: getGradePoint(g.letterGrade),
          numericScore: g.numericScore || null,
          note: g.note || null,
        },
      })
    )
  );

  return {
    message: `${results.length} nilai berhasil disimpan`,
    count: results.length,
  };
};

// ======================== FINALIZE GRADES ========================

export const finalizeGrades = async (classId, lecturerId) => {
  const classData = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      lecturerId: true,
      academicSemester: { select: { status: true } },
    },
  });

  if (!classData) throw new AppError(404, 'Kelas tidak ditemukan');
  if (classData.lecturerId !== lecturerId) {
    throw new AppError(403, 'Anda tidak berhak memfinalisasi nilai untuk kelas ini');
  }

  // Semester must be OPEN to finalize grades
  const semesterStatus = classData.academicSemester?.status;
  if (semesterStatus && semesterStatus !== 'OPEN') {
    throw new AppError(
      400,
      `Tidak dapat memfinalisasi nilai saat status semester ${semesterStatus}. Semester harus dalam status OPEN.`
    );
  }

  const draftGrades = await prisma.finalGrade.findMany({
    where: { classId, status: 'DRAFT' },
    select: { id: true },
  });

  if (draftGrades.length === 0) {
    throw new AppError(400, 'Tidak ada nilai draft untuk difinalisasi');
  }

  const result = await prisma.finalGrade.updateMany({
    where: {
      classId,
      status: 'DRAFT',
    },
    data: {
      status: 'FINALIZED',
    },
  });

  return {
    message: `${result.count} nilai berhasil difinalisasi`,
    count: result.count,
  };
};

// ======================== GET MY GRADES (STUDENT) ========================

export const getMyGrades = async (studentId, filters = {}) => {
  const where = {
    studentId,
    status: 'FINALIZED', // Students can ONLY see finalized grades
  };

  // Optional: filter by semester
  if (filters.academicSemesterId) {
    where.academicSemesterId = filters.academicSemesterId;
  }

  // Also check: only show grades from closed semesters
  // Unless explicitly requested otherwise (e.g., admin view)
  if (!filters.includeOngoing) {
    where.OR = [
      { academicSemester: { status: 'CLOSED' } },
      { academicSemesterId: '' }, // Legacy grades without semester link
    ];
  }

  const grades = await prisma.finalGrade.findMany({
    where,
    select: {
      id: true,
      letterGrade: true,
      gradePoint: true,
      numericScore: true,
      status: true,
      note: true,
      updatedAt: true,
      class: {
        select: {
          id: true,
          section: true,
          academicSemesterId: true,
          academicSemester: {
            select: {
              academicYear: true,
              semesterType: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              code: true,
              semester: true,
              sks: true,
            },
          },
          lecturer: { select: { id: true, name: true } },
        },
      },
      academicSemester: {
        select: { id: true, academicYear: true, semesterType: true, status: true },
      },
    },
    orderBy: [
      { class: { course: { semester: 'asc' } } },
      { class: { course: { code: 'asc' } } },
    ],
  });

  // Calculate GPA
  let totalPoints = 0;
  let totalSKS = 0;
  let completedCourses = 0;

  for (const grade of grades) {
    const sks = grade.class.course.sks || 3;
    totalPoints += grade.gradePoint * sks;
    totalSKS += sks;
    completedCourses++;
  }

  const ipk = totalSKS > 0 ? Math.round((totalPoints / totalSKS) * 100) / 100 : 0;

  return {
    grades: grades.map((g) => ({
      id: g.id,
      letterGrade: g.letterGrade,
      gradePoint: g.gradePoint,
      numericScore: g.numericScore,
      status: g.status,
      class: g.class,
      academicSemester: g.academicSemester,
    })),
    summary: {
      totalCourses: completedCourses,
      totalSKS,
      ipk,
    },
  };
};


