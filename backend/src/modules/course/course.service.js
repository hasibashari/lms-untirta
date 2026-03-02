import prisma from '../../config/prisma.js';
import { AppError } from '../../config/errors.js';
import { paginate } from '../../utils/pagination.js';

/**
 * Creates a new course in the database.
 * Checks for unique course code before creation.
 * @param {object} data - Course data (title, description, code).
 * @param {string} teacherId - The ID of the teacher creating the course.
 * @returns {Promise<object>} The created course object.
 * @throws {Error} If the course code is already in use.
 */
const createCourse = async (data, teacherId) => {
  // 1. Cek apakah Kode Mata Kuliah (Unique) sudah ada?
  const existingCourse = await prisma.course.findUnique({
    where: { code: data.code },
  });

  if (existingCourse) {
    throw new AppError(409, 'Kode kelas sudah digunakan');
  }

  // 2. Simpan ke DB
  // Perhatikan cara kita menghubungkan teacherId
  return await prisma.course.create({
    data: {
      ...data, // title, description, code
      teacherId, // Foreign Key ke User
    },
    select: {
      id: true,
      title: true,
      description: true,
      code: true,
      createdAt: true,
      teacher: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

/**
 * Retrieves all courses including teacher information.
 * @returns {Promise<Array<object>>} List of courses.
 */
const getAllCourses = async (query = {}) => {
  const { skip, take, meta } = paginate(query);
  // Kita ingin mengambil data kelas BESERTA nama dosennya
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    }),
    prisma.course.count(),
  ]);

  return { data: courses, pagination: meta(total) };
};

/**
 * Adds a student to a course using their email address.
 * Validates course ownership (if teacher) and ensures the user is a student.
 * @param {string} courseId - The ID of the course.
 * @param {string} studentEmail - The email of the student to enroll.
 * @param {string} teacherId - The ID of the user performing the action.
 * @param {string} teacherRole - The role of the user performing the action.
 * @returns {Promise<object>} The created enrollment object.
 * @throws {Error} If course/student not found, access denied, or already enrolled.
 */
const addStudentToCourse = async (courseId, studentEmail, teacherId, teacherRole) => {
  // 1. Validasi: Pastikan Kelas itu milik Dosen yang sedang login
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AppError(404, 'Kelas tidak ditemukan');
  }

  // 2. Cek Kepemilikan (Authorization Logic)
  // Jika role-nya DOSEN, dia cuma boleh edit kelas miliknya sendiri.
  // Jika role-nya ADMIN, dia boleh edit kelas siapa saja (Bypass).
  if (teacherRole === 'DOSEN' && course.teacherId !== teacherId) {
    throw new AppError(403, 'Akses ditolak: Ini bukan kelas Anda');
  }

  // 2. Cari Mahasiswa by Email
  const student = await prisma.user.findUnique({
    where: { email: studentEmail },
  });

  if (!student) {
    throw new AppError(404, 'Mahasiswa dengan email tersebut tidak ditemukan');
  }

  // Validasi tambahan: Pastikan yang dimasukkan adalah MAHASISWA (bukan Dosen lain)
  if (student.role !== 'MAHASISWA') {
    throw new AppError(400, 'User tersebut bukan mahasiswa');
  }

  // 4. Cek Duplikasi (Idempotency)
  // Cek di tabel Enrollment apakah pasangan User-Course ini sudah ada?
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: courseId,
      },
    },
  });

  if (existingEnrollment) {
    throw new AppError(409, 'Mahasiswa sudah terdaftar di kelas ini');
  }

  // 5. Eksekusi Create Enrollment
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: courseId,
    },
    select: {
      id: true,
      enrolledAt: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Transform response to match expected format
  return {
    enrollmentId: enrollment.id,
    enrolledAt: enrollment.enrolledAt,
    student: enrollment.student,
  };
};

/**
 * Retrieves all courses a student is enrolled in.
 * @param {string} studentId - The ID of the student.
 * @returns {Promise<Array<object>>} List of enrolled courses with teacher info.
 */
const getEnrolledCourses = async studentId => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: studentId },
    select: {
      id: true,
      enrolledAt: true,
      course: {
        select: {
          id: true,
          title: true,
          code: true,
          teacher: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      enrolledAt: 'desc',
    },
  });

  return enrollments.map(enrollment => ({
    enrollmentId: enrollment.id,
    joinedAt: enrollment.enrolledAt,
    course: {
      id: enrollment.course.id,
      title: enrollment.course.title,
      code: enrollment.course.code,
      teacher: {
        id: enrollment.course.teacher.id,
        name: enrollment.course.teacher.name,
      },
    },
  }));
};

/**
 * Retrieves courses taught by a specific teacher (basic info).
 * @param {string} teacherId - The ID of the teacher.
 * @returns {Promise<Array<object>>} List of courses.
 */
const getTeachingCourses = async teacherId => {
  // Ambil semua kelas yang diajar oleh Dosen ini
  const courses = await prisma.course.findMany({
    where: { teacherId },
    select: {
      id: true,
      title: true,
      code: true,
    }
  });

  return courses;
};

/**
 * Retrieves courses taught by a specific teacher including statistics.
 * Uses Prisma's `_count` to efficiently fetch student and material counts.
 * @param {string} teacherId - The ID of the teacher.
 * @returns {Promise<Array<object>>} List of courses with stats.
 */
const getTeachingCoursesWithStats = async teacherId => {
  const courses = await prisma.course.findMany({
    where: { teacherId },
    select: {
      id: true,
      title: true,
      code: true,
      createdAt: true,
      _count: {
        select: {
          students: true,   // Jumlah mahasiswa (nama relation di schema: students)
          materials: true,  // Jumlah materi
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return courses;
};

/**
 * Retrieves the list of students enrolled in a specific course.
 * Validates that the requester is the teacher of the course or an admin.
 * @param {string} courseId - The ID of the course.
 * @param {string} userId - The ID of the user requesting the list.
 * @param {string} userRole - The role of the user.
 * @returns {Promise<Array<object>>} List of enrolled students.
 * @throws {Error} If course not found or access denied.
 */
const getStudentsByCourse = async (courseId, userId, userRole) => {
  // 1. Validasi: Pastikan Kelas tersebut ada
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AppError(404, 'Kelas tidak ditemukan');
  }

  // 2. Authorization: Hanya Dosen pemilik kelas atau Admin yang bisa akses
  if (userRole === 'DOSEN' && course.teacherId !== userId) {
    throw new AppError(403, 'Akses ditolak: Ini bukan kelas Anda');
  }

  // 3. Ambil daftar Enrollment dengan data student
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: {
      id: true,
      enrolledAt: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      enrolledAt: 'asc', // Urutkan dari yang pertama mendaftar
    },
  });

  // 4. Transform data untuk response yang lebih bersih
  return enrollments.map(enrollment => ({
    enrollmentId: enrollment.id,
    enrolledAt: enrollment.enrolledAt,
    student: enrollment.student,
  }));
};

/**
 * Retrieves students who are NOT yet enrolled in a specific course.
 * Useful for finding students to add to a class.
 * @param {string} courseId - The ID of the course.
 * @param {string} userId - The ID of the user requesting the list.
 * @param {string} userRole - The role of the user.
 * @returns {Promise<Array<object>>} List of available students.
 * @throws {Error} If course not found or access denied.
 */
const getAvailableStudentsForCourse = async (courseId, userId, userRole) => {
  // 1. Validasi: Pastikan Kelas tersebut ada
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AppError(404, 'Kelas tidak ditemukan');
  }

  // 2. Authorization: Hanya Dosen pemilik kelas atau Admin yang bisa akses
  if (userRole === 'DOSEN' && course.teacherId !== userId) {
    throw new AppError(403, 'Akses ditolak: Ini bukan kelas Anda');
  }

  // 3. Ambil ID mahasiswa yang sudah enrolled di course ini
  const enrolledStudents = await prisma.enrollment.findMany({
    where: { courseId },
    select: { userId: true },
  });
  const enrolledIds = enrolledStudents.map(e => e.userId);

  // 4. Ambil semua mahasiswa yang BELUM terdaftar di kelas ini
  const availableStudents = await prisma.user.findMany({
    where: {
      role: 'MAHASISWA',
      id: { notIn: enrolledIds.length > 0 ? enrolledIds : [''] }, // Handle empty array
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return availableStudents;
};

/**
 * Adds a student to a course using their User ID.
 * Validates course ownership and ensures the user is a student.
 * @param {string} courseId - The ID of the course.
 * @param {string} studentId - The ID of the student to enroll.
 * @param {string} teacherId - The ID of the user performing the action.
 * @param {string} teacherRole - The role of the user performing the action.
 * @returns {Promise<object>} The created enrollment object.
 * @throws {Error} If course/student not found, access denied, or already enrolled.
 */
const addStudentToCourseById = async (courseId, studentId, teacherId, teacherRole) => {
  // 1. Validasi: Pastikan Kelas itu milik Dosen yang sedang login
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AppError(404, 'Kelas tidak ditemukan');
  }

  // 2. Cek Kepemilikan (Authorization Logic)
  if (teacherRole === 'DOSEN' && course.teacherId !== teacherId) {
    throw new AppError(403, 'Akses ditolak: Ini bukan kelas Anda');
  }

  // 3. Cari Mahasiswa by ID
  const student = await prisma.user.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new AppError(404, 'Mahasiswa tidak ditemukan');
  }

  // Validasi: Pastikan yang dipilih adalah MAHASISWA
  if (student.role !== 'MAHASISWA') {
    throw new AppError(400, 'User tersebut bukan mahasiswa');
  }

  // 4. Cek Duplikasi
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: courseId,
      },
    },
  });

  if (existingEnrollment) {
    throw new AppError(409, 'Mahasiswa sudah terdaftar di kelas ini');
  }

  // 5. Eksekusi Create Enrollment
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: courseId,
    },
    select: {
      id: true,
      enrolledAt: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return {
    enrollmentId: enrollment.id,
    enrolledAt: enrollment.enrolledAt,
    student: enrollment.student,
  };
};

// ========== ADMIN COURSE MANAGEMENT ==========

/**
 * Retrieves all courses with comprehensive details for admin view.
 * Includes counts of students, materials, and assignments.
 */
const adminGetAllCourses = async (query = {}) => {
  const { skip, take, meta } = paginate(query);
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
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
            students: true,
            materials: true,
            assignments: true,
          },
        },
      },
      orderBy: [
        { semester: 'asc' },
        { createdAt: 'desc' },
      ],
      skip,
      take,
    }),
    prisma.course.count(),
  ]);

  return { data: courses, pagination: meta(total) };
};

/**
 * Creates a new course with administrative privileges.
 * Allows setting the teacher explicitly.
 * @param {object} data - Course data.
 * @returns {Promise<object>} The created course.
 */
const adminCreateCourse = async (data) => {
  // Cek kode unik
  const existingCourse = await prisma.course.findUnique({
    where: { code: data.code },
  });

  if (existingCourse) {
    throw new AppError(409, 'Kode kelas sudah digunakan');
  }

  // Jika teacherId diberikan, validasi bahwa user adalah DOSEN
  if (data.teacherId) {
    const teacher = await prisma.user.findUnique({
      where: { id: data.teacherId },
    });

    if (!teacher) {
      throw new AppError(404, 'Dosen tidak ditemukan');
    }

    if (teacher.role !== 'DOSEN') {
      throw new AppError(400, 'User tersebut bukan dosen');
    }
  }

  return await prisma.course.create({
    data: {
      title: data.title,
      description: data.description,
      code: data.code,
      semester: data.semester || null,
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
};

/**
 * Updates an existing course (Admin).
 * @param {string} courseId - The ID of the course.
 * @param {object} data - Update data.
 * @returns {Promise<object>} The updated course.
 */
const adminUpdateCourse = async (courseId, data) => {
  // Cek apakah course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AppError(404, 'Kelas tidak ditemukan');
  }

  // Jika mengubah code, cek apakah sudah dipakai
  if (data.code && data.code !== course.code) {
    const existingCourse = await prisma.course.findUnique({
      where: { code: data.code },
    });

    if (existingCourse) {
      throw new AppError(409, 'Kode kelas sudah digunakan');
    }
  }

  // Jika mengubah teacherId, validasi
  if (data.teacherId) {
    const teacher = await prisma.user.findUnique({
      where: { id: data.teacherId },
    });

    if (!teacher) {
      throw new AppError(404, 'Dosen tidak ditemukan');
    }

    if (teacher.role !== 'DOSEN') {
      throw new AppError(400, 'User tersebut bukan dosen');
    }
  }

  return await prisma.course.update({
    where: { id: courseId },
    data: {
      title: data.title !== undefined ? data.title : undefined,
      description: data.description !== undefined ? data.description : undefined,
      code: data.code !== undefined ? data.code : undefined,
      semester: data.semester !== undefined ? data.semester : undefined,
      sks: data.sks !== undefined ? data.sks : undefined,
      teacherId: data.teacherId !== undefined ? data.teacherId : undefined,
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
};

/**
 * Deletes a course (Admin).
 * Cascades delete to related records via Prisma schema configuration.
 * @param {string} courseId - The ID of the course.
 */
const adminDeleteCourse = async (courseId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  if (!course) {
    throw new AppError(404, 'Kelas tidak ditemukan');
  }

  // Delete related records first (Prisma cascade)
  // Enrollment, Materials, Assignments (and their Submissions) will be deleted
  await prisma.course.delete({
    where: { id: courseId },
  });

  return {
    message: 'Kelas berhasil dihapus',
    deletedEnrollments: course._count.students,
  };
};

/**
 * Assigns a teacher to a course (Admin).
 * @param {string} courseId - The ID of the course.
 * @param {string} teacherId - The ID of the teacher.
 */
const adminAssignTeacher = async (courseId, teacherId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AppError(404, 'Kelas tidak ditemukan');
  }

  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
  });

  if (!teacher) {
    throw new AppError(404, 'Dosen tidak ditemukan');
  }

  if (teacher.role !== 'DOSEN') {
    throw new AppError(400, 'User tersebut bukan dosen');
  }

  return await prisma.course.update({
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
};

export {
  createCourse,
  getAllCourses,
  addStudentToCourse,
  addStudentToCourseById,
  getEnrolledCourses,
  getTeachingCourses,
  getTeachingCoursesWithStats,
  getStudentsByCourse,
  getAvailableStudentsForCourse,
  // Admin Course Management
  adminGetAllCourses,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  adminAssignTeacher,
};
