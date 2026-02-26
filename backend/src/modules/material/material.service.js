import prisma from '../../config/prisma.js';

/**
 * Creates a new course material.
 * Validates that the user is the teacher of the course and automatically assigns an order number.
 * @param {string} courseId - The ID of the course.
 * @param {string} teacherId - The ID of the teacher creating the material.
 * @param {object} data - The material data.
 * @returns {Promise<object>} The created material object.
 * @throws {Error} If the course is not found or if the user is not the course teacher.
 */
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

/**
 * Retrieves a list of materials for a course.
 * For students, it verifies enrollment before returning the list.
 * @param {string} courseId - The ID of the course.
 * @param {string} userId - The ID of the user requesting the materials.
 * @param {string} userRole - The role of the user.
 * @returns {Promise<Array<object>>} A list of material objects, ordered sequentially.
 */
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

/**
 * Retrieves the detailed content of a single material.
 * Performs authorization to ensure the user is either the course teacher, an admin, or an enrolled student.
 * @param {string} materialId - The ID of the material to retrieve.
 * @param {string} userId - The ID of the user.
 * @param {string} userRole - The role of the user.
 * @returns {Promise<object>} The detailed material object with attachments.
 */
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

/**
 * Updates an existing course material.
 * Verifies that the user is the course teacher or an admin before applying changes.
 * @param {string} materialId - The ID of the material to update.
 * @param {string} userId - The ID of the user performing the update.
 * @param {string} userRole - The role of the user.
 * @param {object} data - The update data (title, content, fileUrl, videoUrl, order).
 * @returns {Promise<object>} The updated material object.
 * @throws {Error} If the material is not found or if the user lacks permission.
 */
const updateMaterial = async (materialId, userId, userRole, data) => {
  // 1. Cari material beserta informasi course-nya
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
    throw new Error('Materi tidak ditemukan');
  }

  // 2. Authorization: Hanya Dosen pemilik atau Admin
  if (userRole === 'DOSEN' && material.course.teacherId !== userId) {
    throw new Error('Akses ditolak: Ini bukan materi dari kelas Anda');
  }

  if (userRole === 'MAHASISWA') {
    throw new Error('Akses ditolak: Mahasiswa tidak dapat mengedit materi');
  }

  // 3. Update Material
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

/**
 * Deletes a course material from the database.
 * Verifies that the user is the course teacher or an admin before deletion.
 * @param {string} materialId - The ID of the material to delete.
 * @param {string} userId - The ID of the user performing the deletion.
 * @param {string} userRole - The role of the user.
 * @returns {Promise<{message: string}>} A success message.
 * @throws {Error} If the material is not found or if the user lacks permission.
 */
const deleteMaterial = async (materialId, userId, userRole) => {
  // 1. Cari material beserta informasi course-nya
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
    throw new Error('Materi tidak ditemukan');
  }

  // 2. Authorization: Hanya Dosen pemilik atau Admin
  if (userRole === 'DOSEN' && material.course.teacherId !== userId) {
    throw new Error('Akses ditolak: Ini bukan materi dari kelas Anda');
  }

  if (userRole === 'MAHASISWA') {
    throw new Error('Akses ditolak: Mahasiswa tidak dapat menghapus materi');
  }

  // 3. Delete Material
  await prisma.material.delete({
    where: { id: materialId },
  });

  return { message: 'Materi berhasil dihapus' };
};

export { createMaterial, getMaterials, getMaterialById, updateMaterial, deleteMaterial };
