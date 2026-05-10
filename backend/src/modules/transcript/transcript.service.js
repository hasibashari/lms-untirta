import prisma from '../../config/prisma.js';
import { convertToLetterGrade, calculateAverageGrade, calculateGPA } from '../../utils/grading.util.js';
import { AppError } from '../../config/errors.js';
import { paginate } from '../../utils/pagination.js';

const getStudyResults = async (studentId, filters = {}) => {
  // Validasi mahasiswa ada
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true, nim: true, role: true },
  });

  if (!student) {
    throw new AppError(404, 'Mahasiswa tidak ditemukan');
  }

  // Build where clause for enrollment
  const whereClause = { userId: studentId };

  // Get all enrollments with assignments and grades
  // Get all approved KRS enrollments
  const enrollments = await prisma.krsEnrollment.findMany({
    where: { studentId: studentId, status: 'APPROVED' },
    select: {
      createdAt: true,
      class: {
        select: {
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

  // Calculate grades per course using shared grading utility
  const coursesWithGrades = enrollments.map(enrollment => {
    const course = enrollment.class.course;

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
      teacherName: enrollment.class.lecturer?.name || 'Unknown',
      sks: course.sks || 3,
      averageScore,
      letterGrade,
      gradePoint,
      totalAssignments: course.assignments.length,
      gradedAssignments: gradedCount,
      enrolledAt: enrollment.createdAt,
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
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      nim: student.nim,
    },
    courses: filteredCourses,
    summary: {
      totalCourses: filteredCourses.length,
      completedCourses: gpaResult.completedCourses,
      totalSKS: gpaResult.totalSKS,
      ipk: gpaResult.ipk,
    },
  };
};


const getTranscriptByClass = async (studentId, filters = {}, options = {}) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true, nim: true },
  });

  if (!student) {
    throw new AppError(404, 'Mahasiswa tidak ditemukan');
  }

  const isStudentView = options.isStudentView !== false; // default true

  // Build where clause
  const where = {
    studentId,
    status: 'APPROVED',
  };

  if (filters.academicSemesterId) {
    where.class = { academicSemesterId: filters.academicSemesterId };
  }

  const krsEnrollments = await prisma.krsEnrollment.findMany({
    where,
    select: {
      createdAt: true,
      class: {
        select: {
          id: true,
          section: true,
          academicSemesterId: true,
          academicSemester: {
            select: {
              id: true,
              academicYear: true,
              semesterType: true,
              status: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              code: true,
              semester: true,
              sks: true,
              ...(!isStudentView && {
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
              }),
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

  // Fetch FinalGrade data for this student
  const classIds = krsEnrollments.map(e => e.class.id);
  const finalGrades = await prisma.finalGrade.findMany({
    where: {
      studentId,
      classId: { in: classIds },
    },
    select: {
      classId: true,
      letterGrade: true,
      gradePoint: true,
      numericScore: true,
      status: true,
    },
  });
  const finalGradeMap = new Map(finalGrades.map(g => [g.classId, g]));

  const coursesWithGrades = krsEnrollments.map(enrollment => {
    const cls = enrollment.class;
    const course = cls.course;
    const semesterStatus = cls.academicSemester?.status;
    const finalGrade = finalGradeMap.get(cls.id);

    // GRADE VISIBILITY LOGIC:
    // For student view: only show finalized grades from closed semesters
    // For admin/dosen view: show all grades
    let letterGrade = '-';
    let gradePoint = 0;
    let averageScore = null;
    let gradeSource = 'none';

    if (finalGrade) {
      const canShowGrade = !isStudentView || finalGrade.status === 'FINALIZED';

      if (canShowGrade) {
        letterGrade = finalGrade.letterGrade;
        gradePoint = finalGrade.gradePoint;
        averageScore = finalGrade.numericScore;
        gradeSource = 'final_grade';
      }
    } else if (!isStudentView && course.assignments) {
      // Fallback to assignment averages (only for admin/dosen view)
      const allSubmissions = course.assignments.flatMap(a =>
        a.submissions.map(s => ({ grade: s.grade }))
      );
      const avgResult = calculateAverageGrade(allSubmissions);
      averageScore = avgResult.averageScore;
      const converted = convertToLetterGrade(averageScore);
      letterGrade = converted.letterGrade;
      gradePoint = converted.gradePoint;
      gradeSource = 'assignment_average';
    }

    return {
      courseId: course.id,
      courseCode: course.code,
      courseName: course.title,
      semester: course.semester,
      section: cls.section,
      academicSemesterId: cls.academicSemesterId,
      academicYear: cls.academicSemester.academicYear,
      semesterType: cls.academicSemester.semesterType,
      semesterStatus: semesterStatus || null,
      teacherName: cls.lecturer?.name || 'Unknown',
      sks: course.sks || 3,
      averageScore,
      letterGrade,
      gradePoint,
      gradeSource,
      totalAssignments: course.assignments?.length || 0,
      enrolledAt: enrollment.createdAt,
    };
  });

  // GPA/IPK: only count courses from CLOSED semesters
  const closedCourses = coursesWithGrades.filter(c => c.semesterStatus === 'CLOSED');
  const gpaResult = calculateGPA(closedCourses);

  // Per-semester IPS breakdown (only CLOSED semesters)
  const semesterMap = new Map();
  for (const c of closedCourses) {
    const key = c.academicSemesterId;
    if (!key) continue;
    if (!semesterMap.has(key)) {
      semesterMap.set(key, {
        academicSemesterId: key,
        academicYear: c.academicYear,
        semesterType: c.semesterType,
        courses: [],
      });
    }
    semesterMap.get(key).courses.push(c);
  }

  const semesterBreakdown = Array.from(semesterMap.values()).map(sem => {
    const ips = calculateGPA(sem.courses);
    return {
      academicSemesterId: sem.academicSemesterId,
      academicYear: sem.academicYear,
      semesterType: sem.semesterType,
      totalSKS: ips.totalSKS,
      ips: ips.ipk,
      completedCourses: ips.completedCourses,
    };
  });

  return {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      nim: student.nim,
    },
    courses: coursesWithGrades,
    semesterBreakdown,
    summary: {
      totalCourses: closedCourses.length,
      completedCourses: gpaResult.completedCourses,
      totalSKS: gpaResult.totalSKS,
      ipk: gpaResult.ipk,
    },
  };
};


const getAcademicSummary = async (studentId) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true, nim: true },
  });

  if (!student) {
    throw new AppError(404, 'Mahasiswa tidak ditemukan');
  }

  // Get from KRS result (now the only source)
  const krsResult = await getTranscriptByClass(studentId, {}, { isStudentView: true });

  return {
    student,
    summary: krsResult.summary,
  };
};


const getStudentList = async (filters = {}, query = {}) => {
  const { skip, take, meta } = paginate(query);
  const where = { role: 'MAHASISWA' };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        nim: true,
        createdAt: true,
        _count: {
          select: {
            krsEnrollments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: students.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      nim: s.nim,
      createdAt: s.createdAt,
      totalKrsEnrollments: s._count.krsEnrollments,
    })),
    pagination: meta(total),
  };
};


const getFullStudentTranscript = async (studentId, options = {}) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true, nim: true, createdAt: true },
  });

  if (!student) {
    throw new AppError(404, 'Mahasiswa tidak ditemukan');
  }

  // Get data using the class-based transcript logic
  const krsResult = await getTranscriptByClass(studentId, {}, options);

  // Calculate grade distribution from all courses
  const gradeDistribution = krsResult.courses.reduce((acc, c) => {
    const grade = c.letterGrade || '-';
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {});

  return {
    student,
    courses: krsResult.courses,
    summary: krsResult.summary,
    semesterBreakdown: krsResult.semesterBreakdown,
    gradeDistribution,
  };
};

export {
  getStudyResults,
  getTranscriptByClass,
  getAcademicSummary,
  getStudentList,
  getFullStudentTranscript,
};
