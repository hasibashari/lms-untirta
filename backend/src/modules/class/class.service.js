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
 * Creates a new class offering.
 * Validates existence of course, lecturer, and semester. Ensures the lecturer has the correct role
 * and that the class section is unique for the given course and semester.
 * @param {object} data - The class data.
 * @param {string} data.courseId - The ID of the course.
 * @param {string} data.lecturerId - The ID of the lecturer.
 * @param {string} data.academicSemesterId - The ID of the academic semester.
 * @param {string} data.section - The class section (e.g., "A", "B").
 * @param {string} [data.schedule] - The class schedule.
 * @param {string} [data.room] - The room location.
 * @returns {Promise<object>} The created class object.
 * @throws {Error} If validation fails or duplicate class exists.
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
    select: { id: true, academicYear: true, semesterType: true, status: true },
  });

  if (!semester) {
    throw new Error('Semester akademik tidak ditemukan');
  }

  if (semester.status === 'CLOSED') {
    throw new Error('Tidak dapat menambahkan kelas pada semester yang sudah CLOSED');
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
 * Retrieves all class offerings, optionally filtered by semester or course.
 * @param {object} filters - Filter criteria.
 * @returns {Promise<Array<object>>} List of classes with enrollment counts.
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
 * Retrieves details of a specific class offering by ID.
 * @param {string} classId - The class ID.
 * @returns {Promise<object>} The class object.
 * @throws {Error} If the class is not found.
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
 * Retrieves classes taught by a specific lecturer.
 * @param {string} lecturerId - The lecturer's user ID.
 * @param {object} filters - Optional filters (e.g., academicSemesterId).
 * @returns {Promise<Array<object>>} List of classes.
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
 * Retrieves all class offerings for a specific course.
 * Useful for viewing all sections of a course in a given semester.
 * @param {string} courseId - The course ID.
 * @returns {Promise<Array<object>>} List of classes.
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
 * Retrieves class offerings that are currently open for enrollment.
 * @param {object} filters - Optional filters.
 * @returns {Promise<Array<object>>} List of open classes.
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
 * Updates an existing class offering.
 * Validates constraints if critical fields (lecturer, semester, section) are modified.
 * @param {string} classId - The class ID.
 * @param {object} data - The update data.
 * @returns {Promise<object>} The updated class object.
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
      academicSemester: { select: { status: true } },
    },
  });

  if (!existingClass) {
    throw new Error('Kelas offering tidak ditemukan');
  }

  if (existingClass.academicSemester?.status === 'CLOSED') {
    throw new Error('Tidak dapat mengubah kelas pada semester yang sudah CLOSED');
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
 * Toggles the enrollment status of a class.
 * @param {string} classId - The class ID.
 * @param {boolean} isEnrollmentOpen - The new status.
 * @returns {Promise<object>} The updated class object.
 */
const toggleEnrollment = async (classId, isEnrollmentOpen) => {
  const existingClass = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      academicSemester: { select: { status: true } },
    },
  });

  if (!existingClass) {
    throw new Error('Kelas offering tidak ditemukan');
  }

  if (existingClass.academicSemester?.status === 'CLOSED') {
    throw new Error('Tidak dapat mengubah status enrollment pada semester yang sudah CLOSED');
  }

  return prisma.class.update({
    where: { id: classId },
    data: { isEnrollmentOpen },
    select: classSelect,
  });
};

// ======================== DELETE ========================

/**
 * Deletes a class offering.
 * Restricted if the semester is already closed.
 * @param {string} classId - The class ID.
 * @returns {Promise<object>} Result message and deleted ID.
 */
const deleteClass = async (classId) => {
  const existingClass = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      section: true,
      course: { select: { title: true, code: true } },
      academicSemester: { select: { status: true } },
    },
  });

  if (!existingClass) {
    throw new Error('Kelas offering tidak ditemukan');
  }

  if (existingClass.academicSemester?.status === 'CLOSED') {
    throw new Error('Tidak dapat menghapus kelas pada semester yang sudah CLOSED');
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
