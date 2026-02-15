import prisma from '../../config/prisma.js';
import { getMaxSKS, isValidStatusTransition, KRS_STATUS } from '../../utils/academic.util.js';

// ========================================================================
// KRS SERVICE
// Mengelola pendaftaran KRS mahasiswa ke kelas offering.
// Modul ini TIDAK mengimpor service dari module lain.
// Semua akses data melalui Prisma.
// ========================================================================

// ======================== AVAILABLE CLASSES ========================

/**
 * Ambil kelas offering yang tersedia untuk KRS mahasiswa.
 * Hanya menampilkan kelas yang:
 *  1. isEnrollmentOpen = true
 *  2. Mahasiswa belum terdaftar
 *  3. Kapasitas belum penuh
 */
const getAvailableClasses = async (studentId, filters = {}) => {
  // Ambil kelas yang sudah didaftarkan mahasiswa ini
  const enrolledClasses = await prisma.krsEnrollment.findMany({
    where: { studentId },
    select: { classId: true },
  });

  const enrolledClassIds = enrolledClasses.map(e => e.classId);

  // Build where clause
  const where = {
    isEnrollmentOpen: true,
  };

  if (enrolledClassIds.length > 0) {
    where.id = { notIn: enrolledClassIds };
  }

  if (filters.academicYear) {
    where.academicYear = filters.academicYear;
  }

  if (filters.semesterType) {
    where.semesterType = filters.semesterType;
  }

  // Filter berdasarkan semester course (jika diberikan)
  if (filters.semester) {
    where.course = { semester: parseInt(filters.semester) };
  }

  const classes = await prisma.class.findMany({
    where,
    select: {
      id: true,
      academicYear: true,
      semesterType: true,
      section: true,
      schedule: true,
      room: true,
      capacity: true,
      isEnrollmentOpen: true,
      course: {
        select: {
          id: true,
          title: true,
          code: true,
          description: true,
          semester: true,
          sks: true,
        },
      },
      lecturer: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          krsEnrollments: true,
        },
      },
    },
    orderBy: [
      { course: { semester: 'asc' } },
      { course: { code: 'asc' } },
      { section: 'asc' },
    ],
  });

  return classes.map(cls => ({
    id: cls.id,
    academicYear: cls.academicYear,
    semesterType: cls.semesterType,
    section: cls.section,
    schedule: cls.schedule,
    room: cls.room,
    capacity: cls.capacity,
    enrolledCount: cls._count.krsEnrollments,
    isEnrollmentOpen: cls.isEnrollmentOpen,
    course: {
      id: cls.course.id,
      title: cls.course.title,
      code: cls.course.code,
      description: cls.course.description,
      semester: cls.course.semester,
      sks: cls.course.sks || 3,
    },
    lecturer: cls.lecturer,
  }));
};

// ======================== ENROLL ========================

/**
 * Mahasiswa mendaftar ke kelas offering (tambah ke KRS).
 * Validasi:
 *  1. Kelas harus ada dan enrollment harus terbuka
 *  2. Kapasitas belum penuh
 *  3. Mahasiswa belum terdaftar di kelas ini
 *  4. Mahasiswa belum terdaftar di kelas lain untuk course yang sama (semester & tahun sama)
 *  5. Total SKS tidak melebihi batas
 */
const enrollClass = async (studentId, classId) => {
  // 1. Validasi kelas ada dan terbuka
  const classData = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      capacity: true,
      isEnrollmentOpen: true,
      academicYear: true,
      semesterType: true,
      courseId: true,
      course: {
        select: {
          id: true,
          title: true,
          code: true,
          sks: true,
        },
      },
      _count: {
        select: {
          krsEnrollments: true,
        },
      },
    },
  });

  if (!classData) {
    throw new Error('Kelas offering tidak ditemukan');
  }

  if (!classData.isEnrollmentOpen) {
    throw new Error('Pendaftaran kelas ini belum dibuka');
  }

  // 2. Cek kapasitas
  if (classData._count.krsEnrollments >= classData.capacity) {
    throw new Error('Kapasitas kelas sudah penuh');
  }

  // 3. Cek duplikasi di kelas yang sama
  const existingEnrollment = await prisma.krsEnrollment.findUnique({
    where: {
      studentId_classId: {
        studentId,
        classId,
      },
    },
    select: { id: true },
  });

  if (existingEnrollment) {
    throw new Error('Anda sudah terdaftar di kelas ini');
  }

  // 4. Cek apakah sudah mengambil course yang sama di semester & tahun yang sama
  const duplicateCourse = await prisma.krsEnrollment.findFirst({
    where: {
      studentId,
      class: {
        courseId: classData.courseId,
        academicYear: classData.academicYear,
        semesterType: classData.semesterType,
      },
    },
    select: {
      id: true,
      class: {
        select: { section: true },
      },
    },
  });

  if (duplicateCourse) {
    throw new Error(
      `Anda sudah mengambil mata kuliah ini di kelas ${duplicateCourse.class.section}`
    );
  }

  // 5. Cek batas SKS
  const currentEnrollments = await prisma.krsEnrollment.findMany({
    where: {
      studentId,
      class: {
        academicYear: classData.academicYear,
        semesterType: classData.semesterType,
      },
      status: { in: ['DRAFT', 'SUBMITTED', 'APPROVED'] },
    },
    select: {
      class: {
        select: {
          course: {
            select: { sks: true },
          },
        },
      },
    },
  });

  const currentSKS = currentEnrollments.reduce(
    (total, e) => total + (e.class.course.sks || 3),
    0
  );
  const courseSKS = classData.course.sks || 3;
  const maxSKS = getMaxSKS(null); // TODO: pass actual IPK when available

  if (currentSKS + courseSKS > maxSKS) {
    throw new Error(
      `Total SKS melebihi batas (${currentSKS}+${courseSKS} > ${maxSKS} SKS)`
    );
  }

  // 6. Create KRS enrollment
  const enrollment = await prisma.krsEnrollment.create({
    data: {
      studentId,
      classId,
      status: KRS_STATUS.DRAFT,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      class: {
        select: {
          id: true,
          section: true,
          schedule: true,
          room: true,
          academicYear: true,
          semesterType: true,
          course: {
            select: {
              id: true,
              title: true,
              code: true,
              sks: true,
            },
          },
          lecturer: {
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
    status: enrollment.status,
    createdAt: enrollment.createdAt,
    class: enrollment.class,
  };
};

// ======================== DROP (UNENROLL) ========================

/**
 * Mahasiswa drop kelas dari KRS.
 * Hanya bisa drop jika status masih DRAFT atau REJECTED.
 */
const dropClass = async (studentId, classId) => {
  const enrollment = await prisma.krsEnrollment.findUnique({
    where: {
      studentId_classId: {
        studentId,
        classId,
      },
    },
    select: {
      id: true,
      status: true,
      class: {
        select: {
          course: {
            select: { title: true, code: true },
          },
          section: true,
        },
      },
    },
  });

  if (!enrollment) {
    throw new Error('Anda tidak terdaftar di kelas ini');
  }

  if (enrollment.status === KRS_STATUS.APPROVED) {
    throw new Error('Tidak dapat menghapus mata kuliah yang sudah disetujui');
  }

  if (enrollment.status === KRS_STATUS.SUBMITTED) {
    throw new Error('Tidak dapat menghapus mata kuliah yang sudah disubmit. Tarik kembali KRS terlebih dahulu');
  }

  await prisma.krsEnrollment.delete({
    where: {
      studentId_classId: {
        studentId,
        classId,
      },
    },
  });

  return {
    message: `Berhasil menghapus ${enrollment.class.course.code} - ${enrollment.class.course.title} (Kelas ${enrollment.class.section}) dari KRS`,
    classId,
  };
};

// ======================== MY KRS ========================

/**
 * Ambil daftar KRS mahasiswa (enrolled classes).
 * Bisa difilter berdasarkan academicYear dan semesterType.
 */
const getMyKRS = async (studentId, filters = {}) => {
  const where = { studentId };

  if (filters.academicYear || filters.semesterType) {
    where.class = {};
    if (filters.academicYear) {
      where.class.academicYear = filters.academicYear;
    }
    if (filters.semesterType) {
      where.class.semesterType = filters.semesterType;
    }
  }

  const enrollments = await prisma.krsEnrollment.findMany({
    where,
    select: {
      id: true,
      status: true,
      note: true,
      createdAt: true,
      updatedAt: true,
      class: {
        select: {
          id: true,
          section: true,
          schedule: true,
          room: true,
          academicYear: true,
          semesterType: true,
          course: {
            select: {
              id: true,
              title: true,
              code: true,
              description: true,
              semester: true,
              sks: true,
            },
          },
          lecturer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Hitung total SKS
  const totalSKS = enrollments.reduce(
    (total, e) => total + (e.class.course.sks || 3),
    0
  );

  return {
    enrollments: enrollments.map(e => ({
      enrollmentId: e.id,
      status: e.status,
      note: e.note,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      class: e.class,
    })),
    summary: {
      totalCourses: enrollments.length,
      totalSKS,
      maxSKS: getMaxSKS(null), // TODO: pass actual IPK
    },
  };
};

// ======================== SUBMIT KRS ========================

/**
 * Submit KRS — ubah semua enrollment DRAFT di semester tertentu menjadi SUBMITTED.
 */
const submitKRS = async (studentId, academicYear, semesterType) => {
  // Cari semua enrollment DRAFT di semester ini
  const draftEnrollments = await prisma.krsEnrollment.findMany({
    where: {
      studentId,
      status: KRS_STATUS.DRAFT,
      class: {
        academicYear,
        semesterType,
      },
    },
    select: { id: true },
  });

  if (draftEnrollments.length === 0) {
    throw new Error('Tidak ada mata kuliah dalam status draft untuk disubmit');
  }

  // Update semua menjadi SUBMITTED
  const result = await prisma.krsEnrollment.updateMany({
    where: {
      id: { in: draftEnrollments.map(e => e.id) },
    },
    data: {
      status: KRS_STATUS.SUBMITTED,
    },
  });

  return {
    message: `${result.count} mata kuliah berhasil disubmit untuk persetujuan`,
    submittedCount: result.count,
    academicYear,
    semesterType,
  };
};

// ======================== UPDATE STATUS (DOSEN / ADMIN) ========================

/**
 * Update status satu KRS enrollment (approve/reject).
 * Hanya bisa dilakukan oleh Dosen PA atau Admin.
 */
const updateEnrollmentStatus = async (enrollmentId, newStatus, note = null) => {
  const enrollment = await prisma.krsEnrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      status: true,
      studentId: true,
      class: {
        select: {
          section: true,
          course: { select: { title: true, code: true } },
        },
      },
    },
  });

  if (!enrollment) {
    throw new Error('KRS enrollment tidak ditemukan');
  }

  // Validasi transisi status
  if (!isValidStatusTransition(enrollment.status, newStatus)) {
    throw new Error(
      `Tidak dapat mengubah status dari ${enrollment.status} ke ${newStatus}`
    );
  }

  const updated = await prisma.krsEnrollment.update({
    where: { id: enrollmentId },
    data: {
      status: newStatus,
      note: note || null,
    },
    select: {
      id: true,
      status: true,
      note: true,
      updatedAt: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      class: {
        select: {
          section: true,
          course: {
            select: { title: true, code: true },
          },
        },
      },
    },
  });

  return updated;
};

// ======================== PENDING KRS (DOSEN/ADMIN VIEW) ========================

/**
 * Ambil daftar KRS yang menunggu persetujuan (status SUBMITTED).
 * Untuk tampilan Dosen PA / Admin.
 */
const getPendingKRS = async (filters = {}) => {
  const where = { status: KRS_STATUS.SUBMITTED };

  if (filters.academicYear || filters.semesterType) {
    where.class = {};
    if (filters.academicYear) {
      where.class.academicYear = filters.academicYear;
    }
    if (filters.semesterType) {
      where.class.semesterType = filters.semesterType;
    }
  }

  const enrollments = await prisma.krsEnrollment.findMany({
    where,
    select: {
      id: true,
      status: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      class: {
        select: {
          id: true,
          section: true,
          academicYear: true,
          semesterType: true,
          course: {
            select: {
              id: true,
              title: true,
              code: true,
              sks: true,
            },
          },
          lecturer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return enrollments;
};

// ======================== LEGACY COMPAT ========================
// Fungsi-fungsi berikut menjaga kompatibilitas dengan frontend lama
// yang masih menggunakan endpoint /courses/available, /courses/my-krs, dll.

/**
 * Get available courses for KRS (legacy — operates on Course, not Class).
 * Ini menjaga kompatibilitas dengan frontend lama.
 */
const getAvailableCoursesLegacy = async (studentId, semester = null) => {
  const enrolledCourses = await prisma.enrollment.findMany({
    where: { userId: studentId },
    select: { courseId: true },
  });

  const enrolledIds = enrolledCourses.map(e => e.courseId);

  const whereClause = {};

  if (enrolledIds.length > 0) {
    whereClause.id = { notIn: enrolledIds };
  }

  if (semester) {
    whereClause.semester = parseInt(semester);
  }

  const courses = await prisma.course.findMany({
    where: whereClause,
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

/**
 * Self enroll to course (legacy — operates on Enrollment, not KrsEnrollment).
 */
const selfEnrollCourseLegacy = async (courseId, studentId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });

  if (!course) {
    throw new Error('Mata kuliah tidak ditemukan');
  }

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: studentId,
        courseId: courseId,
      },
    },
    select: { id: true },
  });

  if (existingEnrollment) {
    throw new Error('Anda sudah terdaftar di mata kuliah ini');
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      userId: studentId,
      courseId: courseId,
    },
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
  });

  return {
    enrollmentId: enrollment.id,
    enrolledAt: enrollment.enrolledAt,
    course: enrollment.course,
  };
};

/**
 * Self unenroll from course (legacy — operates on Enrollment).
 */
const selfUnenrollCourseLegacy = async (courseId, studentId) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: studentId,
        courseId: courseId,
      },
    },
    select: { id: true },
  });

  if (!enrollment) {
    throw new Error('Anda tidak terdaftar di mata kuliah ini');
  }

  const deleted = await prisma.enrollment.delete({
    where: {
      userId_courseId: {
        userId: studentId,
        courseId: courseId,
      },
    },
    select: {
      course: {
        select: {
          id: true,
          title: true,
          code: true,
        },
      },
    },
  });

  return {
    message: 'Berhasil menghapus mata kuliah dari KRS',
    course: deleted.course,
  };
};

/**
 * Get my KRS (legacy — operates on Enrollment).
 */
const getMyKRSLegacy = async (studentId, semester = null) => {
  const whereClause = { userId: studentId };

  const enrollments = await prisma.enrollment.findMany({
    where: whereClause,
    select: {
      id: true,
      enrolledAt: true,
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

  let filteredEnrollments = enrollments;
  if (semester) {
    filteredEnrollments = enrollments.filter(
      e => e.course.semester === parseInt(semester)
    );
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

export {
  // New KRS (Class-based)
  getAvailableClasses,
  enrollClass,
  dropClass,
  getMyKRS,
  submitKRS,
  updateEnrollmentStatus,
  getPendingKRS,
  // Legacy compat (Course-based, for existing frontend)
  getAvailableCoursesLegacy,
  selfEnrollCourseLegacy,
  selfUnenrollCourseLegacy,
  getMyKRSLegacy,
};
