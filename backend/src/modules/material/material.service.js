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

export const createMaterial = async (classId, teacherId, data) => {
  // 1. Cek apakah kelas ada
  const classOffering = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!classOffering) {
    throw new AppError(404, 'Kelas tidak ditemukan');
  }

  // 2. Validasi kepemilikan: hanya dosen pengampu
  if (classOffering.lecturerId !== teacherId) {
    throw new AppError(403, 'Akses ditolak: Anda bukan dosen pengampu kelas ini');
  }

  // 3. AUTO-ORDERING: tentukan urutan materi berikutnya di kelas ini
  const lastMaterial = await prisma.material.findFirst({
    where: { classId: classId },
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
      classId: classId,
      courseId: classOffering.courseId,
    },
    select: {
      id: true,
      title: true,
      content: true,
      fileUrl: true,
      videoUrl: true,
      order: true,
      isPublished: true,
      classId: true,
      courseId: true,
      createdAt: true,
    },
  });

  // 5. Invalidate cache list materi kelas
  await cache.invalidate(`materials:list:${classId}`);

  return result;
};

export const getMaterials = async (classId, userId, userRole) => {
  // Jika mahasiswa, pastikan sudah terdaftar di kelas
  if (userRole === 'MAHASISWA') {
    const enrollment = await prisma.krsEnrollment.findFirst({
      where: {
        studentId: userId,
        classId: classId,
        status: 'APPROVED',
      },
    });
    if (!enrollment) {
      throw new AppError(403, 'Anda belum terdaftar di kelas ini');
    }
  }

  // Ambil daftar materi, terurut berdasarkan 'order' (naik)
  // Cache key include classId
  return await cache.getOrSet(`materials:list:${classId}`, async () => {
    return await prisma.material.findMany({
      where: { classId },
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

export const getMaterialById = async (materialId, userId, userRole) => {
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
      class: {
        select: {
          id: true,
          lecturerId: true,
        },
      },
    },
  });

  if (!material) {
    throw new AppError(404, 'Materi tidak ditemukan');
  }

  // Otorisasi: dosen pengampu atau admin boleh, mahasiswa harus terdaftar
  if (userRole === 'DOSEN' && (material.class?.lecturerId !== userId && material.course.teacherId !== userId)) {
    throw new AppError(403, 'Akses ditolak: Ini bukan materi dari kelas Anda');
  }

  if (userRole === 'MAHASISWA') {
    const enrollment = await prisma.krsEnrollment.findFirst({
      where: {
        studentId: userId,
        classId: material.classId || undefined,
        status: 'APPROVED',
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

export const updateMaterial = async (materialId, userId, userRole, data) => {
  // Ambil material untuk validasi eksistensi dan otorisasi
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: {
      id: true,
      classId: true,
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
    },
  });

  if (!material) {
    throw new AppError(404, 'Materi tidak ditemukan');
  }

  // Hanya dosen pengampu atau admin yang boleh mengedit
  if (userRole === 'DOSEN' && (material.class?.lecturerId !== userId && material.course.teacherId !== userId)) {
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
      classId: true,
      courseId: true,
      updatedAt: true,
    },
  });

  // Invalidate caches
  await cache.invalidate(`material:detail:${materialId}`);
  await cache.invalidate(`materials:list:${updated.classId}`);

  return updated;
};

export const deleteMaterial = async (materialId, userId, userRole) => {
  // Ambil metadata materi untuk validasi dan cleanup file
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: {
      id: true,
      fileUrl: true,
      classId: true,
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
    },
  });

  if (!material) {
    throw new AppError(404, 'Materi tidak ditemukan');
  }

  // Otorisasi penghapusan
  if (userRole === 'DOSEN' && (material.class?.lecturerId !== userId && material.course.teacherId !== userId)) {
    throw new AppError(403, 'Akses ditolak: Ini bukan materi dari kelas Anda');
  }

  if (userRole === 'MAHASISWA') {
    throw new AppError(403, 'Akses ditolak: Mahasiswa tidak dapat menghapus materi');
  }

  // Hapus record materi
  await prisma.material.delete({ where: { id: materialId } });

  // Invalidate caches
  await cache.invalidate(`material:detail:${materialId}`);
  await cache.invalidate(`materials:list:${material.classId}`);

  // Jika ada file terkait, hapus file fisik secara asinkron (jangan blokir response)
  if (material.fileUrl) {
    const filename = path.basename(new URL(material.fileUrl).pathname);
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    cleanupFile(filePath).catch(() => { });
  }

  return { message: 'Materi berhasil dihapus' };
};


