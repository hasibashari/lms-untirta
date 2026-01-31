import prisma from '../config/prisma.js';

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

// --- Get Teaching Courses WITH Stats (Optimized - Single Query) ---
// Menghindari N+1 query dengan menggunakan _count Prisma
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

// --- Get Available Students for Enrollment ---
// Mengambil daftar mahasiswa yang belum terdaftar di kelas tertentu
const getAvailableStudentsForCourse = async (courseId, userId, userRole) => {
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

// --- Add Student to Course by ID ---
// Versi baru: enroll berdasarkan studentId (bukan email)
const addStudentToCourseById = async (courseId, studentId, teacherId, teacherRole) => {
  // 1. Validasi: Pastikan Kelas itu milik Dosen yang sedang login
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Kelas tidak ditemukan');
  }

  // 2. Cek Kepemilikan (Authorization Logic)
  if (teacherRole === 'DOSEN' && course.teacherId !== teacherId) {
    throw new Error('Akses ditolak: Ini bukan kelas Anda');
  }

  // 3. Cari Mahasiswa by ID
  const student = await prisma.user.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new Error('Mahasiswa tidak ditemukan');
  }

  // Validasi: Pastikan yang dipilih adalah MAHASISWA
  if (student.role !== 'MAHASISWA') {
    throw new Error('User tersebut bukan mahasiswa');
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
    throw new Error('Mahasiswa sudah terdaftar di kelas ini');
  }

  // 5. Eksekusi Create Enrollment
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: courseId,
    },
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

  return {
    enrollmentId: enrollment.id,
    enrolledAt: enrollment.enrolledAt,
    student: enrollment.student,
  };
};

// ========== ADMIN COURSE MANAGEMENT ==========

// --- Admin: Get All Courses with Details ---
const adminGetAllCourses = async () => {
  return await prisma.course.findMany({
    include: {
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
  });
};

// --- Admin: Create Course ---
const adminCreateCourse = async (data) => {
  // Cek kode unik
  const existingCourse = await prisma.course.findUnique({
    where: { code: data.code },
  });

  if (existingCourse) {
    throw new Error('Kode kelas sudah digunakan');
  }

  // Jika teacherId diberikan, validasi bahwa user adalah DOSEN
  if (data.teacherId) {
    const teacher = await prisma.user.findUnique({
      where: { id: data.teacherId },
    });

    if (!teacher) {
      throw new Error('Dosen tidak ditemukan');
    }

    if (teacher.role !== 'DOSEN') {
      throw new Error('User tersebut bukan dosen');
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
    include: {
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

// --- Admin: Update Course ---
const adminUpdateCourse = async (courseId, data) => {
  // Cek apakah course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Kelas tidak ditemukan');
  }

  // Jika mengubah code, cek apakah sudah dipakai
  if (data.code && data.code !== course.code) {
    const existingCourse = await prisma.course.findUnique({
      where: { code: data.code },
    });

    if (existingCourse) {
      throw new Error('Kode kelas sudah digunakan');
    }
  }

  // Jika mengubah teacherId, validasi
  if (data.teacherId) {
    const teacher = await prisma.user.findUnique({
      where: { id: data.teacherId },
    });

    if (!teacher) {
      throw new Error('Dosen tidak ditemukan');
    }

    if (teacher.role !== 'DOSEN') {
      throw new Error('User tersebut bukan dosen');
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
    include: {
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

// --- Admin: Delete Course ---
const adminDeleteCourse = async (courseId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  if (!course) {
    throw new Error('Kelas tidak ditemukan');
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

// --- Admin: Assign Teacher to Course ---
const adminAssignTeacher = async (courseId, teacherId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Kelas tidak ditemukan');
  }

  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
  });

  if (!teacher) {
    throw new Error('Dosen tidak ditemukan');
  }

  if (teacher.role !== 'DOSEN') {
    throw new Error('User tersebut bukan dosen');
  }

  return await prisma.course.update({
    where: { id: courseId },
    data: { teacherId },
    include: {
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

// ========== KRS (KARTU RENCANA STUDI) ==========

// --- Get Available Courses for KRS ---
const getAvailableCoursesForKRS = async (studentId, semester = null) => {
  // Get courses that student is NOT enrolled in
  const enrolledCourses = await prisma.enrollment.findMany({
    where: { userId: studentId },
    select: { courseId: true },
  });

  const enrolledIds = enrolledCourses.map(e => e.courseId);

  // Build where clause
  const whereClause = {};

  // Only add notIn filter if there are enrolled courses
  if (enrolledIds.length > 0) {
    whereClause.id = { notIn: enrolledIds };
  }

  // Filter by semester if provided
  if (semester) {
    whereClause.semester = parseInt(semester);
  }

  const courses = await prisma.course.findMany({
    where: whereClause,
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          students: true,
        },
      },
    },
    orderBy: [
      { semester: 'asc' },
      { title: 'asc' },
    ],
  });

  return courses.map(course => ({
    id: course.id,
    title: course.title,
    code: course.code,
    description: course.description,
    semester: course.semester,
    sks: course.sks || 3,
    teacher: course.teacher,
    studentCount: course._count.students,
  }));
};

// --- Self Enroll to Course ---
const selfEnrollCourse = async (courseId, studentId) => {
  // Validasi course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!course) {
    throw new Error('Mata kuliah tidak ditemukan');
  }

  // Cek duplikasi
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: studentId,
        courseId: courseId,
      },
    },
  });

  if (existingEnrollment) {
    throw new Error('Anda sudah terdaftar di mata kuliah ini');
  }

  // Create enrollment
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: studentId,
      courseId: courseId,
    },
    include: {
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
  });

  return {
    enrollmentId: enrollment.id,
    enrolledAt: enrollment.enrolledAt,
    course: enrollment.course,
  };
};

// --- Get My KRS ---
const getMyKRS = async (studentId, semester = null) => {
  const whereClause = { userId: studentId };

  const enrollments = await prisma.enrollment.findMany({
    where: whereClause,
    include: {
      course: {
        select: {
          id: true,
          title: true,
          code: true,
          description: true,
          semester: true,
          sks: true,
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

  // Filter by semester if provided
  let filteredEnrollments = enrollments;
  if (semester) {
    filteredEnrollments = enrollments.filter(e => e.course.semester === parseInt(semester));
  }

  return filteredEnrollments.map(e => ({
    enrollmentId: e.id,
    enrolledAt: e.enrolledAt,
    course: {
      id: e.course.id,
      title: e.course.title,
      code: e.course.code,
      description: e.course.description,
      semester: e.course.semester,
      sks: e.course.sks || 3,
      teacher: e.course.teacher,
    },
  }));
};

// --- Get Study Results (Hasil Studi) ---
const getStudyResults = async (studentId) => {
  // Get all enrollments with assignments and grades
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: studentId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          code: true,
          semester: true,
          sks: true,
          teacher: {
            select: {
              name: true,
            },
          },
          assignments: {
            select: {
              id: true,
              title: true,
              submissions: {
                where: { studentId },
                select: {
                  grade: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      enrolledAt: 'asc',
    },
  });

  // Calculate grades per course
  const coursesWithGrades = enrollments.map(enrollment => {
    const course = enrollment.course;
    const assignments = course.assignments;

    let totalGrade = 0;
    let gradedCount = 0;

    for (const assignment of assignments) {
      const submission = assignment.submissions[0];
      if (submission && submission.grade !== null) {
        totalGrade += submission.grade;
        gradedCount++;
      }
    }

    const averageGrade = gradedCount > 0 ? totalGrade / gradedCount : null;

    // Convert to letter grade
    let letterGrade = '-';
    let gradePoint = 0;

    if (averageGrade !== null) {
      if (averageGrade >= 85) { letterGrade = 'A'; gradePoint = 4.0; }
      else if (averageGrade >= 80) { letterGrade = 'A-'; gradePoint = 3.7; }
      else if (averageGrade >= 75) { letterGrade = 'B+'; gradePoint = 3.3; }
      else if (averageGrade >= 70) { letterGrade = 'B'; gradePoint = 3.0; }
      else if (averageGrade >= 65) { letterGrade = 'B-'; gradePoint = 2.7; }
      else if (averageGrade >= 60) { letterGrade = 'C+'; gradePoint = 2.3; }
      else if (averageGrade >= 55) { letterGrade = 'C'; gradePoint = 2.0; }
      else if (averageGrade >= 50) { letterGrade = 'D'; gradePoint = 1.0; }
      else { letterGrade = 'E'; gradePoint = 0; }
    }

    return {
      courseId: course.id,
      courseCode: course.code,
      courseName: course.title,
      semester: course.semester,
      teacherName: course.teacher?.name || 'Unknown',
      sks: course.sks || 3,
      averageScore: averageGrade ? Math.round(averageGrade * 100) / 100 : null,
      letterGrade,
      gradePoint,
      totalAssignments: assignments.length,
      gradedAssignments: gradedCount,
      enrolledAt: enrollment.enrolledAt,
    };
  });

  // Calculate IPS (Index Prestasi Semester) and IPK
  let totalSKS = 0;
  let totalPoints = 0;
  let completedCourses = 0;

  for (const course of coursesWithGrades) {
    if (course.averageScore !== null) {
      totalSKS += course.sks;
      totalPoints += course.gradePoint * course.sks;
      completedCourses++;
    }
  }

  const ipk = totalSKS > 0 ? Math.round((totalPoints / totalSKS) * 100) / 100 : 0;

  return {
    courses: coursesWithGrades,
    summary: {
      totalCourses: coursesWithGrades.length,
      completedCourses,
      totalSKS,
      ipk,
    },
  };
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
  // KRS
  getAvailableCoursesForKRS,
  selfEnrollCourse,
  getMyKRS,
  getStudyResults,
};
