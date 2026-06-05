import prisma from '../../config/prisma.js';
import { AppError } from '../../config/errors.js';
import cache from '../../utils/cache.js';

// ======= GET ASSIGNMENTS BY CLASS (WITH SUBMISSION STATUS) =======
export const getAssignmentsByClass = async (id, userId, userRole) => {
  // 1. Cari berdasarkan Class ID
  let classOffering = await prisma.class.findUnique({
    where: { id: id },
  });

  let whereClause;
  let targetCourseId;

  if (classOffering) {
    whereClause = { classId: id };
    targetCourseId = classOffering.courseId;
  } else {
    // 2. Fallback: Cari berdasarkan Course ID jika Class ID tidak ditemukan
    const course = await prisma.course.findUnique({
      where: { id: id },
    });

    if (!course) {
      throw new AppError(404, 'Kelas atau Mata Kuliah tidak ditemukan');
    }

    whereClause = { courseId: id };
    targetCourseId = id;
  }

  // 3. Validasi akses (Enrollment check)
  if (userRole === 'MAHASISWA') {
    const enrollment = await prisma.krsEnrollment.findFirst({
      where: {
        studentId: userId,
        class: { courseId: targetCourseId },
        status: 'APPROVED',
      },
    });

    if (!enrollment) {
      throw new AppError(403, 'Anda belum terdaftar di mata kuliah ini');
    }
  }

  const assignments = await prisma.assignment.findMany({
    where: whereClause,
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
          grade: true,
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
      status: mySubmission
        ? mySubmission.grade !== null
          ? 'graded'
          : 'submitted'
        : now > assignment.dueDate
          ? 'overdue'
          : 'pending',
      grade: mySubmission ? mySubmission.grade : null,
    };
  });
};

// ======= CREATE ASSIGNMENT =======
export const createAssignment = async (classId, teacherId, data) => {
  const classOffering = await prisma.class.findUnique({ where: { id: classId } });
  const course = await prisma.course.findUnique({ where: { id: classId } });

  if (!classOffering && !course) {
    throw new AppError(404, 'Kelas/Mata Kuliah tidak ditemukan');
  }

  if (classOffering && classOffering.lecturerId !== teacherId) {
    throw new AppError(403, 'Akses ditolak: Anda bukan dosen pengampu kelas ini');
  }
  if (!classOffering && course && course.teacherId !== teacherId) {
    throw new AppError(403, 'Akses ditolak: Anda bukan dosen pengampu mata kuliah ini');
  }

  const newAssignment = await prisma.assignment.create({
    data: {
      title: data.title,
      description: data.description,
      dueDate: new Date(data.dueDate),
      classId: classOffering ? classOffering.id : null,
      courseId: classOffering ? classOffering.courseId : course.id,
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      classId: true,
      courseId: true,
    },
  });

  return newAssignment;
};

// ======= GET ASSIGNMENT DETAIL =======
export const getAssignmentDetail = async assignmentId => {
  return await cache.getOrSet(`assignment:detail:${assignmentId}`, async () => {
    return await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
      },
    });
  }, 3600);
};

// ======= UPDATE ASSIGNMENT =======
export const updateAssignment = async (assignmentId, userId, userRole, data) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      classId: true,
      courseId: true,
      class: {
        select: {
          id: true,
          lecturerId: true,
        },
      },
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

  if (userRole === 'DOSEN' && (assignment.class?.lecturerId !== userId && assignment.course.teacherId !== userId)) {
    throw new AppError(403, 'Akses ditolak: Ini bukan tugas dari kelas Anda');
  }

  if (userRole === 'MAHASISWA') {
    throw new AppError(403, 'Akses ditolak: Mahasiswa tidak dapat mengedit tugas');
  }

  const updated = await prisma.assignment.update({
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

  // Invalidate cache
  await cache.invalidate(`assignment:detail:${assignmentId}`);

  return updated;
};

// ======= DELETE ASSIGNMENT =======
export const deleteAssignment = async (assignmentId, userId, userRole) => {
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
      class: {
        select: {
          id: true,
          lecturerId: true,
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

  if (userRole === 'DOSEN' && (assignment.class?.lecturerId !== userId && assignment.course.teacherId !== userId)) {
    throw new AppError(403, 'Akses ditolak: Ini bukan tugas dari kelas Anda');
  }

  if (userRole === 'MAHASISWA') {
    throw new AppError(403, 'Akses ditolak: Mahasiswa tidak dapat menghapus tugas');
  }

  await prisma.assignment.delete({
    where: { id: assignmentId },
  });

  // Invalidate cache
  await cache.invalidate(`assignment:detail:${assignmentId}`);

  return {
    message: 'Tugas berhasil dihapus',
    deletedSubmissions: assignment._count.submissions,
  };
};


