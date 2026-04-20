import prisma from '../../config/prisma.js';
import { AppError } from '../../config/errors.js';

// ======= GET ASSIGNMENTS BY COURSE (WITH SUBMISSION STATUS) =======
const getAssignmentsByCourse = async (courseId, userId, userRole) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AppError(404, 'Kelas tidak ditemukan');
  }

  if (userRole === 'MAHASISWA') {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      throw new AppError(403, 'Anda belum terdaftar di kelas ini');
    }
  }

  const assignments = await prisma.assignment.findMany({
    where: { courseId },
    select: {
      id: true,
      title: true,
      dueDate: true,
      submissions: {
        where: {
          studentId: userId,
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      dueDate: 'asc',
    },
  });

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

// ======= CREATE ASSIGNMENT =======
const createAssignment = async (courseId, teacherId, data) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    throw new AppError(404, 'Kelas tidak ditemukan');
  }

  if (course.teacherId !== teacherId) {
    throw new AppError(403, 'Akses ditolak');
  }

  return prisma.assignment.create({
    data: {
      title: data.title,
      description: data.description,
      dueDate: new Date(data.dueDate),
      courseId,
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      courseId: true,
    },
  });
};

// ======= GET ASSIGNMENT DETAIL =======
const getAssignmentDetail = async assignmentId => {
  return prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
    },
  });
};

// ======= UPDATE ASSIGNMENT =======
const updateAssignment = async (assignmentId, userId, userRole, data) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      course: {
        select: {
          id: true,
          teacherId: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new AppError(404, 'Tugas tidak ditemukan');
  }

  if (userRole === 'DOSEN' && assignment.course.teacherId !== userId) {
    throw new AppError(403, 'Akses ditolak: Ini bukan tugas dari kelas Anda');
  }

  if (userRole === 'MAHASISWA') {
    throw new AppError(403, 'Akses ditolak: Mahasiswa tidak dapat mengedit tugas');
  }

  return prisma.assignment.update({
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

// ======= DELETE ASSIGNMENT =======
const deleteAssignment = async (assignmentId, userId, userRole) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
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
    throw new AppError(404, 'Tugas tidak ditemukan');
  }

  if (userRole === 'DOSEN' && assignment.course.teacherId !== userId) {
    throw new AppError(403, 'Akses ditolak: Ini bukan tugas dari kelas Anda');
  }

  if (userRole === 'MAHASISWA') {
    throw new AppError(403, 'Akses ditolak: Mahasiswa tidak dapat menghapus tugas');
  }

  await prisma.assignment.delete({
    where: { id: assignmentId },
  });

  return {
    message: 'Tugas berhasil dihapus',
    deletedSubmissions: assignment._count.submissions,
  };
};

export {
  getAssignmentsByCourse,
  createAssignment,
  getAssignmentDetail,
  updateAssignment,
  deleteAssignment,
};
