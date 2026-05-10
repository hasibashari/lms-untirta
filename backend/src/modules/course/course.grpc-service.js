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
        return callback({ code: grpc.status.NOT_FOUND, details: 'Mata kuliah tidak ditemukan' });

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
        return callback({ code: grpc.status.NOT_FOUND, details: 'Mata kuliah tidak ditemukan' });

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
              _count: {
                select: {
                  krsEnrollments: { where: { status: 'APPROVED' } },
                },
              },
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
          id: e.class.id, // Use Class ID so navigation works correctly
          title: `${e.class.course.title} - ${e.class.section}`,
          code: e.class.course.code,
          semester: e.class.course.semester,
          sks: e.class.course.sks,
          teacher: e.class.course.teacher
            ? { id: e.class.course.teacher.id, name: e.class.course.teacher.name }
            : null,
          materialsCount: e.class.course._count.materials || 0,
          studentsCount: e.class._count.krsEnrollments || 0,
          courseId: e.class.course.id, // Keep original courseId for reference
        },
      }));

      callback(null, { courses });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  // Mendapatkan semua kelas yang diajar
  GetTeachingCourses: async (call, callback) => {
    try {
      const { teacherId } = call.request;

      // Find classes where the teacher is either the lecturer or the course teacher
      const classes = await prisma.class.findMany({
        where: {
          OR: [
            { lecturerId: teacherId },
            { course: { teacherId: teacherId } }
          ]
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              code: true,
              semester: true,
              sks: true,
              _count: {
                select: {
                  materials: true
                }
              }
            }
          },
          _count: {
            select: {
              krsEnrollments: { where: { status: 'APPROVED' } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const formatted = classes.map(cls => ({
        id: cls.id, // This is now the Class ID
        title: `${cls.course.title} - ${cls.section}`,
        code: cls.course.code,
        semester: cls.course.semester,
        sks: cls.course.sks,
        createdAt: cls.createdAt.toISOString(),
        materialsCount: cls.course._count.materials || 0,
        studentsCount: cls._count.krsEnrollments || 0,
        section: cls.section,
        courseId: cls.course.id
      }));

      callback(null, { courses: formatted });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  // Mendapatkan semua mahasiswa dalam satu kelas (bisa Class ID atau Course ID)
  GetStudentsByCourse: async (call, callback) => {
    try {
      const { courseId, userId, userRole } = call.request;
      
      // Try finding by Class ID first
      let classOffering = await prisma.class.findUnique({
        where: { id: courseId },
        include: { course: true }
      });

      let whereClause;
      if (classOffering) {
        // ID provided is a Class ID
        whereClause = { classId: classOffering.id };
        
        // Authorization check
        if (userRole === 'DOSEN' && classOffering.lecturerId !== userId && classOffering.course.teacherId !== userId) {
          return callback({
            code: grpc.status.PERMISSION_DENIED,
            details: 'Akses ditolak: Ini bukan kelas Anda',
          });
        }
      } else {
        // Try finding by Course ID
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course)
          return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas atau Mata kuliah tidak ditemukan' });

        if (userRole === 'DOSEN' && course.teacherId !== userId) {
          return callback({
            code: grpc.status.PERMISSION_DENIED,
            details: 'Akses ditolak: Ini bukan mata kuliah Anda',
          });
        }
        whereClause = { class: { courseId: courseId } };
      }

      const enrollments = await prisma.krsEnrollment.findMany({
        where: {
          ...whereClause,
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
      
      // Check if it's a Class ID or Course ID
      const classOffering = await prisma.class.findUnique({
        where: { id: courseId },
        include: { course: true }
      });

      let finalCourseId;
      if (classOffering) {
        finalCourseId = classOffering.courseId;
        if (userRole === 'DOSEN' && classOffering.lecturerId !== userId && classOffering.course.teacherId !== userId) {
          return callback({
            code: grpc.status.PERMISSION_DENIED,
            details: 'Akses ditolak: Ini bukan kelas Anda',
          });
        }
      } else {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course)
          return callback({ code: grpc.status.NOT_FOUND, details: 'Kelas atau Mata kuliah tidak ditemukan' });

        if (userRole === 'DOSEN' && course.teacherId !== userId) {
          return callback({
            code: grpc.status.PERMISSION_DENIED,
            details: 'Akses ditolak: Ini bukan mata kuliah Anda',
          });
        }
        finalCourseId = courseId;
      }

      const availableStudents = await prisma.user.findMany({
        where: {
          role: 'MAHASISWA',
          krsEnrollments: {
            none: {
              class: {
                courseId: finalCourseId,
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
                classes: true,
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
        studentsCount: 0,
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
          details: 'Kode mata kuliah sudah digunakan',
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
        return callback({ code: grpc.status.NOT_FOUND, details: 'Mata kuliah tidak ditemukan' });

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
            details: 'Kode mata kuliah sudah digunakan',
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
              classes: true,
            },
          },
        },
      });
      if (!course)
        return callback({ code: grpc.status.NOT_FOUND, details: 'Mata kuliah tidak ditemukan' });

      await prisma.course.delete({ where: { id: courseId } });
      callback(null, {
        message: 'Mata kuliah berhasil dihapus',
        deletedStudents: 0,
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
        return callback({ code: grpc.status.NOT_FOUND, details: 'Mata kuliah tidak ditemukan' });

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
