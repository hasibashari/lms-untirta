import grpc from '@grpc/grpc-js';
import prisma from '../../config/prisma.js';
import { paginate } from '../../utils/pagination.js';

export const courseService = {

  // Menambahkan mahasiswa berdasarkan Email
  AddStudentToCourse: async (call, callback) => {
    try {
      const { courseId, studentEmail, teacherId, teacherRole } = call.request;

      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });
      if (!course)
        return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas tidak ditemukan' });

      if (teacherRole === 'DOSEN' && course.teacherId !== teacherId) {
        return callback({
          code: grpc.status.PERMISSION_DENIED,
          details: 'Akses ditolak: Ini bukan kelas Anda',
        });
      }

      const student = await prisma.user.findUnique({ where: { email: studentEmail } });
      if (!student)
        return callback({
          code: grpc.status.NOT_FOUND,
          details: 'Mahasiswa dengan email tersebut tidak ditemukan',
        });
      if (student.role !== 'MAHASISWA')
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          details: 'User tersebut bukan mahasiswa',
        });

      const activeClass = await prisma.class.findFirst({
        where: {
          courseId: courseId,
          academicSemester: { isActive: true },
        },
      });

      if (!activeClass)
        return callback({
          code: grpc.status.FAILED_PRECONDITION,
          details: 'Tidak ada kelas aktif untuk mata kuliah ini di semester berjalan',
        });

      const existingEnrollment = await prisma.krsEnrollment.findFirst({
        where: { studentId: student.id, classId: activeClass.id },
      });

      if (existingEnrollment)
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          details: 'Mahasiswa sudah terdaftar di kelas ini (KRS)',
        });

      const enrollment = await prisma.krsEnrollment.create({
        data: {
          studentId: student.id,
          classId: activeClass.id,
          status: 'APPROVED',
          approvedAt: new Date(),
          submittedAt: new Date(),
        },
        select: {
          id: true,
          createdAt: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
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

  // Menambahkan mahasiswa berdasarkan Id
  AddStudentToCourseById: async (call, callback) => {
    try {
      const { courseId, studentId, teacherId, teacherRole } = call.request;

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course)
        return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas tidak ditemukan' });

      if (teacherRole === 'DOSEN' && course.teacherId !== teacherId) {
        return callback({
          code: grpc.status.PERMISSION_DENIED,
          details: 'Akses ditolak: Ini bukan kelas Anda',
        });
      }

      const student = await prisma.user.findUnique({ where: { id: studentId } });
      if (!student)
        return callback({ code: grpc.status.NOT_FOUND, details: 'Mahasiswa tidak ditemukan' });
      if (student.role !== 'MAHASISWA')
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          details: 'User tersebut bukan mahasiswa',
        });

      const activeClass = await prisma.class.findFirst({
        where: {
          courseId: courseId,
          academicSemester: { isActive: true },
        },
      });

      if (!activeClass)
        return callback({
          code: grpc.status.FAILED_PRECONDITION,
          details: 'Tidak ada kelas aktif untuk mata kuliah ini di semester berjalan',
        });

      const existingEnrollment = await prisma.krsEnrollment.findFirst({
        where: { studentId: student.id, classId: activeClass.id },
      });

      if (existingEnrollment)
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          details: 'Mahasiswa sudah terdaftar di kelas ini (KRS)',
        });

      const enrollment = await prisma.krsEnrollment.create({
        data: {
          studentId: student.id,
          classId: activeClass.id,
          status: 'APPROVED',
          approvedAt: new Date(),
          submittedAt: new Date(),
        },
        select: {
          id: true,
          createdAt: true,
          student: { select: { id: true, name: true, email: true } },
        },
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
                  code: true,
                  semester: true,
                  sks: true,
                  teacher: { select: { id: true, name: true } },
                  _count: {
                    select: {
                      materials: true,
                      krsEnrollments: { where: { status: 'APPROVED' } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const courses = enrollments.map(e => ({
        enrollmentId: e.id,
        joinedAt: e.createdAt.toISOString(),
        course: {
          id: e.class.course.id,
          title: e.class.course.title,
          code: e.class.course.code,
          semester: e.class.course.semester,
          sks: e.class.course.sks,
          teacher: e.class.course.teacher
            ? { id: e.class.course.teacher.id, name: e.class.course.teacher.name }
            : null,
          materialsCount: e.class.course._count.materials || 0,
          studentsCount: e.class.course._count.krsEnrollments || 0,
        },
      }));

      callback(null, { courses });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  // Mendapatkan semua course yang diajar
  GetTeachingCourses: async (call, callback) => {
    try {
      const { teacherId } = call.request;
      const courses = await prisma.course.findMany({
        where: { teacherId },
        select: {
          id: true,
          title: true,
          code: true,
          semester: true,
          sks: true,
          createdAt: true,
          _count: {
            select: {
              materials: true,
              krsEnrollments: { where: { status: 'APPROVED' } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = courses.map(c => ({
        id: c.id,
        title: c.title,
        code: c.code,
        semester: c.semester,
        sks: c.sks,
        createdAt: c.createdAt.toISOString(),
        materialsCount: c._count.materials || 0,
        studentsCount: c._count.krsEnrollments || 0,
      }));

      callback(null, { courses: formatted });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  // Mendapatkan semua mahasiswa dalam satu kelas
  GetStudentsByCourse: async (call, callback) => {
    try {
      const { courseId, userId, userRole } = call.request;
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course)
        return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas tidak ditemukan' });

      if (userRole === 'DOSEN' && course.teacherId !== userId) {
        return callback({
          code: grpc.status.PERMISSION_DENIED,
          details: 'Akses ditolak: Ini bukan kelas Anda',
        });
      }

      const enrollments = await prisma.krsEnrollment.findMany({
        where: {
          class: { courseId: courseId },
          status: 'APPROVED',
        },
        select: {
          id: true,
          createdAt: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const formatted = enrollments.map(e => ({
        enrollmentId: e.id,
        enrolledAt: e.createdAt.toISOString(),
        student: e.student,
      }));
      callback(null, { enrollments: formatted });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetAvailableStudentsForCourse: async (call, callback) => {
    try {
      const { courseId, userId, userRole } = call.request;
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course)
        return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas tidak ditemukan' });

      if (userRole === 'DOSEN' && course.teacherId !== userId) {
        return callback({
          code: grpc.status.PERMISSION_DENIED,
          details: 'Akses ditolak: Ini bukan kelas Anda',
        });
      }

      const availableStudents = await prisma.user.findMany({
        where: {
          role: 'MAHASISWA',
          krsEnrollments: {
            none: {
              class: {
                courseId: courseId,
              },
              status: 'APPROVED',
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: { name: 'asc' },
      });

      callback(null, { students: availableStudents });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  AdminGetAllCourses: async (call, callback) => {
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
          semester ? { semester: semester } : {}
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
                krsEnrollments: { where: { status: 'APPROVED' } },
                materials: true,
                assignments: true,
              },
            },
          },
          orderBy: [{ semester: 'asc' }, { createdAt: 'desc' }],
          skip,
          take,
        }),
        prisma.course.count({ where }),
      ]);

      const data = courses.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        studentsCount: c._count.krsEnrollments,
        materialsCount: c._count.materials,
        assignmentsCount: c._count.assignments,
        teacher: c.teacher || null,
      }));

      callback(null, { data, pagination: meta(total) });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  AdminCreateCourse: async (call, callback) => {
    try {
      const data = call.request;
      const existingCourse = await prisma.course.findUnique({ where: { code: data.code } });
      if (existingCourse)
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          details: 'Kode kelas sudah digunakan',
        });

      const semesterValue =
        data.semester === undefined || data.semester === null || data.semester === ''
          ? null
          : Number.parseInt(data.semester, 10);
      if (
        data.semester !== undefined &&
        data.semester !== null &&
        data.semester !== '' &&
        Number.isNaN(semesterValue)
      ) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Semester tidak valid' });
      }

      if (data.teacherId) {
        const teacher = await prisma.user.findUnique({ where: { id: data.teacherId } });
        if (!teacher)
          return callback({ code: grpc.status.NOT_FOUND, details: 'Dosen tidak ditemukan' });
        if (teacher.role !== 'DOSEN')
          return callback({
            code: grpc.status.INVALID_ARGUMENT,
            details: 'User tersebut bukan dosen',
          });
      }

      const created = await prisma.course.create({
        data: {
          title: data.title,
          description: data.description,
          code: data.code,
          semester: semesterValue,
          sks: data.sks || 3,
          teacherId: data.teacherId || null,
        },
        select: {
          id: true,
          title: true,
          description: true,
          code: true,
          semester: true,
          sks: true,
          createdAt: true,
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      callback(null, {
        ...created,
        createdAt: created.createdAt.toISOString(),
        teacher: created.teacher || null,
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  AdminUpdateCourse: async (call, callback) => {
    try {
      const data = call.request;
      const courseId = data.courseId;
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course)
        return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas tidak ditemukan' });

      let semesterValue;
      if (data.semester !== undefined) {
        if (data.semester === '') {
          semesterValue = undefined;
        } else {
          semesterValue = Number.parseInt(data.semester, 10);
          if (Number.isNaN(semesterValue)) {
            return callback({
              code: grpc.status.INVALID_ARGUMENT,
              details: 'Semester tidak valid',
            });
          }
        }
      }

      if (data.code && data.code !== course.code) {
        const existingCourse = await prisma.course.findUnique({ where: { code: data.code } });
        if (existingCourse)
          return callback({
            code: grpc.status.ALREADY_EXISTS,
            details: 'Kode kelas sudah digunakan',
          });
      }

      if (data.teacherId) {
        const teacher = await prisma.user.findUnique({ where: { id: data.teacherId } });
        if (!teacher)
          return callback({ code: grpc.status.NOT_FOUND, details: 'Dosen tidak ditemukan' });
        if (teacher.role !== 'DOSEN')
          return callback({
            code: grpc.status.INVALID_ARGUMENT,
            details: 'User tersebut bukan dosen',
          });
      }

      const updated = await prisma.course.update({
        where: { id: courseId },
        data: {
          title: data.title !== '' ? data.title : undefined,
          description: data.description !== '' ? data.description : undefined,
          code: data.code !== '' ? data.code : undefined,
          semester: semesterValue,
          sks: data.sks !== 0 ? data.sks : undefined,
          teacherId: data.teacherId !== '' ? data.teacherId : undefined,
        },
        select: {
          id: true,
          title: true,
          description: true,
          code: true,
          semester: true,
          sks: true,
          createdAt: true,
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      callback(null, {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        teacher: updated.teacher || null,
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  AdminDeleteCourse: async (call, callback) => {
    try {
      const { courseId } = call.request;
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          _count: {
            select: {
              krsEnrollments: { where: { status: 'APPROVED' } },
            },
          },
        },
      });
      if (!course)
        return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas tidak ditemukan' });

      await prisma.course.delete({ where: { id: courseId } });
      callback(null, {
        message: 'Kelas berhasil dihapus',
        deletedStudents: course._count.krsEnrollments,
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  AdminAssignTeacher: async (call, callback) => {
    try {
      const { courseId, teacherId } = call.request;
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course)
        return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas tidak ditemukan' });

      const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
      if (!teacher)
        return callback({ code: grpc.status.NOT_FOUND, details: 'Dosen tidak ditemukan' });
      if (teacher.role !== 'DOSEN')
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          details: 'User tersebut bukan dosen',
        });

      const updated = await prisma.course.update({
        where: { id: courseId },
        data: { teacherId },
        select: {
          id: true,
          title: true,
          code: true,
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      callback(null, { ...updated, teacher: updated.teacher || null });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },
};
