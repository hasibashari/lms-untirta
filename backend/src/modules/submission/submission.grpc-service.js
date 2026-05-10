import grpc from '@grpc/grpc-js';
import prisma from '../../config/prisma.js';

export const submissionService = {
  SubmitAssignment: async (call, callback) => {
    try {
      const { assignmentId, studentId, fileUrl, note } = call.request;

      const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });

      if (!assignment) {
        return callback({ code: grpc.status.NOT_FOUND, details: 'Tugas tidak ditemukan' });
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
        return callback({ code: grpc.status.ALREADY_EXISTS, details: 'Anda sudah mengumpulkan tugas ini' });
      }

      const submission = await prisma.submission.create({
        data: {
          assignmentId,
          studentId,
          fileUrl,
          note,
        },
        select: {
          id: true,
          assignmentId: true,
          submittedAt: true,
          fileUrl: true,
        },
      });

      callback(null, {
        message: 'Tugas berhasil dikumpulkan',
        submission: {
          id: submission.id,
          assignmentId: submission.assignmentId,
          submittedAt: submission.submittedAt.toISOString(),
          fileUrl: submission.fileUrl,
          status: 'Submitted',
          isLate,
        },
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetAssignmentWithMySubmission: async (call, callback) => {
    try {
      const { assignmentId, studentId } = call.request;

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
        return callback({ code: grpc.status.NOT_FOUND, details: 'Tugas tidak ditemukan' });
      }

      const enrollment = await prisma.krsEnrollment.findFirst({
        where: {
          studentId: studentId,
          class: { courseId: assignment.courseId },
          status: 'APPROVED',
        },
      });

      if (!enrollment) {
        return callback({ code: grpc.status.PERMISSION_DENIED, details: 'Anda belum terdaftar di kelas ini' });
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

      const responseData = {
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate.toISOString(),
        isOverdue: now > assignment.dueDate,
        status: mySubmission
          ? mySubmission.grade !== null
            ? 'graded'
            : 'submitted'
          : now > assignment.dueDate
            ? 'overdue'
            : 'pending',
        submittedAt: mySubmission ? mySubmission.submittedAt.toISOString() : '',
        fileUrl: mySubmission ? mySubmission.fileUrl : '',
        note: mySubmission ? mySubmission.note : '',
        grade: mySubmission ? (mySubmission.grade || 0) : 0,
        feedback: mySubmission ? mySubmission.feedback : '',
      };

      callback(null, {
        message: 'Berhasil mengambil detail tugas',
        data: responseData,
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetSubmissionsByAssignment: async (call, callback) => {
    try {
      const { assignmentId, teacherId } = call.request;

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
        return callback({ code: grpc.status.NOT_FOUND, details: 'Tugas tidak ditemukan' });
      }

      if (assignment.course.teacherId !== teacherId) {
        return callback({ code: grpc.status.PERMISSION_DENIED, details: 'Akses ditolak' });
      }

      const submissions = await prisma.submission.findMany({
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

      const data = submissions.map(sub => ({
        id: sub.id,
        submittedAt: sub.submittedAt.toISOString(),
        fileUrl: sub.fileUrl || '',
        note: sub.note || '',
        grade: sub.grade || 0,
        student: {
          id: sub.student.id,
          name: sub.student.name,
        },
      }));

      callback(null, {
        message: 'Daftar submission berhasil diambil',
        data,
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetAllMyGrades: async (call, callback) => {
    try {
      const { studentId } = call.request;

      const enrollments = await prisma.krsEnrollment.findMany({
        where: { studentId: studentId, status: 'APPROVED' },
        select: {
          class: {
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
          },
        },
      });

      const result = [];

      for (const enrollment of enrollments) {
        const course = enrollment.class.course;

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
            dueDate: assignment.dueDate.toISOString(),
            status: submission
              ? submission.grade !== null
                ? 'graded'
                : 'submitted'
              : now > assignment.dueDate
                ? 'overdue'
                : 'pending',
            grade: submission?.grade || 0,
            feedback: submission?.feedback || '',
            submittedAt: submission?.submittedAt ? submission.submittedAt.toISOString() : '',
          });
        }
      }

      callback(null, {
        message: 'Daftar nilai berhasil diambil',
        data: result,
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetMyDashboardStats: async (call, callback) => {
    try {
      const { studentId } = call.request;

      const enrollments = await prisma.krsEnrollment.findMany({
        where: { studentId: studentId, status: 'APPROVED' },
        select: { class: { select: { courseId: true } } },
      });

      const courseIds = enrollments.map(e => e.class.courseId);
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

      callback(null, {
        message: 'Dashboard stats berhasil diambil',
        data: {
          totalCourses: enrollments.length,
          totalAssignments,
          pendingAssignments,
          gradedAssignments,
        },
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GradeSubmission: async (call, callback) => {
    try {
      const { submissionId, teacherId, grade, feedback } = call.request;

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
        return callback({ code: grpc.status.NOT_FOUND, details: 'Submission tidak ditemukan' });
      }

      if (submission.assignment.course.teacherId !== teacherId) {
        return callback({ code: grpc.status.PERMISSION_DENIED, details: 'Akses ditolak: Ini bukan kelas Anda' });
      }

      const updated = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          grade,
          feedback,
        },
        select: {
          id: true,
          grade: true,
          feedback: true,
          studentId: true,
        },
      });

      callback(null, {
        message: 'Berhasil memberikan nilai',
        data: {
          id: updated.id,
          grade: updated.grade || 0,
          feedback: updated.feedback || '',
          studentId: updated.studentId,
        },
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetTeacherDashboardStats: async (call, callback) => {
    try {
      const { teacherId } = call.request;

      const courses = await prisma.course.findMany({
        where: { teacherId },
        select: {
          id: true,
          _count: {
            select: {
              materials: true,
              assignments: true,
            },
          },
          classes: {
            select: {
              _count: {
                select: {
                  krsEnrollments: { where: { status: 'APPROVED' } },
                },
              },
            },
          },
        },
      });

      const courseIds = courses.map(c => c.id);

      let totalStudents = 0;
      let totalMaterials = 0;
      let totalAssignments = 0;

      for (const course of courses) {
        const studentsInCourse = course.classes.reduce((acc, cls) => acc + (cls._count?.krsEnrollments || 0), 0);
        totalStudents += studentsInCourse;
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

      callback(null, {
        message: 'Dashboard stats berhasil diambil',
        data: {
          totalCourses: courses.length,
          totalStudents,
          totalMaterials,
          totalAssignments,
          pendingGrading,
          recentSubmissions,
        },
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetRecentSubmissionsForTeacher: async (call, callback) => {
    try {
      const { teacherId, limit } = call.request;

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
        take: limit > 0 ? limit : 10,
      });

      const data = submissions.map(sub => ({
        id: sub.id,
        studentName: sub.student.name,
        studentEmail: sub.student.email,
        assignmentId: sub.assignment.id,
        assignmentTitle: sub.assignment.title,
        courseId: sub.assignment.course.id,
        courseName: sub.assignment.course.title,
        courseCode: sub.assignment.course.code,
        submittedAt: sub.submittedAt.toISOString(),
        isGraded: sub.grade !== null,
        grade: sub.grade || 0,
      }));

      callback(null, {
        message: 'Daftar submission terbaru berhasil diambil',
        data,
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },
};

export default submissionService;
