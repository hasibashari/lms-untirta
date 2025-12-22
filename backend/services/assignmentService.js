import { id } from 'zod/v4/locales';
import { prisma } from '../config/prisma.js';
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

  // * Cek Deadline (Logic Bisnis Penting!)
  if (new Date() > assignment.dueDate) {
    throw new Error('Maaf, batas waktu pengumpulan sudah habis');
  }

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

// 5. Dosen memberi nilai
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

export {
  createAssignment,
  submitAssignment,
  getAssignmentDetail,
  getAssignmentsByCourse,
  getAssignmentWithMySubmission,
  getSubmissionsByAssignment,
  gradeSubmission,
};
