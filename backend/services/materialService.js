import { prisma } from '../config/prisma.js';

const createMaterial = async (courseId, teacherId, data) => {
  // 1. Cek Permission: Apakah course ini milik Dosen tersebut?
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Kelas tidak ditemukan');
  }

  // Validasi Kepemilikan (Kecuali Admin, logic ini bisa diperluas)
  if (course.teacherId !== teacherId) {
    throw new Error('Akses ditolak: Ini bukan kelas Anda');
  }

  // 2. LOGIC AUTO-ORDERING
  // Cari materi dengan urutan paling akhir di kelas ini
  const lastMaterial = await prisma.material.findFirst({
    where: { courseId: courseId },
    orderBy: { order: 'desc' }, // Ambil yang order-nya paling besar
  });

  // Jika ada materi sebelumnya, urutan baru = urutan lama + 1. Jika tidak, mulai dari 1.
  const newOrder = lastMaterial ? lastMaterial.order + 1 : 1;

  // 3. Simpan Materi
  return await prisma.material.create({
    data: {
      title: data.title,
      content: data.content,
      fileUrl: data.fileUrl,
      videoUrl: data.videoUrl,
      order: newOrder, // Hasil perhitungan kita
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
  // 1. Validasi Akses: User harus terdaftar di kelas ini (kecuali Dosen pemilik/Admin)
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
  // 2. Ambil Materi (Urutkan berdasarkan 'order')
  return await prisma.material.findMany({
    where: { courseId },
    select: {
      id: true,
      title: true,
      order: true,
    },
    orderBy: {
      order: 'asc',
    }, // Penting! Agar urut 1, 2, 3...
  });
};

const getMaterialById = async (materialId, userId, userRole) => {
  // 1. Cari Material berdasarkan ID
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
    throw new Error('Materi tidak ditemukan');
  }

  // 2. Authorization Check:
  // - Jika user adalah Dosen pemilik kelas → Allow
  // - Jika user adalah Admin → Allow
  // - Jika user adalah Mahasiswa → Harus terdaftar di kelas
  if (userRole === 'DOSEN' && material.course.teacherId !== userId) {
    throw new Error('Akses ditolak: Ini bukan materi dari kelas Anda');
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
      throw new Error('Anda belum terdaftar di kelas ini');
    }
  }

  const attachments = [];

  if (material.fileUrl) {
    attachments.push({ type: 'pdf', url: material.fileUrl });
  }

  if (material.videoUrl) {
    attachments.push({ type: 'video', url: material.videoUrl });
  }

  // 3. Return Material Detail
  return {
    id: material.id,
    title: material.title,
    content: material.content,
    attachments,
  };
};

export { createMaterial, getMaterials, getMaterialById };
