import prisma from '../../config/prisma.js';
import { AppError } from '../../config/errors.js';


// ======= SUBMIT ASSIGNMENT =======
const submitAssignment = async (assignmentId, studentId, data) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });

  if (!assignment) {
    throw new AppError(404, 'Tugas tidak ditemukan');
  }

  const isLate = new Date() > assignment.dueDate;

  const existingSubmission = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId,
      },
    },
  });

  if (existingSubmission) {
    throw new AppError(409, 'Anda sudah mengumpulkan tugas ini');
  }

  const submission = await prisma.submission.create({
    data: {
      assignmentId,
      studentId,
      fileUrl: data.fileUrl,
      note: data.note,
    },
    select: {
      id: true,
      assignmentId: true,
      submittedAt: true,
      fileUrl: true,
    },
  });

  return {
    id: submission.id,
    assignmentId: submission.assignmentId,
    submittedAt: submission.submittedAt,
    fileUrl: submission.fileUrl,
    status: 'Submitted',
    isLate,
  };
};

// ======= GET ASSIGNMENT WITH STUDENT SUBMISSION =======
const getAssignmentWithMySubmission = async (assignmentId, studentId) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      courseId: true,
      course: {
        select: {
          id: true,
          title: true,
          code: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new AppError(404, 'Tugas tidak ditemukan');
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: studentId,
        courseId: assignment.courseId,
      },
    },
  });

  if (!enrollment) {
    throw new AppError(403, 'Anda belum terdaftar di kelas ini');
  }

  const mySubmission = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId,
      },
    },
    select: {
      id: true,
      fileUrl: true,
      note: true,
      submittedAt: true,
      grade: true,
      feedback: true,
    },
  });

  const now = new Date();

  return {
    id: assignment.id,
    title: assignment.title,
    dueDate: assignment.dueDate,
    isOverdue: now > assignment.dueDate,
    status: mySubmission
      ? mySubmission.grade !== null
        ? 'graded'
        : 'submitted'
      : now > assignment.dueDate
        ? 'overdue'
        : 'pending',
    grade: mySubmission ? mySubmission.grade : null,
    feedback: mySubmission ? mySubmission.feedback : null,
  };
};

// ======= GET SUBMISSIONS BY ASSIGNMENT =======
const getSubmissionsByAssignment = async (assignmentId, teacherId) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      course: {
        select: {
          teacherId: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new AppError(404, 'Tugas tidak ditemukan');
  }

  if (assignment.course.teacherId !== teacherId) {
    throw new AppError(403, 'Akses ditolak');
  }

  return prisma.submission.findMany({
    where: { assignmentId },
    select: {
      id: true,
      submittedAt: true,
      fileUrl: true,
      note: true,
      grade: true,
      student: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });
};

// ======= GET ALL STUDENT GRADES =======
const getAllMyGrades = async studentId => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: studentId },
    select: {
      course: {
        select: {
          id: true,
          title: true,
          code: true,
          teacher: {
            select: {
              name: true,
            },
          },
          assignments: {
            select: {
              id: true,
              title: true,
              dueDate: true,
              submissions: {
                where: { studentId },
                select: {
                  id: true,
                  grade: true,
                  feedback: true,
                  submittedAt: true,
                },
              },
            },
            orderBy: { dueDate: 'desc' },
          },
        },
      },
    },
  });

  const result = [];

  for (const enrollment of enrollments) {
    const course = enrollment.course;

    for (const assignment of course.assignments) {
      const submission = assignment.submissions[0] || null;
      const now = new Date();

      result.push({
        courseId: course.id,
        courseName: course.title,
        courseCode: course.code,
        teacherName: course.teacher?.name || 'Unknown',
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        dueDate: assignment.dueDate,
        status: submission
          ? submission.grade !== null
            ? 'graded'
            : 'submitted'
          : now > assignment.dueDate
            ? 'overdue'
            : 'pending',
        grade: submission?.grade || null,
        feedback: submission?.feedback || null,
        submittedAt: submission?.submittedAt || null,
      });
    }
  }

  return result;
};

// ======= GET STUDENT DASHBOARD STATS =======
const getMyDashboardStats = async studentId => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: studentId },
    select: { courseId: true },
  });

  const courseIds = enrollments.map(e => e.courseId);
  const now = new Date();

  const [totalAssignments, pendingAssignments, gradedAssignments] = await Promise.all([
    prisma.assignment.count({
      where: { courseId: { in: courseIds } },
    }),
    prisma.assignment.count({
      where: {
        courseId: { in: courseIds },
        dueDate: { gte: now },
        submissions: { none: { studentId } },
      },
    }),
    prisma.submission.count({
      where: {
        studentId,
        assignment: { courseId: { in: courseIds } },
        grade: { not: null },
      },
    }),
  ]);

  return {
    totalCourses: enrollments.length,
    totalAssignments,
    pendingAssignments,
    gradedAssignments,
  };
};

// ======= GRADE STUDENT SUBMISSION =======
const gradeSubmission = async (submissionId, teacherId, data) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      assignment: {
        select: {
          course: {
            select: {
              teacherId: true,
            },
          },
        },
      },
    },
  });

  if (!submission) {
    throw new AppError(404, 'Submission tidak ditemukan');
  }

  if (submission.assignment.course.teacherId !== teacherId) {
    throw new AppError(403, 'Akses ditolak: Ini bukan kelas Anda');
  }

  return prisma.submission.update({
    where: { id: submissionId },
    data: {
      grade: data.grade,
      feedback: data.feedback,
    },
    select: {
      id: true,
      grade: true,
      feedback: true,
      studentId: true,
    },
  });
};

// ======= GET TEACHER DASHBOARD STATS =======
const getTeacherDashboardStats = async teacherId => {
  const courses = await prisma.course.findMany({
    where: { teacherId },
    select: {
      id: true,
      _count: {
        select: {
          students: true,
          materials: true,
          assignments: true,
        },
      },
    },
  });

  const courseIds = courses.map(c => c.id);

  let totalStudents = 0;
  let totalMaterials = 0;
  let totalAssignments = 0;

  for (const course of courses) {
    totalStudents += course._count.students;
    totalMaterials += course._count.materials;
    totalAssignments += course._count.assignments;
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [pendingGrading, recentSubmissions] = await Promise.all([
    prisma.submission.count({
      where: {
        assignment: { courseId: { in: courseIds } },
        grade: null,
      },
    }),
    prisma.submission.count({
      where: {
        assignment: { courseId: { in: courseIds } },
        submittedAt: { gte: sevenDaysAgo },
      },
    }),
  ]);

  return {
    totalCourses: courses.length,
    totalStudents,
    totalMaterials,
    totalAssignments,
    pendingGrading,
    recentSubmissions,
  };
};

// ======= GET RECENT SUBMISSIONS FOR TEACHER =======
const getRecentSubmissionsForTeacher = async (teacherId, limit = 10) => {
  const submissions = await prisma.submission.findMany({
    where: {
      assignment: {
        course: {
          teacherId,
        },
      },
    },
    select: {
      id: true,
      submittedAt: true,
      grade: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignment: {
        select: {
          id: true,
          title: true,
          course: {
            select: {
              id: true,
              title: true,
              code: true,
            },
          },
        },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
    take: limit,
  });

  return submissions.map(sub => ({
    id: sub.id,
    studentName: sub.student.name,
    studentEmail: sub.student.email,
    assignmentId: sub.assignment.id,
    assignmentTitle: sub.assignment.title,
    courseId: sub.assignment.course.id,
    courseName: sub.assignment.course.title,
    courseCode: sub.assignment.course.code,
    submittedAt: sub.submittedAt,
    isGraded: sub.grade !== null,
    grade: sub.grade,
  }));
};

export {
  submitAssignment,
  getAssignmentWithMySubmission,
  getSubmissionsByAssignment,
  getAllMyGrades,
  getMyDashboardStats,
  gradeSubmission,
  getTeacherDashboardStats,
  getRecentSubmissionsForTeacher,
};
