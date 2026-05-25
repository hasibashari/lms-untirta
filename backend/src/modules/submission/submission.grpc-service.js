import grpc from '@grpc/grpc-js';
import prisma from '../../config/prisma.js';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Memeriksa status pengumpulan tugas (graded, submitted, overdue, pending)
 */
const calculateSubmissionStatus = (dueDate, submission) => {
  const now = new Date();
  if (submission) {
    return submission.grade !== null ? 'graded' : 'submitted';
  }
  return now > dueDate ? 'overdue' : 'pending';
};

/**
 * Memeriksa apakah seorang pengajar memiliki akses ke tugas/submission
 * (Bisa sebagai pengampu mata kuliah atau dosen kelas)
 */
const hasTeacherAccess = (assignment, teacherId) => {
  const isCourseTeacher = assignment.course?.teacherId === teacherId;
  const isClassLecturer = assignment.class?.lecturerId === teacherId;
  return isCourseTeacher || isClassLecturer;
};

// =============================================================================
// HANDLERS — STUDENT SIDE
// =============================================================================

const SubmitAssignment = async (call, callback) => {
  try {
    const { assignmentId, studentId, fileUrl, note } = call.request;

    // 1. Validasi Tugas
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      return callback({ code: grpc.status.NOT_FOUND, details: 'Tugas tidak ditemukan' });
    }

    // 2. Validasi Enrollment
    const enrollment = await prisma.krsEnrollment.findFirst({
      where: { studentId, classId: assignment.classId, status: 'APPROVED' },
    });
    if (!enrollment) {
      return callback({ code: grpc.status.PERMISSION_DENIED, details: 'Anda belum terdaftar di kelas ini' });
    }

    // 3. Cek Duplikasi
    const existingSubmission = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    });
    if (existingSubmission) {
      return callback({ code: grpc.status.ALREADY_EXISTS, details: 'Anda sudah mengumpulkan tugas ini' });
    }

    // 4. Simpan Submission
    const submission = await prisma.submission.create({
      data: { assignmentId, studentId, fileUrl, note },
      select: { id: true, assignmentId: true, submittedAt: true, fileUrl: true },
    });

    callback(null, {
      message: 'Tugas berhasil dikumpulkan',
      submission: {
        id: submission.id,
        assignmentId: submission.assignmentId,
        submittedAt: submission.submittedAt.toISOString(),
        fileUrl: submission.fileUrl,
        status: 'Submitted',
        isLate: new Date() > assignment.dueDate,
      },
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

const GetAssignmentWithMySubmission = async (call, callback) => {
  try {
    const { assignmentId, studentId } = call.request;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true, title: true, dueDate: true, classId: true,
        course: { select: { id: true, title: true, code: true } },
      },
    });

    if (!assignment) {
      return callback({ code: grpc.status.NOT_FOUND, details: 'Tugas tidak ditemukan' });
    }

    // Cek apakah mahasiswa terdaftar di kelas ini
    const enrollment = await prisma.krsEnrollment.findFirst({
      where: { studentId, classId: assignment.classId, status: 'APPROVED' },
    });
    if (!enrollment) {
      return callback({ code: grpc.status.PERMISSION_DENIED, details: 'Anda belum terdaftar di kelas ini' });
    }

    const mySubmission = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    });

    callback(null, {
      message: 'Berhasil mengambil detail tugas',
      data: {
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate.toISOString(),
        isOverdue: new Date() > assignment.dueDate,
        status: calculateSubmissionStatus(assignment.dueDate, mySubmission),
        submittedAt: mySubmission?.submittedAt?.toISOString() || '',
        fileUrl: mySubmission?.fileUrl || '',
        note: mySubmission?.note || '',
        grade: mySubmission?.grade || 0,
        feedback: mySubmission?.feedback || '',
      },
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

const GetAllMyGrades = async (call, callback) => {
  try {
    const { studentId } = call.request;

    const enrollments = await prisma.krsEnrollment.findMany({
      where: { studentId, status: 'APPROVED' },
      include: {
        class: {
          include: {
            course: { include: { teacher: { select: { name: true } } } },
          },
        },
      },
    });

    const result = [];
    for (const enrollment of enrollments) {
      const { classId, class: classData } = enrollment;
      const { course } = classData;

      const assignments = await prisma.assignment.findMany({
        where: {
          OR: [
            { classId: classId },
            { AND: [{ courseId: course.id }, { classId: null }] }
          ]
        },
        include: {
          submissions: { where: { studentId } },
        },
        orderBy: { dueDate: 'desc' },
      });

      for (const assignment of assignments) {
        const submission = assignment.submissions[0] || null;
        result.push({
          courseId: course.id,
          courseName: course.title,
          courseCode: course.code,
          teacherName: course.teacher?.name || 'Unknown',
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          dueDate: assignment.dueDate.toISOString(),
          status: calculateSubmissionStatus(assignment.dueDate, submission),
          grade: submission?.grade || 0,
          feedback: submission?.feedback || '',
          submittedAt: submission?.submittedAt?.toISOString() || '',
        });
      }
    }

    callback(null, { message: 'Daftar nilai berhasil diambil', data: result });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

const GetMyDashboardStats = async (call, callback) => {
  try {
    const { studentId } = call.request;

    const enrollments = await prisma.krsEnrollment.findMany({
      where: { studentId, status: 'APPROVED' },
      select: { classId: true },
    });

    const classIds = enrollments.map(e => e.classId);
    const now = new Date();

    const [totalAssignments, pendingAssignments, gradedAssignments] = await Promise.all([
      prisma.assignment.count({ where: { classId: { in: classIds } } }),
      prisma.assignment.count({
        where: {
          classId: { in: classIds },
          dueDate: { gte: now },
          submissions: { none: { studentId } },
        },
      }),
      prisma.submission.count({
        where: {
          studentId,
          assignment: { classId: { in: classIds } },
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
};

// =============================================================================
// HANDLERS — TEACHER SIDE
// =============================================================================

const GetSubmissionsByAssignment = async (call, callback) => {
  try {
    const { assignmentId, teacherId } = call.request;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: { select: { teacherId: true } },
        class: { select: { lecturerId: true } },
      },
    });

    if (!assignment) {
      return callback({ code: grpc.status.NOT_FOUND, details: 'Tugas tidak ditemukan' });
    }

    if (!hasTeacherAccess(assignment, teacherId)) {
      return callback({ code: grpc.status.PERMISSION_DENIED, details: 'Akses ditolak' });
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: { student: { select: { id: true, name: true } } },
      orderBy: { submittedAt: 'desc' },
    });

    const data = submissions.map(sub => ({
      id: sub.id,
      submittedAt: sub.submittedAt.toISOString(),
      fileUrl: sub.fileUrl || '',
      note: sub.note || '',
      grade: sub.grade || 0,
      student: sub.student,
    }));

    callback(null, { message: 'Daftar submission berhasil diambil', data });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

const GradeSubmission = async (call, callback) => {
  try {
    const { submissionId, teacherId, grade, feedback } = call.request;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            course: { select: { teacherId: true } },
            class: { select: { lecturerId: true } },
          },
        },
      },
    });

    if (!submission) {
      return callback({ code: grpc.status.NOT_FOUND, details: 'Submission tidak ditemukan' });
    }

    if (!hasTeacherAccess(submission.assignment, teacherId)) {
      return callback({ code: grpc.status.PERMISSION_DENIED, details: 'Akses ditolak: Ini bukan kelas Anda' });
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: { grade, feedback },
      select: { id: true, grade: true, feedback: true, studentId: true },
    });

    callback(null, {
      message: 'Berhasil memberikan nilai',
      data: {
        ...updated,
        grade: updated.grade || 0,
        feedback: updated.feedback || '',
      },
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

const GetTeacherDashboardStats = async (call, callback) => {
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

    // 3. Statistik submission
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [pendingGrading, recentSubmissionsCount] = await Promise.all([
      prisma.submission.count({
        where: {
          assignment: { OR: [{ classId: { in: classIds } }, { courseId: { in: courseIds } }] },
          grade: null,
        },
      }),
      prisma.submission.count({
        where: {
          assignment: { OR: [{ classId: { in: classIds } }, { courseId: { in: courseIds } }] },
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
        recentSubmissions: recentSubmissionsCount,
      },
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

const GetRecentSubmissionsForTeacher = async (call, callback) => {
  try {
    const { teacherId, limit } = call.request;

    const submissions = await prisma.submission.findMany({
      where: {
        assignment: {
          OR: [{ class: { lecturerId: teacherId } }, { course: { teacherId } }],
        },
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        assignment: {
          include: { course: { select: { id: true, title: true, code: true } } },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: limit > 0 ? limit : 10,
    });

    const data = submissions.map(sub => ({
      id: sub.id,
      studentName: sub.student.name,
      studentEmail: sub.student.email,
      assignmentId: sub.assignment.id,
      assignmentTitle: sub.assignment.title,
      classId: sub.assignment.classId,
      courseId: sub.assignment.course.id,
      courseName: sub.assignment.course.title,
      courseCode: sub.assignment.course.code,
      submittedAt: sub.submittedAt.toISOString(),
      isGraded: sub.grade !== null,
      grade: sub.grade || 0,
    }));

    callback(null, { message: 'Daftar submission terbaru berhasil diambil', data });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

// =============================================================================
// EXPORT SERVICE
// =============================================================================

export const submissionService = {
  SubmitAssignment,
  GetAssignmentWithMySubmission,
  GetSubmissionsByAssignment,
  GetAllMyGrades,
  GetMyDashboardStats,
  GradeSubmission,
  GetTeacherDashboardStats,
  GetRecentSubmissionsForTeacher,
};

export default submissionService;
