import grpc from '@grpc/grpc-js';
import prisma from '../../config/prisma.js';

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

const mapClassItemMessage = (item) => {
  return {
    ...item,
    createdAt: item.createdAt?.toISOString(),
    updatedAt: item.updatedAt?.toISOString(),
    krsEnrollmentsCount: item._count?.krsEnrollments || 0,
    academicSemester: item.academicSemester || null,
    course: item.course || null,
    lecturer: item.lecturer || null,
  };
};

// Service utama untuk operasi CRUD dan query pada entitas Class melalui gRPC
const ClassService = {
  /**
   * Membuat kelas baru.
   * Validasi: course, lecturer, semester harus ada dan valid, tidak boleh duplikat section pada semester & course yang sama.
   * @param {Object} call - Request gRPC
   * @param {Function} callback - Callback gRPC
   */
  CreateClass: async (call, callback) => {
    try {
      const data = call.request;

      const course = await prisma.course.findUnique({
        where: { id: data.courseId },
        select: { id: true, teacherId: true },
      });
      if (!course) return callback({ code: grpc.status.NOT_FOUND, details: 'Mata kuliah tidak ditemukan' });

      // Gunakan lecturerId dari request, jika kosong gunakan teacherId dari course
      const targetLecturerId = data.lecturerId || course.teacherId;
      if (!targetLecturerId) return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Dosen pengampu wajib ditentukan (tidak ada dosen default di mata kuliah)' });

      const lecturer = await prisma.user.findUnique({
        where: { id: targetLecturerId },
        select: { id: true, role: true },
      });
      if (!lecturer) return callback({ code: grpc.status.NOT_FOUND, details: 'Dosen tidak ditemukan' });
      if (lecturer.role !== 'DOSEN') return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'User yang dipilih bukan dosen' });

      const semester = await prisma.academicSemester.findUnique({
        where: { id: data.academicSemesterId },
        select: { id: true, academicYear: true, semesterType: true, status: true },
      });
      if (!semester) return callback({ code: grpc.status.NOT_FOUND, details: 'Semester akademik tidak ditemukan' });
      if (semester.status === 'CLOSED') return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Tidak dapat menambahkan kelas pada semester yang sudah CLOSED' });

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
      if (existing) return callback({ code: grpc.status.ALREADY_EXISTS, details: `Kelas ${data.section} untuk mata kuliah ini di semester ${semester.semesterType} ${semester.academicYear} sudah ada` });

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
  },

  /**
   * Mengambil daftar kelas dengan pagination dan filter opsional (semester, course).
   * @param {Object} call - Request gRPC
   * @param {Function} callback - Callback gRPC
   */
  GetAllClasses: async (call, callback) => {
    try {
      const { page, limit, academicSemesterId, courseId } = call.request;

      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      const where = {};
      if (academicSemesterId) where.academicSemesterId = academicSemesterId;
      if (courseId) where.courseId = courseId;

      const [classes, total] = await Promise.all([
        prisma.class.findMany({
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
          skip,
          take: limitNum,
        }),
        prisma.class.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      callback(null, {
        message: 'Daftar kelas berhasil diambil',
        classes: classes.map(mapClassItemMessage),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
        },
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  /**
   * Mengambil detail kelas berdasarkan ID.
   * @param {Object} call - Request gRPC
   * @param {Function} callback - Callback gRPC
   */
  GetClassById: async (call, callback) => {
    try {
      const classData = await prisma.class.findUnique({
        where: { id: call.request.id },
        select: {
          ...classSelect,
          _count: {
            select: { krsEnrollments: true }
          }
        },
      });

      if (!classData) return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas offering tidak ditemukan' });

      callback(null, {
        message: 'Detail kelas berhasil diambil',
        class: mapClassItemMessage(classData),
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  /**
   * Mengambil daftar kelas yang diampu oleh dosen tertentu, bisa difilter per semester.
   * @param {Object} call - Request gRPC
   * @param {Function} callback - Callback gRPC
   */
  GetClassesByLecturer: async (call, callback) => {
    try {
      const { lecturerId, academicSemesterId } = call.request;
      const where = { lecturerId };
      if (academicSemesterId) where.academicSemesterId = academicSemesterId;

      const classes = await prisma.class.findMany({
        where,
        select: {
          ...classSelect,
          _count: { select: { krsEnrollments: true } }
        },
        orderBy: [
          { academicSemester: { academicYear: 'desc' } },
          { academicSemester: { semesterType: 'asc' } },
          { course: { code: 'asc' } },
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
  },

  /**
   * Mengambil daftar kelas untuk mata kuliah tertentu, bisa difilter per semester.
   * @param {Object} call - Request gRPC
   * @param {Function} callback - Callback gRPC
   */
  GetClassesByCourse: async (call, callback) => {
    try {
      const { courseId, academicSemesterId } = call.request;
      const where = { courseId };
      if (academicSemesterId) where.academicSemesterId = academicSemesterId;

      const classes = await prisma.class.findMany({
        where,
        select: {
          ...classSelect,
          _count: { select: { krsEnrollments: true } }
        },
        orderBy: [
          { academicSemester: { academicYear: 'desc' } },
          { academicSemester: { semesterType: 'asc' } },
          { section: 'asc' },
        ],
      });

      callback(null, {
        message: 'Daftar kelas mata kuliah berhasil diambil',
        classes: classes.map(mapClassItemMessage),
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  /**
   * Mengambil daftar kelas yang enrollment-nya sedang dibuka (isEnrollmentOpen = true).
   * Bisa difilter per course/semester.
   * @param {Object} call - Request gRPC
   * @param {Function} callback - Callback gRPC
   */
  GetOpenClasses: async (call, callback) => {
    try {
      const { courseId, academicSemesterId } = call.request;
      const where = { isEnrollmentOpen: true };
      if (academicSemesterId) where.academicSemesterId = academicSemesterId;
      if (courseId) where.courseId = courseId;

      const classes = await prisma.class.findMany({
        where,
        select: {
          ...classSelect,
          _count: { select: { krsEnrollments: true } }
        },
        orderBy: [
          { course: { code: 'asc' } },
          { section: 'asc' },
        ],
      });

      callback(null, {
        message: 'Daftar kelas aktif berhasil diambil',
        classes: classes.map(mapClassItemMessage),
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  /**
   * Memperbarui data kelas (hanya jika semester belum CLOSED).
   * Validasi: dosen & semester valid, tidak duplikat section pada semester & course yang sama.
   * @param {Object} call - Request gRPC
   * @param {Function} callback - Callback gRPC
   */
  UpdateClass: async (call, callback) => {
    try {
      const classId = call.request.id;
      const data = call.request;

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

      if (!existingClass) return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas offering tidak ditemukan' });
      if (existingClass.academicSemester?.status === 'CLOSED') return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Tidak dapat mengubah kelas pada semester yang sudah CLOSED' });

      if (data.lecturerId) {
        const lecturer = await prisma.user.findUnique({
          where: { id: data.lecturerId },
          select: { id: true, role: true },
        });
        if (!lecturer) return callback({ code: grpc.status.NOT_FOUND, details: 'Dosen tidak ditemukan' });
        if (lecturer.role !== 'DOSEN') return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'User yang dipilih bukan dosen' });
      }

      if (data.academicSemesterId) {
        const semester = await prisma.academicSemester.findUnique({
          where: { id: data.academicSemesterId },
          select: { id: true },
        });
        if (!semester) return callback({ code: grpc.status.NOT_FOUND, details: 'Semester akademik tidak ditemukan' });
      }

      const newAcademicSemesterId = data.academicSemesterId || existingClass.academicSemesterId;
      const newSection = data.section || existingClass.section;

      const hasUniqueFieldChange = newAcademicSemesterId !== existingClass.academicSemesterId || newSection !== existingClass.section;

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
          return callback({ code: grpc.status.ALREADY_EXISTS, details: `Kelas ${newSection} untuk mata kuliah ini di semester ini sudah ada` });
        }
      }

      const updatedClass = await prisma.class.update({
        where: { id: classId },
        data: {
          ...(data.courseId && { courseId: data.courseId }),
          ...(data.lecturerId && { lecturerId: data.lecturerId }),
          ...(data.academicSemesterId && { academicSemesterId: data.academicSemesterId }),
          ...(data.section && { section: data.section }),
          ...(data.schedule && { schedule: data.schedule }),
          ...(data.room && { room: data.room }),
          ...(data.capacity && { capacity: data.capacity }),
          ...(data.hasIsEnrollmentOpen && { isEnrollmentOpen: data.isEnrollmentOpen }) // Need to be careful with optional boolean. However, grpc passes default false if not set. So usually we omit from update fields natively unless explicitly sent via optional or we use another strategy. Let's just pass data.isEnrollmentOpen if it's explicitly included in keys. Wait, protobuf in JS will just have the field.
        },
        select: classSelect,
      });
      // Protobuf `optional bool isEnrollmentOpen` creates a field that allows us to check for presence but in grpc-js it will just be undefined if not sent.
      if (data.isEnrollmentOpen !== undefined) {
        await prisma.class.update({ where: { id: classId }, data: { isEnrollmentOpen: data.isEnrollmentOpen } });
        // Merge into updatedClass for returning. (It's okay to do this two step as it's edge case)
        updatedClass.isEnrollmentOpen = data.isEnrollmentOpen;
      }


      callback(null, {
        message: 'Berhasil mengubah kelas',
        class: mapClassItemMessage(updatedClass),
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  /**
   * Mengubah status enrollment kelas (buka/tutup pendaftaran), hanya jika semester belum CLOSED.
   * @param {Object} call - Request gRPC
   * @param {Function} callback - Callback gRPC
   */
  ToggleEnrollment: async (call, callback) => {
    try {
      const classId = call.request.id;
      const isEnrollmentOpen = call.request.isEnrollmentOpen;

      const existingClass = await prisma.class.findUnique({
        where: { id: classId },
        select: {
          id: true,
          academicSemester: { select: { status: true } },
        },
      });

      if (!existingClass) return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas offering tidak ditemukan' });
      if (existingClass.academicSemester?.status === 'CLOSED') return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Tidak dapat mengubah status enrollment pada semester yang sudah CLOSED' });

      const updatedClass = await prisma.class.update({
        where: { id: classId },
        data: { isEnrollmentOpen },
        select: classSelect,
      });

      callback(null, {
        message: 'Berhasil mengubah status kelas',
        class: mapClassItemMessage(updatedClass),
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  /**
   * Menghapus kelas (hanya jika semester belum CLOSED).
   * @param {Object} call - Request gRPC
   * @param {Function} callback - Callback gRPC
   */
  DeleteClass: async (call, callback) => {
    try {
      const classId = call.request.id;

      const existingClass = await prisma.class.findUnique({
        where: { id: classId },
        select: {
          id: true,
          section: true,
          course: { select: { title: true, code: true } },
          academicSemester: { select: { status: true } },
        },
      });

      if (!existingClass) return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas offering tidak ditemukan' });
      if (existingClass.academicSemester?.status === 'CLOSED') return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Tidak dapat menghapus kelas pada semester yang sudah CLOSED' });

      await prisma.class.delete({ where: { id: classId } });

      callback(null, {
        message: `Kelas ${existingClass.section} - ${existingClass.course.code} berhasil dihapus`,
        deletedId: classId,
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },
};

export default ClassService;
