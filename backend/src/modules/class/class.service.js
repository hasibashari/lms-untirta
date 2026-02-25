import prisma from '../../config/prisma.js';

// ========================================================================
// CLASS SERVICE
// Mengelola "Kelas Offering" — penawaran mata kuliah per semester.
// Modul ini TIDAK mengimpor service lain. Semua akses data via Prisma.
// ========================================================================

// --- Shared select projection ---
const classSelect = {
  id: true,
  section: true,
  schedule: true,
  room: true,
  capacity: true,
  isEnrollmentOpen: true,
  academicSemesterId: true,
  createdAt: true,
  updatedAt: true,
  academicSemester: {
    select: {
      id: true,
      academicYear: true,
      semesterType: true,
      status: true,
    },
  },
  course: {
    select: {
      id: true,
      title: true,
      code: true,
      sks: true,
      semester: true,
    },
  },
  lecturer: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

// ======================== CREATE ========================

/**
 * Buat kelas offering baru.
 * Validasi:
 *  1. Course harus ada
 *  2. Lecturer harus ada dan ber-role DOSEN
 *  3. AcademicSemester harus ada
 *  4. Kombinasi (courseId, academicSemesterId, section) harus unik
 */
const createClass = async (data) => {
  // 1. Validasi Course
  const course = await prisma.course.findUnique({
    where: { id: data.courseId },
    select: { id: true },
  });

  if (!course) {
    throw new Error('Mata kuliah tidak ditemukan');
  }

  // 2. Validasi Lecturer
  const lecturer = await prisma.user.findUnique({
    where: { id: data.lecturerId },
    select: { id: true, role: true },
  });

  if (!lecturer) {
    throw new Error('Dosen tidak ditemukan');
  }

  if (lecturer.role !== 'DOSEN') {
    throw new Error('User yang dipilih bukan dosen');
  }

  // 3. Validasi AcademicSemester
  const semester = await prisma.academicSemester.findUnique({
    where: { id: data.academicSemesterId },
    select: { id: true, academicYear: true, semesterType: true },
  });

  if (!semester) {
    throw new Error('Semester akademik tidak ditemukan');
  }

  // 4. Cek duplikasi (unique constraint)
  const existing = await prisma.class.findUnique({
    where: {
      courseId_academicSemesterId_section: {
        courseId: data.courseId,
        academicSemesterId: data.academicSemesterId,
        section: data.section,
      },
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error(
      `Kelas ${data.section} untuk mata kuliah ini di semester ${semester.semesterType} ${semester.academicYear} sudah ada`
    );
  }

  // 5. Create
  return prisma.class.create({
    data: {
      courseId: data.courseId,
      lecturerId: data.lecturerId,
      academicSemesterId: data.academicSemesterId,
      section: data.section,
      schedule: data.schedule || null,
      room: data.room || null,
      capacity: data.capacity || 40,
      isEnrollmentOpen: data.isEnrollmentOpen || false,
    },
    select: classSelect,
  });
};

// ======================== READ ========================

/**
 * Ambil semua kelas offering, dengan filter opsional.
 * Filter: academicSemesterId, courseId
 */
const getAllClasses = async (filters = {}) => {
  const where = {};

  if (filters.academicSemesterId) {
    where.academicSemesterId = filters.academicSemesterId;
  }

  if (filters.courseId) {
    where.courseId = filters.courseId;
  }

  return prisma.class.findMany({
    where,
    select: {
      ...classSelect,
      _count: {
        select: {
          krsEnrollments: true,
        },
      },
    },
    orderBy: [
      { academicSemester: { academicYear: 'desc' } },
      { academicSemester: { semesterType: 'asc' } },
      { course: { code: 'asc' } },
      { section: 'asc' },
    ],
  });
};

/**
 * Ambil detail satu kelas offering by ID.
 */
const getClassById = async (classId) => {
  const classData = await prisma.class.findUnique({
    where: { id: classId },
    select: classSelect,
  });

  if (!classData) {
    throw new Error('Kelas offering tidak ditemukan');
  }

  return classData;
};

/**
 * Ambil kelas offering yang diajar oleh dosen tertentu.
 */
const getClassesByLecturer = async (lecturerId, filters = {}) => {
  const where = { lecturerId };

  if (filters.academicSemesterId) {
    where.academicSemesterId = filters.academicSemesterId;
  }

  return prisma.class.findMany({
    where,
    select: classSelect,
    orderBy: [
      { academicSemester: { academicYear: 'desc' } },
      { academicSemester: { semesterType: 'asc' } },
      { course: { code: 'asc' } },
      { section: 'asc' },
    ],
  });
};

/**
 * Ambil kelas offering berdasarkan courseId.
 * Berguna untuk melihat semua section/offering dari satu mata kuliah.
 */
const getClassesByCourse = async (courseId, filters = {}) => {
  const where = { courseId };

  if (filters.academicSemesterId) {
    where.academicSemesterId = filters.academicSemesterId;
  }

  return prisma.class.findMany({
    where,
    select: classSelect,
    orderBy: [
      { academicSemester: { academicYear: 'desc' } },
      { academicSemester: { semesterType: 'asc' } },
      { section: 'asc' },
    ],
  });
};

/**
 * Ambil kelas offering yang buka pendaftaran (untuk KRS).
 * Modul KRS bisa memanggil endpoint ini untuk menampilkan kelas yang tersedia.
 */
const getOpenClasses = async (filters = {}) => {
  const where = { isEnrollmentOpen: true };

  if (filters.academicSemesterId) {
    where.academicSemesterId = filters.academicSemesterId;
  }

  if (filters.courseId) {
    where.courseId = filters.courseId;
  }

  return prisma.class.findMany({
    where,
    select: classSelect,
    orderBy: [
      { course: { code: 'asc' } },
      { section: 'asc' },
    ],
  });
};

// ======================== UPDATE ========================

/**
 * Update kelas offering.
 * Validasi:
 *  1. Kelas harus ada
 *  2. Jika ganti lecturer, harus ada dan ber-role DOSEN
 *  3. Jika ganti academicSemesterId, semester harus ada
 *  4. Jika ganti section/semester, cek uniqueness
 */
const updateClass = async (classId, data) => {
  // 1. Cek kelas ada
  const existingClass = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      courseId: true,
      academicSemesterId: true,
      section: true,
    },
  });

  if (!existingClass) {
    throw new Error('Kelas offering tidak ditemukan');
  }

  // 2. Validasi lecturer (jika diubah)
  if (data.lecturerId) {
    const lecturer = await prisma.user.findUnique({
      where: { id: data.lecturerId },
      select: { id: true, role: true },
    });

    if (!lecturer) {
      throw new Error('Dosen tidak ditemukan');
    }

    if (lecturer.role !== 'DOSEN') {
      throw new Error('User yang dipilih bukan dosen');
    }
  }

  // 3. Validasi academicSemester (jika diubah)
  if (data.academicSemesterId) {
    const semester = await prisma.academicSemester.findUnique({
      where: { id: data.academicSemesterId },
      select: { id: true },
    });
    if (!semester) {
      throw new Error('Semester akademik tidak ditemukan');
    }
  }

  // 4. Cek uniqueness jika field pembentuk unique constraint berubah
  const newAcademicSemesterId = data.academicSemesterId || existingClass.academicSemesterId;
  const newSection = data.section || existingClass.section;

  const hasUniqueFieldChange =
    newAcademicSemesterId !== existingClass.academicSemesterId ||
    newSection !== existingClass.section;

  if (hasUniqueFieldChange) {
    const duplicate = await prisma.class.findUnique({
      where: {
        courseId_academicSemesterId_section: {
          courseId: existingClass.courseId,
          academicSemesterId: newAcademicSemesterId,
          section: newSection,
        },
      },
      select: { id: true },
    });

    if (duplicate && duplicate.id !== classId) {
      throw new Error(
        `Kelas ${newSection} untuk mata kuliah ini di semester ini sudah ada`
      );
    }
  }

  // 5. Update
  return prisma.class.update({
    where: { id: classId },
    data,
    select: classSelect,
  });
};

/**
 * Toggle status enrollment (buka/tutup pendaftaran).
 */
const toggleEnrollment = async (classId, isEnrollmentOpen) => {
  const existingClass = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true },
  });

  if (!existingClass) {
    throw new Error('Kelas offering tidak ditemukan');
  }

  return prisma.class.update({
    where: { id: classId },
    data: { isEnrollmentOpen },
    select: classSelect,
  });
};

// ======================== DELETE ========================

/**
 * Hapus kelas offering.
 */
const deleteClass = async (classId) => {
  const existingClass = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      section: true,
      course: { select: { title: true, code: true } },
    },
  });

  if (!existingClass) {
    throw new Error('Kelas offering tidak ditemukan');
  }

  await prisma.class.delete({ where: { id: classId } });

  return {
    message: `Kelas ${existingClass.section} - ${existingClass.course.code} berhasil dihapus`,
    deletedId: classId,
  };
};

export {
  createClass,
  getAllClasses,
  getClassById,
  getClassesByLecturer,
  getClassesByCourse,
  getOpenClasses,
  updateClass,
  toggleEnrollment,
  deleteClass,
};
