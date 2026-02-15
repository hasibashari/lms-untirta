import prisma from '../../config/prisma.js';
import { convertToLetterGrade, calculateAverageGrade, calculateGPA } from '../../utils/grading.util.js';

// ========================================================================
// TRANSCRIPT SERVICE
// Mengelola data transkrip akademik — hasil studi, IPK, dan rekap nilai.
// Modul ini TIDAK mengimpor service dari module lain.
// Grading logic menggunakan shared utility dari utils/grading.util.js.
// ========================================================================

/**
 * Ambil hasil studi mahasiswa (transkrip) berdasarkan enrollment lama (Course-based).
 * Menghitung rata-rata nilai per course, konversi ke huruf mutu, dan IPK.
 *
 * @param {string} studentId
 * @param {object} filters - { semester?: string }
 * @returns {object} { courses, summary }
 */
const getStudyResults = async (studentId, filters = {}) => {
  // Validasi mahasiswa ada
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, role: true },
  });

  if (!student) {
    throw new Error('Mahasiswa tidak ditemukan');
  }

  // Build where clause for enrollment
  const whereClause = { userId: studentId };

  // Get all enrollments with assignments and grades
  const enrollments = await prisma.enrollment.findMany({
    where: whereClause,
    select: {
      enrolledAt: true,
      course: {
        select: {
          id: true,
          title: true,
          code: true,
          semester: true,
          sks: true,
          teacher: {
            select: {
              name: true,
            },
          },
          assignments: {
            select: {
              id: true,
              title: true,
              submissions: {
                where: { studentId },
                select: {
                  grade: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      enrolledAt: 'asc',
    },
  });

  // Calculate grades per course using shared grading utility
  const coursesWithGrades = enrollments.map(enrollment => {
    const course = enrollment.course;

    // Flatten submissions dari semua assignments
    const allSubmissions = course.assignments.flatMap(a =>
      a.submissions.map(s => ({ grade: s.grade }))
    );

    const { averageScore, gradedCount } = calculateAverageGrade(allSubmissions);
    const { letterGrade, gradePoint } = convertToLetterGrade(averageScore);

    return {
      courseId: course.id,
      courseCode: course.code,
      courseName: course.title,
      semester: course.semester,
      teacherName: course.teacher?.name || 'Unknown',
      sks: course.sks || 3,
      averageScore,
      letterGrade,
      gradePoint,
      totalAssignments: course.assignments.length,
      gradedAssignments: gradedCount,
      enrolledAt: enrollment.enrolledAt,
    };
  });

  // Filter by semester if provided
  let filteredCourses = coursesWithGrades;
  if (filters.semester) {
    filteredCourses = coursesWithGrades.filter(
      c => c.semester === parseInt(filters.semester)
    );
  }

  // Calculate GPA using shared utility
  const gpaResult = calculateGPA(filteredCourses);

  return {
    courses: filteredCourses,
    summary: {
      totalCourses: filteredCourses.length,
      completedCourses: gpaResult.completedCourses,
      totalSKS: gpaResult.totalSKS,
      ipk: gpaResult.ipk,
    },
  };
};

/**
 * Ambil transkrip berdasarkan KrsEnrollment (Class-based).
 * Ini untuk data yang datang dari sistem KRS baru.
 *
 * @param {string} studentId
 * @param {object} filters - { academicYear?, semesterType? }
 * @returns {object} { courses, summary }
 */
const getTranscriptByClass = async (studentId, filters = {}) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true },
  });

  if (!student) {
    throw new Error('Mahasiswa tidak ditemukan');
  }

  // Build where clause
  const where = {
    studentId,
    status: 'APPROVED', // Hanya yang sudah disetujui yang masuk transkrip
  };

  if (filters.academicYear || filters.semesterType) {
    where.class = {};
    if (filters.academicYear) {
      where.class.academicYear = filters.academicYear;
    }
    if (filters.semesterType) {
      where.class.semesterType = filters.semesterType;
    }
  }

  const krsEnrollments = await prisma.krsEnrollment.findMany({
    where,
    select: {
      createdAt: true,
      class: {
        select: {
          id: true,
          section: true,
          academicYear: true,
          semesterType: true,
          course: {
            select: {
              id: true,
              title: true,
              code: true,
              semester: true,
              sks: true,
              assignments: {
                select: {
                  id: true,
                  submissions: {
                    where: { studentId },
                    select: {
                      grade: true,
                    },
                  },
                },
              },
            },
          },
          lecturer: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const coursesWithGrades = krsEnrollments.map(enrollment => {
    const cls = enrollment.class;
    const course = cls.course;

    const allSubmissions = course.assignments.flatMap(a =>
      a.submissions.map(s => ({ grade: s.grade }))
    );

    const { averageScore, gradedCount } = calculateAverageGrade(allSubmissions);
    const { letterGrade, gradePoint } = convertToLetterGrade(averageScore);

    return {
      courseId: course.id,
      courseCode: course.code,
      courseName: course.title,
      semester: course.semester,
      section: cls.section,
      academicYear: cls.academicYear,
      semesterType: cls.semesterType,
      teacherName: cls.lecturer?.name || 'Unknown',
      sks: course.sks || 3,
      averageScore,
      letterGrade,
      gradePoint,
      totalAssignments: course.assignments.length,
      gradedAssignments: gradedCount,
      enrolledAt: enrollment.createdAt,
    };
  });

  const gpaResult = calculateGPA(coursesWithGrades);

  return {
    student: {
      id: student.id,
      name: student.name,
    },
    courses: coursesWithGrades,
    summary: {
      totalCourses: coursesWithGrades.length,
      completedCourses: gpaResult.completedCourses,
      totalSKS: gpaResult.totalSKS,
      ipk: gpaResult.ipk,
    },
  };
};

/**
 * Ambil ringkasan akademik mahasiswa — gabungan kedua sumber data.
 * Berguna untuk dashboard.
 *
 * @param {string} studentId
 * @returns {object} summary
 */
const getAcademicSummary = async (studentId) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true },
  });

  if (!student) {
    throw new Error('Mahasiswa tidak ditemukan');
  }

  // Hitung dari enrollment lama
  const legacyResult = await getStudyResults(studentId);

  // Hitung dari KRS baru
  const krsResult = await getTranscriptByClass(studentId);

  return {
    student,
    legacy: legacyResult.summary,
    krs: krsResult.summary,
  };
};

export {
  getStudyResults,
  getTranscriptByClass,
  getAcademicSummary,
};
