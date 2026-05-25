import grpc from '@grpc/grpc-js';
import prisma from '../../config/prisma.js';
import { paginate } from '../../utils/pagination.js';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Validasi akses dosen ke suatu mata kuliah
 */
const checkTeacherCourseAccess = (course, teacherId, teacherRole) => {
  if (teacherRole === 'DOSEN' && course.teacherId !== teacherId) {
    return false;
  }
  return true;
};

/**
 * Mendapatkan kelas aktif untuk mata kuliah tertentu di semester berjalan
 */
const findActiveClass = async (courseId) => {
  return await prisma.class.findFirst({
    where: {
      courseId: courseId,
      academicSemester: { isActive: true },
    },
  });
};

// =============================================================================
// HANDLERS — STUDENT MANAGEMENT
// =============================================================================

const AddStudentToCourse = async (call, callback) => {
  try {
    const { courseId, studentEmail, teacherId, teacherRole } = call.request;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return callback({ code: grpc.status.NOT_FOUND, details: 'Mata kuliah tidak ditemukan' });

    if (!checkTeacherCourseAccess(course, teacherId, teacherRole)) {
      return callback({ code: grpc.status.PERMISSION_DENIED, details: 'Akses ditolak: Ini bukan kelas Anda' });
    }

    const student = await prisma.user.findUnique({ where: { email: studentEmail } });
    if (!student || student.role !== 'MAHASISWA') {
      return callback({ code: grpc.status.NOT_FOUND, details: 'Mahasiswa tidak ditemukan' });
    }

    const activeClass = await findActiveClass(courseId);
    if (!activeClass) return callback({ code: grpc.status.FAILED_PRECONDITION, details: 'Tidak ada kelas aktif' });

    const existingEnrollment = await prisma.krsEnrollment.findFirst({
      where: { studentId: student.id, classId: activeClass.id },
    });
    if (existingEnrollment) return callback({ code: grpc.status.ALREADY_EXISTS, details: 'Mahasiswa sudah terdaftar' });

    const enrollment = await prisma.krsEnrollment.create({
      data: {
        studentId: student.id,
        classId: activeClass.id,
        status: 'APPROVED',
        approvedAt: new Date(),
        submittedAt: new Date(),
      },
      include: { student: { select: { id: true, name: true, email: true } } },
    });

    callback(null, {
      enrollmentId: enrollment.id,
      enrolledAt: enrollment.createdAt.toISOString(),
      student: enrollment.student,
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

const AddStudentToCourseById = async (call, callback) => {
  try {
    const { courseId, studentId, teacherId, teacherRole } = call.request;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return callback({ code: grpc.status.NOT_FOUND, details: 'Mata kuliah tidak ditemukan' });

    if (!checkTeacherCourseAccess(course, teacherId, teacherRole)) {
      return callback({ code: grpc.status.PERMISSION_DENIED, details: 'Akses ditolak: Ini bukan kelas Anda' });
    }

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== 'MAHASISWA') {
      return callback({ code: grpc.status.NOT_FOUND, details: 'Mahasiswa tidak ditemukan' });
    }

    const activeClass = await findActiveClass(courseId);
    if (!activeClass) return callback({ code: grpc.status.FAILED_PRECONDITION, details: 'Tidak ada kelas aktif' });

    const existingEnrollment = await prisma.krsEnrollment.findFirst({
      where: { studentId: student.id, classId: activeClass.id },
    });
    if (existingEnrollment) return callback({ code: grpc.status.ALREADY_EXISTS, details: 'Mahasiswa sudah terdaftar' });

    const enrollment = await prisma.krsEnrollment.create({
      data: {
        studentId: student.id,
        classId: activeClass.id,
        status: 'APPROVED',
        approvedAt: new Date(),
        submittedAt: new Date(),
      },
      include: { student: { select: { id: true, name: true, email: true } } },
    });

      callback(null, {
        enrollmentId: enrollment.id,
        enrolledAt: enrollment.createdAt.toISOString(),
        student: enrollment.student,
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  // Mendapatkan semua course yang diikuti oleh mahasiswa
  GetEnrolledCourses: async (call, callback) => {
    try {
      const { studentId } = call.request;
      const enrollments = await prisma.krsEnrollment.findMany({
        where: { studentId: studentId, status: 'APPROVED' },
        select: {
          id: true,
          createdAt: true,
          class: {
            select: {
              course: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  code: true,
                  semester: true,
                  sks: true,
                  teacher: { select: { id: true, name: true } },
                  _count: {
                    select: {
                      materials: true,
                    },
                  },
                  classes: {
                    select: {
                      _count: {
                        select: {
                          krsEnrollments: { where: { status: 'APPROVED' } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const courses = enrollments.map(e => {
        const course = e.class.course;
        const studentsCount = course.classes.reduce((acc, cls) => acc + (cls._count?.krsEnrollments || 0), 0);
        
        return {
          enrollmentId: e.id,
          joinedAt: e.createdAt.toISOString(),
          course: {
            id: course.id,
            title: course.title,
            code: course.code,
            semester: course.semester,
            sks: course.sks,
            teacher: course.teacher
              ? { id: course.teacher.id, name: course.teacher.name }
              : null,
            materialsCount: course._count.materials || 0,
            studentsCount: studentsCount,
            description: course.description,
          },
        };
      });

    callback(null, { courses });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

  // Mendapatkan semua course yang diajar
  GetTeachingCourses: async (call, callback) => {
    try {
      const { teacherId } = call.request;
      const courses = await prisma.course.findMany({
        where: { teacherId },
        select: {
          id: true,
          title: true,
          description: true,
          code: true,
          semester: true,
          sks: true,
          createdAt: true,
          _count: {
            select: {
              materials: true,
            },
          },
          classes: {
            select: {
              _count: {
                select: {
                  krsEnrollments: { where: { status: 'APPROVED' } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = courses.map(c => {
        const studentsCount = c.classes.reduce((acc, cls) => acc + (cls._count?.krsEnrollments || 0), 0);
        return {
          id: c.id,
          title: c.title,
          code: c.code,
          semester: c.semester,
          sks: c.sks,
          createdAt: c.createdAt.toISOString(),
          materialsCount: c._count.materials || 0,
          studentsCount: studentsCount,
          description: c.description,
        };
      });

    callback(null, { courses });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

// =============================================================================
// HANDLERS — ADMIN OPERATIONS
// =============================================================================

const AdminGetAllCourses = async (call, callback) => {
  try {
    const { page, limit, search, semester } = call.request;
    const { skip, take, meta } = paginate({ page, limit });

    const where = {
      AND: [
        search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { teacher: { name: { contains: search, mode: 'insensitive' } } }
          ]
        } : {},
        semester ? { semester: Number(semester) } : {}
      ]
    };

      const [courses, total] = await Promise.all([
        prisma.course.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            code: true,
            semester: true,
            sks: true,
            createdAt: true,
            teacherId: true,
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                materials: true,
                assignments: true,
              },
            },
            classes: {
              select: {
                _count: {
                  select: {
                    krsEnrollments: { where: { status: 'APPROVED' } },
                  },
                },
              },
            },
          },
          orderBy: [{ semester: 'asc' }, { createdAt: 'desc' }],
          skip,
          take,
        }),
        prisma.course.count({ where }),
      ]);

      const data = courses.map(c => {
        const studentsCount = c.classes.reduce((acc, cls) => acc + (cls._count?.krsEnrollments || 0), 0);
        return {
          ...c,
          createdAt: c.createdAt.toISOString(),
          studentsCount: studentsCount,
          materialsCount: c._count.materials,
          assignmentsCount: c._count.assignments,
          teacher: c.teacher || null,
        };
      });

    callback(null, { data, pagination: meta(total) });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

const AdminCreateCourse = async (call, callback) => {
  try {
    const data = call.request;

    const existing = await prisma.course.findUnique({ where: { code: data.code } });
    if (existing) return callback({ code: grpc.status.ALREADY_EXISTS, details: 'Kode MK sudah digunakan' });

    if (data.teacherId) {
      const teacher = await prisma.user.findUnique({ where: { id: data.teacherId } });
      if (!teacher || teacher.role !== 'DOSEN') {
        return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'User bukan dosen' });
      }
    }

    const created = await prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        code: data.code,
        semester: data.semester ? Number(data.semester) : null,
        sks: data.sks || 3,
        teacherId: data.teacherId || null,
      },
      include: { teacher: { select: { id: true, name: true, email: true } } },
    });

    callback(null, {
      ...created,
      createdAt: created.createdAt.toISOString(),
      teacher: created.teacher || null,
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

const AdminUpdateCourse = async (call, callback) => {
  try {
    const data = call.request;
    const { courseId } = data;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return callback({ code: grpc.status.NOT_FOUND, details: 'MK tidak ditemukan' });

    if (data.code && data.code !== course.code) {
      const existing = await prisma.course.findUnique({ where: { code: data.code } });
      if (existing) return callback({ code: grpc.status.ALREADY_EXISTS, details: 'Kode MK sudah digunakan' });
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: {
        title: data.title || undefined,
        description: data.description || undefined,
        code: data.code || undefined,
        semester: data.semester ? Number(data.semester) : undefined,
        sks: data.sks || undefined,
        teacherId: data.teacherId || undefined,
      },
      include: { teacher: { select: { id: true, name: true, email: true } } },
    });

    callback(null, {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      teacher: updated.teacher || null,
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

  AdminDeleteCourse: async (call, callback) => {
    try {
      const { courseId } = call.request;
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          _count: {
            select: {
              materials: true,
            },
          },
          classes: {
            select: {
              _count: {
                select: {
                  krsEnrollments: { where: { status: 'APPROVED' } },
                },
              },
            },
          },
        },
      });
      if (!course)
        return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas tidak ditemukan' });

      await prisma.course.delete({ where: { id: courseId } });
      const totalStudents = course.classes.reduce((acc, cls) => acc + (cls._count?.krsEnrollments || 0), 0);
      callback(null, {
        message: 'Kelas berhasil dihapus',
        deletedStudents: totalStudents,
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

const AdminAssignTeacher = async (call, callback) => {
  try {
    const { courseId, teacherId } = call.request;

    const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.role !== 'DOSEN') {
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'User bukan dosen' });
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { teacherId },
      include: { teacher: { select: { id: true, name: true, email: true } } },
    });

    callback(null, {
      id: updated.id,
      title: updated.title,
      code: updated.code,
      teacher: updated.teacher,
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

// =============================================================================
// EXPORT SERVICE
// =============================================================================

export const courseService = {
  AddStudentToCourse,
  AddStudentToCourseById,
  GetEnrolledCourses,
  GetTeachingCourses,
  GetStudentsByCourse,
  GetAvailableStudentsForCourse,
  AdminGetAllCourses,
  AdminCreateCourse,
  AdminUpdateCourse,
  AdminDeleteCourse,
  AdminAssignTeacher,
};

export default courseService;
