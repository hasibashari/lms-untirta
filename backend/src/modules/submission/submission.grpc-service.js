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

export const SubmitAssignment = async (call, callback) => {
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

export const GetAssignmentWithMySubmission = async (call, callback) => {
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
        grade: mySubmission?.grade ?? -1,
        feedback: mySubmission?.feedback || '',
      },
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GetAllMyGrades = async (call, callback) => {
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
          grade: submission?.grade ?? -1,
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

// =============================================================================
// HANDLERS — TEACHER SIDE
// =============================================================================

export const GetSubmissionsByAssignment = async (call, callback) => {
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

    // Ambil semua mahasiswa yang terdaftar di kelas ini
    const enrollments = await prisma.krsEnrollment.findMany({
      where: { classId: assignment.classId, status: 'APPROVED' },
      include: { student: { select: { id: true, name: true, email: true } } },
    });

    // Ambil semua submission untuk tugas ini
    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: { student: { select: { id: true, name: true, email: true } } },
    });

    // Buat map submission berdasarkan studentId untuk lookup cepat
    const submissionMap = new Map(submissions.map(sub => [sub.studentId, sub]));

    // Gabungkan semua mahasiswa terdaftar dengan data submission mereka
    const data = enrollments.map(enrollment => {
      const student = enrollment.student;
      const sub = submissionMap.get(student.id);

      if (sub) {
        return {
          id: sub.id,
          submittedAt: sub.submittedAt.toISOString(),
          fileUrl: sub.fileUrl || '',
          note: sub.note || '',
          // Gunakan -1 sebagai sentinel 'belum dinilai' karena proto3 int32 tidak bisa null
          grade: sub.grade !== null ? sub.grade : -1,
          feedback: sub.feedback || '',
          student: { id: student.id, name: student.name, email: student.email },
        };
      } else {
        // Mahasiswa belum submit
        return {
          id: `not-submitted-${student.id}`,
          submittedAt: '',
          fileUrl: '',
          note: '',
          grade: -1,
          feedback: '',
          student: { id: student.id, name: student.name, email: student.email },
        };
      }
    });

    // Urutkan: yang sudah submit duluan, kemudian yang belum
    data.sort((a, b) => {
      if (a.submittedAt && !b.submittedAt) return -1;
      if (!a.submittedAt && b.submittedAt) return 1;
      if (a.submittedAt && b.submittedAt) return new Date(b.submittedAt) - new Date(a.submittedAt);
      return 0;
    });

    callback(null, { message: 'Daftar submission berhasil diambil', data });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GradeSubmission = async (call, callback) => {
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
        grade: updated.grade ?? -1,
        feedback: updated.feedback || '',
      },
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GetRecentSubmissionsForTeacher = async (call, callback) => {
  try {
    const { teacherId, limit } = call.request;

    const submissions = await prisma.submission.findMany({
      where: {
        assignment: {
          class: { lecturerId: teacherId },
        },
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        assignment: {
          include: { 
            course: { select: { id: true, title: true, code: true } },
            class: { select: { id: true, section: true } }
          },
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
      classId: sub.assignment.class?.id || '',
      classSection: sub.assignment.class?.section || '',
      courseId: sub.assignment.course.id,
      courseName: sub.assignment.course.title,
      courseCode: sub.assignment.course.code,
      submittedAt: sub.submittedAt.toISOString(),
      isGraded: sub.grade !== null,
      grade: sub.grade ?? -1,
    }));

    callback(null, { message: 'Daftar submission terbaru berhasil diambil', data });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};
