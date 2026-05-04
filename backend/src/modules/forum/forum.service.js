import prisma from '../../config/prisma.js';
import { AppError } from '../../config/errors.js';

// Service layer untuk forum diskusi. Mengandung logika bisnis:
// - Validasi akses (enrollment check untuk mahasiswa)
// - CRUD thread dan reply
// - Pin/unpin thread (hanya dosen/admin)
// - Moderasi: dosen/admin bisa hapus thread/reply manapun

// =====================
// HELPER: Validasi Akses Course
// =====================

/**
 * Validasi bahwa user memiliki akses ke forum course.
 * - ADMIN: selalu boleh
 * - DOSEN: harus mengajar course tersebut
 * - MAHASISWA: harus terdaftar (enrolled) di course tersebut
 */
const validateCourseAccess = async (courseId, userId, userRole) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, teacherId: true },
  });

  if (!course) {
    throw new AppError(404, 'Mata kuliah tidak ditemukan');
  }

  if (userRole === 'DOSEN' && course.teacherId !== userId) {
    throw new AppError(403, 'Akses ditolak: Ini bukan mata kuliah Anda');
  }

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
      throw new AppError(403, 'Anda belum terdaftar di mata kuliah ini');
    }
  }

  return course;
};

// =====================
// THREAD OPERATIONS
// =====================

/**
 * Ambil daftar thread di suatu course.
 * Pinned threads muncul pertama, lalu diurutkan berdasarkan aktivitas terbaru.
 * Setiap thread menyertakan jumlah reply dan info author.
 */
const getThreads = async (courseId, userId, userRole) => {
  await validateCourseAccess(courseId, userId, userRole);

  return await prisma.forumThread.findMany({
    where: { courseId },
    select: {
      id: true,
      title: true,
      content: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      _count: {
        select: { replies: true },
      },
    },
    orderBy: [
      { isPinned: 'desc' },   // Pinned di atas
      { updatedAt: 'desc' },   // Terbaru di atas
    ],
  });
};

/**
 * Ambil detail thread beserta semua reply.
 * Reply diurutkan dari yang terlama (chronological).
 */
const getThreadById = async (threadId, userId, userRole) => {
  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      title: true,
      content: true,
      isPinned: true,
      courseId: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
          teacherId: true,
        },
      },
      replies: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          parentId: true,
          author: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' }, // Chronological
      },
    },
  });

  if (!thread) {
    throw new AppError(404, 'Thread diskusi tidak ditemukan');
  }

  // Validasi akses ke course
  await validateCourseAccess(thread.courseId, userId, userRole);

  return thread;
};

/**
 * Buat thread baru di forum course.
 * Semua user yang punya akses ke course bisa membuat thread.
 */
const createThread = async (courseId, userId, data) => {
  // Validasi akses dilakukan oleh controller melalui route
  return await prisma.forumThread.create({
    data: {
      title: data.title,
      content: data.content,
      courseId: courseId,
      authorId: userId,
    },
    select: {
      id: true,
      title: true,
      content: true,
      isPinned: true,
      courseId: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });
};

/**
 * Update thread. Hanya pemilik thread yang boleh mengedit.
 */
const updateThread = async (threadId, userId, userRole, data) => {
  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    select: { id: true, authorId: true },
  });

  if (!thread) {
    throw new AppError(404, 'Thread diskusi tidak ditemukan');
  }

  if (thread.authorId !== userId) {
    throw new AppError(403, 'Akses ditolak: Anda hanya bisa mengedit thread Anda sendiri');
  }

  return await prisma.forumThread.update({
    where: { id: threadId },
    data: {
      title: data.title,
      content: data.content,
    },
    select: {
      id: true,
      title: true,
      content: true,
      isPinned: true,
      courseId: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });
};

/**
 * Hapus thread. Pemilik bisa hapus thread sendiri.
 * Dosen/Admin bisa hapus thread manapun (moderasi).
 */
const deleteThread = async (threadId, userId, userRole) => {
  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      authorId: true,
      course: {
        select: { teacherId: true },
      },
    },
  });

  if (!thread) {
    throw new AppError(404, 'Thread diskusi tidak ditemukan');
  }

  // Cek otorisasi: owner, dosen pengampu course, atau admin
  const isOwner = thread.authorId === userId;
  const isCourseTeacher = userRole === 'DOSEN' && thread.course.teacherId === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isOwner && !isCourseTeacher && !isAdmin) {
    throw new AppError(403, 'Akses ditolak: Anda tidak memiliki izin untuk menghapus thread ini');
  }

  await prisma.forumThread.delete({ where: { id: threadId } });

  return { message: 'Thread diskusi berhasil dihapus' };
};

/**
 * Toggle pin/unpin thread. Hanya dosen pengampu atau admin yang boleh.
 */
const togglePinThread = async (threadId, userId, userRole) => {
  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      isPinned: true,
      course: {
        select: { teacherId: true },
      },
    },
  });

  if (!thread) {
    throw new AppError(404, 'Thread diskusi tidak ditemukan');
  }

  // Hanya dosen pengampu atau admin yang bisa pin/unpin
  const isCourseTeacher = userRole === 'DOSEN' && thread.course.teacherId === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isCourseTeacher && !isAdmin) {
    throw new AppError(403, 'Akses ditolak: Hanya dosen pengampu yang bisa pin/unpin thread');
  }

  return await prisma.forumThread.update({
    where: { id: threadId },
    data: { isPinned: !thread.isPinned },
    select: {
      id: true,
      isPinned: true,
    },
  });
};

// =====================
// REPLY OPERATIONS
// =====================

/**
 * Buat reply baru di thread.
 * Semua user yang punya akses ke course bisa membalas.
 * Update timestamp thread agar sorting "terbaru" tetap akurat.
 */
const createReply = async (threadId, userId, data) => {
  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    select: { id: true, courseId: true },
  });

  if (!thread) {
    throw new AppError(404, 'Thread diskusi tidak ditemukan');
  }

  // Buat reply dan update timestamp thread secara atomik
  const [reply] = await prisma.$transaction([
    prisma.forumReply.create({
      data: {
        content: data.content,
        threadId: threadId,
        authorId: userId,
        parentId: data.parentId || null, // Dukungan untuk nested reply
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        parentId: true, // Sertakan parentId di respon
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    }),
    // Bump thread updatedAt agar thread yang baru dibalas naik ke atas
    prisma.forumThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return reply;
};

/**
 * Update reply. Hanya pemilik reply yang boleh mengedit.
 */
const updateReply = async (replyId, userId, userRole, data) => {
  const reply = await prisma.forumReply.findUnique({
    where: { id: replyId },
    select: { id: true, authorId: true },
  });

  if (!reply) {
    throw new AppError(404, 'Balasan tidak ditemukan');
  }

  if (reply.authorId !== userId) {
    throw new AppError(403, 'Akses ditolak: Anda hanya bisa mengedit balasan Anda sendiri');
  }

  return await prisma.forumReply.update({
    where: { id: replyId },
    data: { content: data.content },
    select: {
      id: true,
      content: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });
};

/**
 * Hapus reply. Pemilik bisa hapus reply sendiri.
 * Dosen pengampu atau admin bisa hapus reply manapun (moderasi).
 */
const deleteReply = async (replyId, userId, userRole) => {
  const reply = await prisma.forumReply.findUnique({
    where: { id: replyId },
    select: {
      id: true,
      authorId: true,
      thread: {
        select: {
          course: {
            select: { teacherId: true },
          },
        },
      },
    },
  });

  if (!reply) {
    throw new AppError(404, 'Balasan tidak ditemukan');
  }

  const isOwner = reply.authorId === userId;
  const isCourseTeacher = userRole === 'DOSEN' && reply.thread.course.teacherId === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isOwner && !isCourseTeacher && !isAdmin) {
    throw new AppError(403, 'Akses ditolak: Anda tidak memiliki izin untuk menghapus balasan ini');
  }

  await prisma.forumReply.delete({ where: { id: replyId } });

  return { message: 'Balasan berhasil dihapus' };
};

export {
  getThreads,
  getThreadById,
  createThread,
  updateThread,
  deleteThread,
  togglePinThread,
  createReply,
  updateReply,
  deleteReply,
};
