import prisma from '../../config/prisma.js';
import { convertToLetterGrade, calculateAverageGrade, calculateGPA, calculatePredicate } from '../../utils/grading.util.js';
import { AppError } from '../../config/errors.js';
import { paginate } from '../../utils/pagination.js';

export const getStudyResults = async (studentId, filters = {}) => {
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
      predicate: calculatePredicate(gpaResult.ipk),
    },
  };
};


export const getTranscriptByClass = async (studentId, filters = {}, options = {}) => {
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

  // Sort courses chronologically for transcriptSemesters
  coursesWithGrades.sort((a, b) => {
    if (a.academicYear !== b.academicYear) {
      return (a.academicYear || '').localeCompare(b.academicYear || ''); // Ascending year
    }
    return (a.semesterType || '').localeCompare(b.semesterType || ''); // GANJIL < GENAP
  });

  const periodMap = new Map();
  for (const c of coursesWithGrades) {
    const key = c.academicSemesterId || 'legacy';
    if (!periodMap.has(key)) {
      periodMap.set(key, {
        semester: key,
        semesterTitle: c.academicYear 
            ? `${c.academicYear} - ${c.semesterType === 'GANJIL' ? 'Ganjil' : 'Genap'}`
            : 'Data Akademik Terlampau',
        academicYear: c.academicYear,
        semesterType: c.semesterType,
        courses: []
      });
    }
    periodMap.get(key).courses.push(c);
  }

  let cumulativeTotalSks = 0;
  let cumulativeGradedSks = 0;
  let cumulativeMutu = 0;
  
  const transcriptSemesters = Array.from(periodMap.values()).map(sem => {
    // All SKS taken this semester
    const semTotalSks = sem.courses.reduce((sum, c) => sum + (c.sks || 0), 0);
    cumulativeTotalSks += semTotalSks;

    const gradedCoursesInSem = sem.courses.filter(c => c.letterGrade && c.letterGrade !== '-');
    
    let semGradedSks = 0;
    let semMutu = 0;
    for (const c of gradedCoursesInSem) {
        semGradedSks += (c.sks || 0);
        semMutu += (c.sks || 0) * (c.gradePoint || 0);
    }

    cumulativeGradedSks += semGradedSks;
    cumulativeMutu += semMutu;
    
    const ip = semGradedSks > 0 ? semMutu / semGradedSks : 0;
    const ipk = cumulativeGradedSks > 0 ? cumulativeMutu / cumulativeGradedSks : 0;

    return {
      ...sem,
      ip,
      ipk,
      totalSks: semTotalSks,
      cumulativeTotalSks
    };
  });

  // Calculate overall GPA based on closed courses ONLY for the summary stats
  const closedCourses = coursesWithGrades.filter(c => c.semesterStatus === 'CLOSED');
  const gpaResult = calculateGPA(closedCourses);

  return {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      nim: student.nim,
    },
    courses: coursesWithGrades,
    transcriptSemesters,
    summary: {
      totalCourses: closedCourses.length,
      completedCourses: gpaResult.completedCourses,
      totalSKS: gpaResult.totalSKS,
      ipk: gpaResult.ipk,
      predicate: calculatePredicate(gpaResult.ipk),
    },
  };
};


export const getAcademicSummary = async (studentId) => {
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


export const getStudentList = async (filters = {}, query = {}) => {
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


export const getFullStudentTranscript = async (studentId, options = {}) => {
  const isStudentView = options.isStudentView === true;

  // Use getTranscriptByClass to get the core data (student, courses, summary)
  const krsResult = await getTranscriptByClass(studentId, {}, { isStudentView });

  // Calculate grade distribution from all courses
  const gradeDistribution = {
    'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0, 'C+': 0, 'C': 0, 'D': 0, 'E': 0, '-': 0
  };

  krsResult.courses.forEach(c => {
    const grade = c.letterGrade || '-';
    if (Object.prototype.hasOwnProperty.call(gradeDistribution, grade)) {
      gradeDistribution[grade]++;
    } else {
      gradeDistribution['-']++;
    }
  });

  return {
    student: krsResult.student,
    courses: krsResult.courses,
    transcriptSemesters: krsResult.transcriptSemesters,
    summary: krsResult.summary,
    gradeDistribution,
  };
};


