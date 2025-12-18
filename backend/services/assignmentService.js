import { prisma } from '../config/prisma.js';

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

  return prisma.submission.create({
    data: {
      assignmentId,
      studentId,
      fileUrl: data.fileUrl,
      note: data.note,
    },
    // SAFE PROJECTION ✅
    select: {
      id: true,
      submittedAt: true,
      fileUrl: true,
    },
  });
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
      fileUrl: true,
      note: true,
      submittedAt: true,
      grade: true, // Biar dosen tau mana yang belum dinilai
      feedback: true,
      student: {
        // JOIN ke tabel User
        select: {
          id: true,
          name: true,
          email: true,
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

export { createAssignment, submitAssignment, getAssignmentDetail, getSubmissionsByAssignment, gradeSubmission };
