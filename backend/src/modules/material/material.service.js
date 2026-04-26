import prisma from '../../config/prisma.js';
import { cleanupFile } from '../../services/upload.service.js';
import { AppError } from '../../config/errors.js';
import path from 'path';

// Service layer untuk materi. Mengandung logika bisnis seperti:
// - Validasi kepemilikan/otorisasi
// - Auto-ordering ketika menambah materi
// - Operasi database melalui Prisma
// - Cleanup file yang terkait saat materi dihapus

const createMaterial = async (courseId, teacherId, data) => {
  // 1. Cek apakah kelas ada
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AppError(404, 'Kelas tidak ditemukan');
  }

  // 2. Validasi kepemilikan: hanya dosen pemilik (atau admin di luar fungsi ini)
  if (course.teacherId !== teacherId) {
    throw new AppError(403, 'Akses ditolak: Ini bukan kelas Anda');
  }

  // 3. AUTO-ORDERING: tentukan urutan materi berikutnya di kelas ini
  const lastMaterial = await prisma.material.findFirst({
    where: { courseId: courseId },
    orderBy: { order: 'desc' }, // ambil materi dengan order terbesar
  });

  const newOrder = lastMaterial ? lastMaterial.order + 1 : 1;

  // 4. Simpan materi ke DB dan kembalikan field penting saja
  return await prisma.material.create({
    data: {
      title: data.title,
      content: data.content,
      fileUrl: data.fileUrl,
      videoUrl: data.videoUrl,
      order: newOrder,
      courseId: courseId,
    },
    select: {
      id: true,
      title: true,
      content: true,
      fileUrl: true,
      videoUrl: true,
      order: true,
      isPublished: true,
      courseId: true,
      createdAt: true,
    },
  });
};

const getMaterials = async (courseId, userId, userRole) => {
  // Jika mahasiswa, pastikan sudah terdaftar di kelas
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
      throw new AppError(403, 'Anda belum terdaftar di kelas ini');
    }
  }

  // Ambil daftar materi, terurut berdasarkan 'order' (naik)
  return await prisma.material.findMany({
    where: { courseId },
    select: {
      id: true,
      title: true,
      order: true,
    },
    orderBy: {
      order: 'asc',
    },
  });
};

const getMaterialById = async (materialId, userId, userRole) => {
  // Ambil materi beserta info course untuk keperluan otorisasi
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: {
      id: true,
      title: true,
      content: true,
      fileUrl: true,
      videoUrl: true,
      course: {
        select: {
          id: true,
          title: true,
          teacherId: true,
        },
      },
    },
  });

  if (!material) {
    throw new AppError(404, 'Materi tidak ditemukan');
  }

  // Otorisasi: dosen pemilik atau admin boleh, mahasiswa harus terdaftar
  if (userRole === 'DOSEN' && material.course.teacherId !== userId) {
    throw new AppError(403, 'Akses ditolak: Ini bukan materi dari kelas Anda');
  }

  if (userRole === 'MAHASISWA') {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: material.course.id,
        },
      },
    });

    if (!enrollment) {
      throw new AppError(403, 'Anda belum terdaftar di kelas ini');
    }
  }

  // Susun daftar attachment jika ada file/video
  const attachments = [];
  if (material.fileUrl) attachments.push({ type: 'pdf', url: material.fileUrl });
  if (material.videoUrl) attachments.push({ type: 'video', url: material.videoUrl });

  return {
    id: material.id,
    title: material.title,
    content: material.content,
    attachments,
  };
};

const updateMaterial = async (materialId, userId, userRole, data) => {
  // Ambil material untuk validasi eksistensi dan otorisasi
  const material = await prisma.material.findUnique({
    where: { id: materialId },
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

  if (!material) {
    throw new AppError(404, 'Materi tidak ditemukan');
  }

  // Hanya dosen pemilik atau admin yang boleh mengedit
  if (userRole === 'DOSEN' && material.course.teacherId !== userId) {
    throw new AppError(403, 'Akses ditolak: Ini bukan materi dari kelas Anda');
  }

  if (userRole === 'MAHASISWA') {
    throw new AppError(403, 'Akses ditolak: Mahasiswa tidak dapat mengedit materi');
  }

  // Lakukan update dan kembalikan field yang relevan
  return await prisma.material.update({
    where: { id: materialId },
    data: {
      title: data.title,
      content: data.content,
      fileUrl: data.fileUrl,
      videoUrl: data.videoUrl,
      order: data.order,
    },
    select: {
      id: true,
      title: true,
      content: true,
      fileUrl: true,
      videoUrl: true,
      order: true,
      isPublished: true,
      courseId: true,
      updatedAt: true,
    },
  });
};

const deleteMaterial = async (materialId, userId, userRole) => {
  // Ambil metadata materi untuk validasi dan cleanup file
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: {
      id: true,
      fileUrl: true,
      course: {
        select: {
          id: true,
          teacherId: true,
        },
      },
    },
  });

  if (!material) {
    throw new AppError(404, 'Materi tidak ditemukan');
  }

  // Otorisasi penghapusan
  if (userRole === 'DOSEN' && material.course.teacherId !== userId) {
    throw new AppError(403, 'Akses ditolak: Ini bukan materi dari kelas Anda');
  }

  if (userRole === 'MAHASISWA') {
    throw new AppError(403, 'Akses ditolak: Mahasiswa tidak dapat menghapus materi');
  }

  // Hapus record materi
  await prisma.material.delete({ where: { id: materialId } });

  // Jika ada file terkait, hapus file fisik secara asinkron (jangan blokir response)
  if (material.fileUrl) {
    const filename = path.basename(new URL(material.fileUrl).pathname);
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    cleanupFile(filePath).catch(() => { });
  }

  return { message: 'Materi berhasil dihapus' };
};

export { createMaterial, getMaterials, getMaterialById, updateMaterial, deleteMaterial };
