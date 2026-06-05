import grpc from '@grpc/grpc-js';
import prisma from '../../config/prisma.js';

// =============================================================================
// SELECTORS & MAPPERS
// =============================================================================

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
  _count: {
    select: { krsEnrollments: true },
  },
};

const mapClassItemMessage = (item) => ({
  ...item,
  createdAt: item.createdAt?.toISOString(),
  updatedAt: item.updatedAt?.toISOString(),
  krsEnrollmentsCount: item._count?.krsEnrollments || 0,
  academicSemester: item.academicSemester || null,
  course: item.course || null,
  lecturer: item.lecturer || null,
});

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Validasi apakah dosen valid dan memiliki peran yang benar
 */
const validateLecturer = async (lecturerId) => {
  const lecturer = await prisma.user.findUnique({
    where: { id: lecturerId },
    select: { id: true, role: true },
  });
  if (!lecturer) return { error: 'Dosen tidak ditemukan' };
  if (lecturer.role !== 'DOSEN') return { error: 'User yang dipilih bukan dosen' };
  return { lecturer };
};

/**
 * Validasi apakah semester valid dan tidak tertutup
 */
const validateSemester = async (semesterId) => {
  const semester = await prisma.academicSemester.findUnique({
    where: { id: semesterId },
    select: { id: true, academicYear: true, semesterType: true, status: true },
  });
  if (!semester) return { error: 'Semester akademik tidak ditemukan' };
  if (semester.status === 'CLOSED') return { error: 'Tidak dapat mengubah data pada semester yang sudah CLOSED' };
  return { semester };
};

// =============================================================================
// HANDLERS — ADMIN OPERATIONS
// =============================================================================

export const CreateClass = async (call, callback) => {
  try {
    const data = call.request;

    // 1. Validasi Mata Kuliah
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
      select: { id: true, teacherId: true },
    });
    if (!course) return callback({ code: grpc.status.NOT_FOUND, details: 'Mata kuliah tidak ditemukan' });

    // 2. Validasi Dosen
    const targetLecturerId = data.lecturerId || course.teacherId;
    if (!targetLecturerId) return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Dosen pengampu wajib ditentukan' });

    const { error: lectErr } = await validateLecturer(targetLecturerId);
    if (lectErr) return callback({ code: grpc.status.INVALID_ARGUMENT, details: lectErr });

    // 3. Validasi Semester
    const { semester, error: semErr } = await validateSemester(data.academicSemesterId);
    if (semErr) return callback({ code: grpc.status.INVALID_ARGUMENT, details: semErr });

    // 4. Cek Duplikasi Section
    const existing = await prisma.class.findUnique({
      where: {
        courseId_academicSemesterId_section: {
          courseId: data.courseId,
          academicSemesterId: data.academicSemesterId,
          section: data.section,
        },
      },
    });
    if (existing) return callback({ code: grpc.status.ALREADY_EXISTS, details: `Kelas ${data.section} sudah ada di semester ini` });

    // 5. Simpan Kelas Baru
    const newClass = await prisma.class.create({
      data: {
        courseId: data.courseId,
        lecturerId: targetLecturerId,
        academicSemesterId: data.academicSemesterId,
        section: data.section,
        schedule: data.schedule || null,
        room: data.room || null,
        capacity: data.capacity || 40,
        isEnrollmentOpen: data.isEnrollmentOpen || false,
      },
      select: classSelect,
    });

    callback(null, {
      message: 'Berhasil membuat kelas',
      class: mapClassItemMessage(newClass),
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const UpdateClass = async (call, callback) => {
  try {
    const classId = call.request.id;
    const data = call.request;

    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
      include: { academicSemester: true },
    });

    if (!existingClass) return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas tidak ditemukan' });
    if (existingClass.academicSemester?.status === 'CLOSED') {
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Semester sudah CLOSED' });
    }

    // Validasi Dosen Baru
    if (data.lecturerId) {
      const { error } = await validateLecturer(data.lecturerId);
      if (error) return callback({ code: grpc.status.INVALID_ARGUMENT, details: error });
    }

    // Cek Duplikasi jika Section/Semester berubah
    const newSection = data.section || existingClass.section;
    const newSemesterId = data.academicSemesterId || existingClass.academicSemesterId;

    if (newSection !== existingClass.section || newSemesterId !== existingClass.academicSemesterId) {
      const duplicate = await prisma.class.findUnique({
        where: {
          courseId_academicSemesterId_section: {
            courseId: existingClass.courseId,
            academicSemesterId: newSemesterId,
            section: newSection,
          },
        },
      });
      if (duplicate && duplicate.id !== classId) {
        return callback({ code: grpc.status.ALREADY_EXISTS, details: 'Section duplikat di semester ini' });
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        lecturerId: data.lecturerId || undefined,
        academicSemesterId: data.academicSemesterId || undefined,
        section: data.section || undefined,
        schedule: data.schedule || undefined,
        room: data.room || undefined,
        capacity: data.capacity || undefined,
        isEnrollmentOpen: data.isEnrollmentOpen !== undefined ? data.isEnrollmentOpen : undefined,
      },
      select: classSelect,
    });

    callback(null, {
      message: 'Berhasil mengubah kelas',
      class: mapClassItemMessage(updatedClass),
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const DeleteClass = async (call, callback) => {
  try {
    const classId = call.request.id;
    const existing = await prisma.class.findUnique({
      where: { id: classId },
      include: { academicSemester: true, course: true },
    });

    if (!existing) return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas tidak ditemukan' });
    if (existing.academicSemester?.status === 'CLOSED') {
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Semester sudah CLOSED' });
    }

    await prisma.class.delete({ where: { id: classId } });
    callback(null, {
      message: `Kelas ${existing.section} - ${existing.course.code} berhasil dihapus`,
      deletedId: classId,
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const ToggleEnrollment = async (call, callback) => {
  try {
    const { id: classId, isEnrollmentOpen } = call.request;

    const existing = await prisma.class.findUnique({
      where: { id: classId },
      include: { academicSemester: true },
    });

    if (!existing) return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas tidak ditemukan' });
    if (existing.academicSemester?.status === 'CLOSED') {
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Semester sudah CLOSED' });
    }

    const updated = await prisma.class.update({
      where: { id: classId },
      data: { isEnrollmentOpen },
      select: classSelect,
    });

    callback(null, {
      message: 'Status pendaftaran berhasil diubah',
      class: mapClassItemMessage(updated),
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

// =============================================================================
// HANDLERS — QUERY OPERATIONS
// =============================================================================

export const GetAllClasses = async (call, callback) => {
  try {
    const { page, limit, academicSemesterId, courseId, search, isEnrollmentOpen } = call.request;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (academicSemesterId) where.academicSemesterId = academicSemesterId;
    if (courseId) where.courseId = courseId;
    if (isEnrollmentOpen === 'true') where.isEnrollmentOpen = true;
    if (isEnrollmentOpen === 'false') where.isEnrollmentOpen = false;

    if (search) {
      where.OR = [
        { section: { contains: search, mode: 'insensitive' } },
        { course: { title: { contains: search, mode: 'insensitive' } } },
        { course: { code: { contains: search, mode: 'insensitive' } } },
        { lecturer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        select: classSelect,
        orderBy: [
          { academicSemester: { academicYear: 'desc' } },
          { course: { code: 'asc' } },
          { section: 'asc' },
        ],
        skip,
        take: limitNum,
      }),
      prisma.class.count({ where }),
    ]);

    callback(null, {
      message: 'Daftar kelas berhasil diambil',
      classes: classes.map(mapClassItemMessage),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GetClassById = async (call, callback) => {
  try {
    const data = await prisma.class.findUnique({
      where: { id: call.request.id },
      select: classSelect,
    });

    if (!data) return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas tidak ditemukan' });

    callback(null, {
      message: 'Detail kelas berhasil diambil',
      class: mapClassItemMessage(data),
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GetClassStats = async (call, callback) => {
  try {
    const { academicSemesterId } = call.request;

    const [totalClasses, openEnrollment, activeSemesterClasses, activeSemesterOpen] = await Promise.all([
      prisma.class.count(),
      prisma.class.count({ where: { isEnrollmentOpen: true } }),
      academicSemesterId ? prisma.class.count({ where: { academicSemesterId } }) : Promise.resolve(0),
      academicSemesterId ? prisma.class.count({ where: { academicSemesterId, isEnrollmentOpen: true } }) : Promise.resolve(0),
    ]);

    callback(null, {
      totalClasses,
      openEnrollment,
      activeSemesterClasses,
      activeSemesterOpen,
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GetClassesByLecturer = async (call, callback) => {
  try {
    const { lecturerId, academicSemesterId } = call.request;
    const where = { lecturerId };
    if (academicSemesterId) where.academicSemesterId = academicSemesterId;

    const classes = await prisma.class.findMany({
      where,
      select: classSelect,
      orderBy: [
        { academicSemester: { academicYear: 'desc' } },
        { section: 'asc' },
      ],
    });

    callback(null, {
      message: 'Daftar kelas dosen berhasil diambil',
      classes: classes.map(mapClassItemMessage),
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GetClassesByCourse = async (call, callback) => {
  try {
    const { courseId, academicSemesterId } = call.request;
    const where = { courseId };
    if (academicSemesterId) where.academicSemesterId = academicSemesterId;

    const classes = await prisma.class.findMany({
      where,
      select: classSelect,
      orderBy: [{ academicSemester: { academicYear: 'desc' } }, { section: 'asc' }],
    });

    callback(null, {
      message: 'Daftar kelas mata kuliah berhasil diambil',
      classes: classes.map(mapClassItemMessage),
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GetOpenClasses = async (call, callback) => {
  try {
    const { courseId, academicSemesterId } = call.request;
    const where = { isEnrollmentOpen: true };
    if (academicSemesterId) where.academicSemesterId = academicSemesterId;
    if (courseId) where.courseId = courseId;

    const classes = await prisma.class.findMany({
      where,
      select: classSelect,
      orderBy: [{ course: { code: 'asc' } }, { section: 'asc' }],
    });

    callback(null, {
      message: 'Daftar kelas aktif berhasil diambil',
      classes: classes.map(mapClassItemMessage),
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};
