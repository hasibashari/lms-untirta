import { id } from 'zod/v4/locales';
import prisma from '../config/prisma.js';
import { grade } from '../controllers/assignmentController.js';

// 1. Dosen Membuat Tugas
const createAssignment = async (courseId, teacherId, data) => {
  // Cek kepemilikan kelas
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    throw new Error('Kelas tidak ditemukan');
  }

  if (course.teacherId !== teacherId) {
    throw new Error('Akses ditolak');
  }

  return prisma.assignment.create({
    data: {
      title: data.title,
      description: data.description,
      dueDate: new Date(data.dueDate), // Konversi String ke Date Object
      courseId,
    },
    // SAFE PROJECTION ✅
    select: {
      id: true,
      title: true,
      dueDate: true,
      courseId: true,
    },
  });
};

// 2. Mahasiswa Submit Tugas
const submitAssignment = async (assignmentId, studentId, data) => {
  // Cek validitas Tugas
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });

  if (!assignment) {
    throw new Error('Tugas tidak ditemukan');
  }

  // TODO Cek apakah mahasiswa terdaftar di kelas tsb? (Skip dulu biar ringkas, tapi idealnya dicek)

  // * Cek Deadline - Tetap izinkan submit tapi tandai sebagai terlambat
  const isLate = new Date() > assignment.dueDate;

  // Cek apakah sudah pernah submit?
  const existingSubmission = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId,
      },
    },
  });

  if (existingSubmission) {
    throw new Error('Anda sudah mengumpulkan tugas ini');
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
    isLate, // Informasi apakah terlambat
  };
};

// 3. Get Assignment Detail (Dosen & Mahasiswa)
const getAssignmentDetail = async assignmentId => {
  return await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      // Kita tidak load submissions di sini agar ringan
    },
  });
};

// 3.1 Get Assignments by Course (Mahasiswa & Dosen)
const getAssignmentsByCourse = async (courseId, userId, userRole) => {
  // 1. Validasi: Pastikan Course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Kelas tidak ditemukan');
  }

  // 2. Authorization: Mahasiswa harus terdaftar di kelas
  if (userRole === 'MAHASISWA') {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        },
      },
    });

    if (!enrollment) {
      throw new Error('Anda belum terdaftar di kelas ini');
    }
  }

  // 3. Ambil daftar assignments
  const assignments = await prisma.assignment.findMany({
    where: { courseId },
    select: {
      id: true,
      title: true,
      dueDate: true,
      submissions: {
        where: {
          studentId: userId, // Cek submission milik mahasiswa ini
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      dueDate: 'asc', // Urutkan dari deadline paling dekat
    },
  });

  // 4. Transform data untuk menambahkan status deadline
  const now = new Date();

  return assignments.map(assignment => {
    const mySubmission = assignment.submissions[0] || null;

    return {
      id: assignment.id,
      title: assignment.title,
      dueDate: assignment.dueDate,
      status: mySubmission ? 'submitted' : now > assignment.dueDate ? 'overdue' : 'pending',
    };
  });
};

// 3.2 Get Assignment Detail with Student Submission Status
const getAssignmentWithMySubmission = async (assignmentId, studentId) => {
  // 1. Ambil detail assignment
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
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
    throw new Error('Tugas tidak ditemukan');
  }

  // 2. Cek apakah mahasiswa terdaftar di kelas
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: studentId,
        courseId: assignment.courseId,
      },
    },
  });

  if (!enrollment) {
    throw new Error('Anda belum terdaftar di kelas ini');
  }

  // 3. Cari submission mahasiswa ini (jika ada)
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

  // 4. Return data lengkap
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

// 4. Dosen melihat daftar pengumpulan tugas
const getSubmissionsByAssignment = async (assignmentId, teacherId) => {
  // Validasi: Pastikan tugas ini milik dosen tersebut
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: true }, // Kita butuh data course untuk cek teacherId
  });
  if (!assignment) {
    throw new Error('Tugas tidak ditemukan');
  }
  if (assignment.course.teacherId !== teacherId) {
    throw new Error('Akses ditolak');
  }
  // Ambil submission beserta nama mahasiswany
  return await prisma.submission.findMany({
    where: { assignmentId },
    select: {
      id: true,
      submittedAt: true,
      fileUrl: true,
      note: true,
      grade: true, // Biar dosen tau mana yang belum dinilai
      student: {
        // JOIN ke tabel User
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });
};

// 5. Get All Grades for Student (Mahasiswa melihat semua nilai)
const getAllMyGrades = async (studentId) => {
  // Ambil semua enrollment mahasiswa
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: studentId },
    include: {
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

  // Transform data
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

// 6. Get Dashboard Stats for Student
const getMyDashboardStats = async (studentId) => {
  // Ambil semua enrollment dengan assignments
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: studentId },
    include: {
      course: {
        include: {
          assignments: {
            include: {
              submissions: {
                where: { studentId },
                select: { id: true, grade: true },
              },
            },
          },
        },
      },
    },
  });

  let totalAssignments = 0;
  let pendingAssignments = 0;
  let gradedAssignments = 0;
  const now = new Date();

  for (const enrollment of enrollments) {
    for (const assignment of enrollment.course.assignments) {
      totalAssignments++;
      const submission = assignment.submissions[0];

      if (!submission) {
        // Belum dikumpulkan
        if (now <= assignment.dueDate) {
          pendingAssignments++;
        }
      } else if (submission.grade !== null) {
        gradedAssignments++;
      }
    }
  }

  return {
    totalCourses: enrollments.length,
    totalAssignments,
    pendingAssignments,
    gradedAssignments,
  };
};

// 7. Dosen memberi nilai
const gradeSubmission = async (submissionId, teacherId, data) => {
  // Validasi Kepemilikan (Sedikit kompleks karena harus naik 2 level: Submission -> Assignment -> Course -> Teacher)
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: { course: true },
      },
    },
  });

  if (!submission) {
    throw new Error('Submission tidak ditemukan');
  }
  // Cek apakah user yang request adalah Dosen pemilik kelas
  if (submission.assignment.course.teacherId !== teacherId) {
    throw new Error('Akses ditolak: Ini bukan kelas Anda');
  }

  // Update Nilai
  return await prisma.submission.update({
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

// 8. Get Dashboard Stats for Teacher (Dosen)
const getTeacherDashboardStats = async (teacherId) => {
  // Ambil semua courses milik dosen
  const courses = await prisma.course.findMany({
    where: { teacherId },
    include: {
      students: {
        select: { id: true },
      },
      materials: {
        select: { id: true },
      },
      assignments: {
        include: {
          submissions: {
            select: {
              id: true,
              grade: true,
              submittedAt: true,
            },
          },
        },
      },
    },
  });

  let totalStudents = 0;
  let totalMaterials = 0;
  let totalAssignments = 0;
  let pendingGrading = 0; // Submissions yang belum dinilai
  let recentSubmissions = 0; // Submissions dalam 7 hari terakhir

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  for (const course of courses) {
    totalStudents += course.students.length;
    totalMaterials += course.materials.length;
    totalAssignments += course.assignments.length;

    for (const assignment of course.assignments) {
      for (const submission of assignment.submissions) {
        // Hitung yang belum dinilai
        if (submission.grade === null) {
          pendingGrading++;
        }
        // Hitung submissions terbaru (7 hari terakhir)
        if (new Date(submission.submittedAt) > sevenDaysAgo) {
          recentSubmissions++;
        }
      }
    }
  }

  return {
    totalCourses: courses.length,
    totalStudents,
    totalMaterials,
    totalAssignments,
    pendingGrading,
    recentSubmissions,
  };
};

// 9. Get Recent Submissions for Teacher (untuk notifikasi)
const getRecentSubmissionsForTeacher = async (teacherId, limit = 10) => {
  // Ambil submissions terbaru dari semua kelas dosen
  const submissions = await prisma.submission.findMany({
    where: {
      assignment: {
        course: {
          teacherId,
        },
      },
    },
    include: {
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

/**
 * Update Assignment - Memperbarui data tugas yang sudah ada
 * Hanya Dosen pemilik kelas yang bisa mengupdate
 */
const updateAssignment = async (assignmentId, userId, userRole, data) => {
  // 1. Cari assignment beserta informasi course-nya
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: {
        select: {
          id: true,
          teacherId: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new Error('Tugas tidak ditemukan');
  }

  // 2. Authorization: Hanya Dosen pemilik atau Admin
  if (userRole === 'DOSEN' && assignment.course.teacherId !== userId) {
    throw new Error('Akses ditolak: Ini bukan tugas dari kelas Anda');
  }

  if (userRole === 'MAHASISWA') {
    throw new Error('Akses ditolak: Mahasiswa tidak dapat mengedit tugas');
  }

  // 3. Update Assignment
  return await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      courseId: true,
      updatedAt: true,
    },
  });
};

/**
 * Delete Assignment - Menghapus tugas dari database
 * Hanya Dosen pemilik kelas yang bisa menghapus
 * CATATAN: Ini juga akan menghapus semua submission terkait (cascade)
 */
const deleteAssignment = async (assignmentId, userId, userRole) => {
  // 1. Cari assignment beserta informasi course-nya
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: {
        select: {
          id: true,
          teacherId: true,
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new Error('Tugas tidak ditemukan');
  }

  // 2. Authorization: Hanya Dosen pemilik atau Admin
  if (userRole === 'DOSEN' && assignment.course.teacherId !== userId) {
    throw new Error('Akses ditolak: Ini bukan tugas dari kelas Anda');
  }

  if (userRole === 'MAHASISWA') {
    throw new Error('Akses ditolak: Mahasiswa tidak dapat menghapus tugas');
  }

  // 3. Delete Assignment (submissions akan cascade delete)
  await prisma.assignment.delete({
    where: { id: assignmentId },
  });

  return {
    message: 'Tugas berhasil dihapus',
    deletedSubmissions: assignment._count.submissions,
  };
};

export {
  createAssignment,
  submitAssignment,
  getAssignmentDetail,
  getAssignmentsByCourse,
  getAssignmentWithMySubmission,
  getSubmissionsByAssignment,
  getAllMyGrades,
  getMyDashboardStats,
  getTeacherDashboardStats,
  getRecentSubmissionsForTeacher,
  gradeSubmission,
  updateAssignment,
  deleteAssignment,
};
