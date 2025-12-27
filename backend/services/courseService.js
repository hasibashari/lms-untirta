import { prisma } from '../config/prisma.js';

// --- Create a new course ---
const createCourse = async (data, teacherId) => {
  // 1. Cek apakah Kode Mata Kuliah (Unique) sudah ada?
  const existingCourse = await prisma.course.findUnique({
    where: { code: data.code },
  });

  if (existingCourse) {
    throw new Error('Kode kelas sudah digunakan');
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
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      createdAt: true,
    },
  });
};

// --- Get all courses with teacher info ---
const getAllCourses = async () => {
  // Kita ingin mengambil data kelas BESERTA nama dosennya
  return await prisma.course.findMany({
    include: {
      teacher: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Add Studen

const addStudentToCourse = async (courseId, studentEmail, teacherId, teacherRole) => {
  // 1. Validasi: Pastikan Kelas itu milik Dosen yang sedang login
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Kelas tidak ditemukan');
  }

  // 2. Cek Kepemilikan (Authorization Logic)
  // Jika role-nya DOSEN, dia cuma boleh edit kelas miliknya sendiri.
  // Jika role-nya ADMIN, dia boleh edit kelas siapa saja (Bypass).
  if (teacherRole === 'DOSEN' && course.teacherId !== teacherId) {
    throw new Error('Akses ditolak: Ini bukan kelas Anda');
  }

  // 2. Cari Mahasiswa by Email
  const student = await prisma.user.findUnique({
    where: { email: studentEmail },
  });

  if (!student) {
    throw new Error('Mahasiswa dengan email tersebut tidak ditemukan');
  }

  // Validasi tambahan: Pastikan yang dimasukkan adalah MAHASISWA (bukan Dosen lain)
  if (student.role !== 'MAHASISWA') {
    throw new Error('User tersebut bukan mahasiswa');
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
    throw new Error('Mahasiswa sudah terdaftar di kelas ini');
  }

  // 5. Eksekusi Create Enrollment
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: courseId,
    },
    // Include data student supaya nanti return response-nya cantik (ada nama & email)
    include: {
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

// --- Get Teaching Courses (For Dosen) ---
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

// --- Get Students by Course ---
const getStudentsByCourse = async (courseId, userId, userRole) => {
  // 1. Validasi: Pastikan Kelas tersebut ada
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Kelas tidak ditemukan');
  }

  // 2. Authorization: Hanya Dosen pemilik kelas atau Admin yang bisa akses
  if (userRole === 'DOSEN' && course.teacherId !== userId) {
    throw new Error('Akses ditolak: Ini bukan kelas Anda');
  }

  // 3. Ambil daftar Enrollment dengan data student
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: {
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

export {
  createCourse,
  getAllCourses,
  addStudentToCourse,
  getEnrolledCourses,
  getTeachingCourses,
  getStudentsByCourse,
};
