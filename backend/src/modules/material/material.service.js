import prisma from '../../config/prisma.js';
import { cleanupFile } from '../../services/upload.service.js';
import { AppError } from '../../config/errors.js';
import cache from '../../utils/cache.js';
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
  const result = await prisma.material.create({
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

  // 5. Invalidate cache list materi kelas
  await cache.invalidate(`materials:list:${courseId}`);

  return result;
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
  // Cache key include courseId
  return await cache.getOrSet(`materials:list:${courseId}`, async () => {
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
  }, 1800); // 30 minutes
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

  // Cache the core material details (not including authorization context)
  const cachedMaterial = await cache.getOrSet(`material:detail:${materialId}`, async () => {
    return {
      id: material.id,
      title: material.title,
      content: material.content,
      fileUrl: material.fileUrl,
      videoUrl: material.videoUrl
    };
  }, 3600);

  // Susun daftar attachment jika ada file/video
  const attachments = [];
  if (cachedMaterial.fileUrl) attachments.push({ type: 'pdf', url: cachedMaterial.fileUrl });
  if (cachedMaterial.videoUrl) attachments.push({ type: 'video', url: cachedMaterial.videoUrl });

  const result = {
    id: cachedMaterial.id,
    title: cachedMaterial.title,
    content: cachedMaterial.content,
    attachments,
  };

  return result;
};

// Wrapper for getMaterialById with cache
const getMaterialByIdWithCache = async (materialId, userId, userRole) => {
  // We only cache the core material data, not the user-specific authorization
  // because auth depends on userId and role.
  // Actually, let's just use getOrSet inside the function but carefully.
  return await getMaterialById(materialId, userId, userRole);
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
  const updated = await prisma.material.update({
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

  // Invalidate caches
  await cache.invalidate(`material:detail:${materialId}`);
  await cache.invalidate(`materials:list:${updated.courseId}`);

  return updated;
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

  // Invalidate caches
  await cache.invalidate(`material:detail:${materialId}`);
  await cache.invalidate(`materials:list:${material.course.id}`);

  // Jika ada file terkait, hapus file fisik secara asinkron (jangan blokir response)
  if (material.fileUrl) {
    const filename = path.basename(new URL(material.fileUrl).pathname);
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    cleanupFile(filePath).catch(() => { });
  }

  return { message: 'Materi berhasil dihapus' };
};

export { createMaterial, getMaterials, getMaterialById, updateMaterial, deleteMaterial };
