import prisma from '../../config/prisma.js';
import { getMaxSKS, isValidStatusTransition, KRS_STATUS } from '../../utils/academic.util.js';

// ========================================================================
// KRS SERVICE
// Mengelola pendaftaran KRS mahasiswa ke kelas offering.
// Modul ini TIDAK mengimpor service dari module lain.
// Semua akses data melalui Prisma.
// ========================================================================

// ======================== CUMULATIVE GPA (IPK) ========================

/**
 * Hitung IPK kumulatif mahasiswa dari semua FinalGrade FINALIZED
 * di semester COMPLETED.
 *
 * Hanya memperhitungkan:
 *   - FinalGrade.status = 'FINALIZED'
 *   - AcademicSemester.status = 'COMPLETED'
 *
 * Jika mahasiswa belum memiliki nilai (semester pertama), return null.
 *
 * @param {string} studentId
 * @returns {Promise<{ ipk: number|null, totalSKS: number, totalPoints: number, courseCount: number }>}
 */
const calculateCumulativeIPK = async (studentId) => {
  const finalizedGrades = await prisma.finalGrade.findMany({
    where: {
      studentId,
      status: 'FINALIZED',
      academicSemester: {
        status: 'CLOSED',
      },
    },
    select: {
      gradePoint: true,
      class: {
        select: {
          course: {
            select: { sks: true },
          },
        },
      },
    },
  });

  if (finalizedGrades.length === 0) {
    return { ipk: null, totalSKS: 0, totalPoints: 0, courseCount: 0 };
  }

  let totalSKS = 0;
  let totalPoints = 0;

  for (const grade of finalizedGrades) {
    const sks = grade.class.course.sks || 3;
    totalSKS += sks;
    totalPoints += grade.gradePoint * sks;
  }

  const ipk = totalSKS > 0
    ? Math.round((totalPoints / totalSKS) * 100) / 100
    : null;

  return { ipk, totalSKS, totalPoints, courseCount: finalizedGrades.length };
};

/**
 * Ambil info kelayakan SKS mahasiswa: IPK kumulatif → batas SKS.
 * Digunakan oleh frontend untuk menampilkan info "IPK Anda X → maks Y SKS".
 *
 * @param {string} studentId
 * @param {string} academicSemesterId
 * @returns {Promise<object>}
 */
const getSksEligibility = async (studentId, academicSemesterId) => {
  const { ipk, totalSKS: cumulativeSKS, courseCount } = await calculateCumulativeIPK(studentId);
  const maxSKS = getMaxSKS(ipk);

  // Current semester enrollment SKS
  const currentEnrollments = await prisma.krsEnrollment.findMany({
    where: {
      studentId,
      class: { academicSemesterId },
      status: { in: ['DRAFT', 'SUBMITTED', 'APPROVED'] },
    },
    select: {
      class: {
        select: { course: { select: { sks: true } } },
      },
    },
  });

  const currentSKS = currentEnrollments.reduce(
    (total, e) => total + (e.class.course.sks || 3), 0
  );

  return {
    ipk,
    cumulativeSKS,
    courseCount,
    isFirstSemester: courseCount === 0,
    maxSKS,
    currentSKS,
    remainingSKS: maxSKS - currentSKS,
  };
};

// ======================== ENROLLMENT PERIOD GUARD ========================

/**
 * Validasi bahwa masa pengisian KRS masih terbuka.
 * Cek:
 *  1. Semester harus ada
 *  2. Status semester harus OPEN
 *
 * @param {string} academicSemesterId
 * @throws Error jika masa KRS tidak terbuka
 */
const assertEnrollmentPeriodOpen = async (academicSemesterId) => {
  const semester = await prisma.academicSemester.findUnique({
    where: { id: academicSemesterId },
    select: {
      status: true,
      academicYear: true,
      semesterType: true,
    },
  });

  if (!semester) {
    throw new Error('Semester akademik tidak ditemukan');
  }

  if (semester.status !== 'OPEN') {
    throw new Error(
      `Masa pengisian KRS untuk semester ${semester.academicYear} ${semester.semesterType} belum dibuka atau sudah ditutup (status: ${semester.status})`
    );
  }
};

// ======================== AVAILABLE CLASSES ========================

/**
 * Ambil kelas offering yang tersedia untuk KRS mahasiswa.
 * Hanya menampilkan kelas yang:
 *  1. Semester dalam status OPEN (atau isEnrollmentOpen = true)
 *  2. Mahasiswa belum terdaftar
 *  3. Kapasitas belum penuh
 *
 * Returns _meta with diagnostics when result is empty, so frontend can
 * display actionable messages to the student.
 */
const getAvailableClasses = async (studentId, filters = {}) => {
  // 1. Resolve the target academic semester
  let targetSemesterId = filters.academicSemesterId;

  // If no specific semester requested, auto-resolve the active OPEN semester
  if (!targetSemesterId) {
    const activeSemester = await prisma.academicSemester.findFirst({
      where: { isActive: true },
      select: { id: true, status: true },
    });
    if (activeSemester) {
      targetSemesterId = activeSemester.id;
    }
  }

  // 2. Validate semester status for diagnostics
  let semesterDiag = null;
  if (targetSemesterId) {
    semesterDiag = await prisma.academicSemester.findUnique({
      where: { id: targetSemesterId },
      select: {
        id: true,
        academicYear: true,
        semesterType: true,
        status: true,
        isActive: true,
        _count: { select: { classes: true } },
      },
    });
  }

  // 3. Ambil kelas yang sudah didaftarkan mahasiswa ini
  const enrolledClasses = await prisma.krsEnrollment.findMany({
    where: { studentId },
    select: { classId: true },
  });

  const enrolledClassIds = enrolledClasses.map(e => e.classId);

  // 4. Build where clause
  const where = {
    isEnrollmentOpen: true,
  };

  if (enrolledClassIds.length > 0) {
    where.id = { notIn: enrolledClassIds };
  }

  if (targetSemesterId) {
    where.academicSemesterId = targetSemesterId;
  }

  // Filter berdasarkan semester course (jika diberikan)
  if (filters.semester) {
    where.course = { semester: parseInt(filters.semester) };
  }

  const classes = await prisma.class.findMany({
    where,
    select: {
      id: true,
      academicSemesterId: true,
      academicSemester: {
        select: {
          id: true,
          academicYear: true,
          semesterType: true,
        },
      },
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

  const result = classes.map(cls => ({
    id: cls.id,
    academicSemesterId: cls.academicSemesterId,
    academicYear: cls.academicSemester.academicYear,
    semesterType: cls.academicSemester.semesterType,
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

  // 5. Build diagnostic metadata when empty (helps frontend show useful messages)
  let _meta = null;
  if (result.length === 0) {
    // Count ALL classes for this semester (including enrollment-closed ones)
    const totalClassesInSemester = targetSemesterId
      ? await prisma.class.count({ where: { academicSemesterId: targetSemesterId } })
      : 0;

    const closedClasses = targetSemesterId
      ? await prisma.class.count({
        where: { academicSemesterId: targetSemesterId, isEnrollmentOpen: false },
      })
      : 0;

    _meta = {
      reason: !semesterDiag
        ? 'NO_ACTIVE_SEMESTER'
        : semesterDiag.status !== 'OPEN'
          ? 'SEMESTER_NOT_OPEN'
          : totalClassesInSemester === 0
            ? 'NO_CLASSES_CREATED'
            : closedClasses === totalClassesInSemester
              ? 'ALL_CLASSES_CLOSED'
              : 'ALL_ENROLLED_OR_FULL',
      semester: semesterDiag
        ? {
          id: semesterDiag.id,
          academicYear: semesterDiag.academicYear,
          semesterType: semesterDiag.semesterType,
          status: semesterDiag.status,
          totalClasses: totalClassesInSemester,
          closedClasses,
        }
        : null,
    };
  }

  return { classes: result, _meta };
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
      academicSemesterId: true,
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

  // 1b. Validasi masa pengisian KRS masih terbuka
  await assertEnrollmentPeriodOpen(classData.academicSemesterId);

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

  // 4. Cek apakah sudah mengambil course yang sama di semester yang sama
  const duplicateCourse = await prisma.krsEnrollment.findFirst({
    where: {
      studentId,
      class: {
        courseId: classData.courseId,
        academicSemesterId: classData.academicSemesterId,
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
        academicSemesterId: classData.academicSemesterId,
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

  // Calculate real cumulative IPK for SKS limit
  const { ipk } = await calculateCumulativeIPK(studentId);
  const maxSKS = getMaxSKS(ipk);

  if (currentSKS + courseSKS > maxSKS) {
    const error = new Error(
      `Total SKS melebihi batas (${currentSKS}+${courseSKS} > ${maxSKS} SKS).` +
      (ipk !== null
        ? ` IPK kumulatif Anda: ${ipk} → maks ${maxSKS} SKS.`
        : ` Mahasiswa baru: default maks ${maxSKS} SKS.`)
    );
    error.code = 'SKS_LIMIT_EXCEEDED';
    error.details = { currentSKS, courseSKS, maxSKS, ipk };
    throw error;
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
          academicSemesterId: true,
          academicSemester: {
            select: {
              academicYear: true,
              semesterType: true,
            },
          },
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
 * Bisa difilter berdasarkan academicSemesterId.
 */
const getMyKRS = async (studentId, filters = {}) => {
  const where = { studentId };

  if (filters.academicSemesterId) {
    where.class = { academicSemesterId: filters.academicSemesterId };
  }

  const enrollments = await prisma.krsEnrollment.findMany({
    where,
    select: {
      id: true,
      status: true,
      note: true,
      submittedAt: true,
      createdAt: true,
      updatedAt: true,
      class: {
        select: {
          id: true,
          section: true,
          schedule: true,
          room: true,
          academicSemesterId: true,
          academicSemester: {
            select: {
              academicYear: true,
              semesterType: true,
            },
          },
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

  // Calculate real cumulative IPK for SKS limit
  const ipkResult = await calculateCumulativeIPK(studentId);
  const maxSKSValue = getMaxSKS(ipkResult.ipk);

  return {
    enrollments: enrollments.map(e => ({
      enrollmentId: e.id,
      status: e.status,
      note: e.note,
      submittedAt: e.submittedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      class: e.class,
    })),
    summary: {
      totalCourses: enrollments.length,
      totalSKS,
      maxSKS: maxSKSValue,
      ipk: ipkResult.ipk,
      isFirstSemester: ipkResult.courseCount === 0,
    },
  };
};

// ======================== SUBMIT KRS ========================

/**
 * Submit KRS — ubah semua enrollment DRAFT di semester tertentu menjadi SUBMITTED.
 */
const submitKRS = async (studentId, academicSemesterId) => {
  // Validasi semester akademik ada dan masa KRS masih terbuka
  await assertEnrollmentPeriodOpen(academicSemesterId);

  const semester = await prisma.academicSemester.findUnique({
    where: { id: academicSemesterId },
    select: { id: true, academicYear: true, semesterType: true },
  });

  if (!semester) {
    throw new Error('Semester akademik tidak ditemukan');
  }

  // Cari semua enrollment DRAFT di semester ini
  const draftEnrollments = await prisma.krsEnrollment.findMany({
    where: {
      studentId,
      status: KRS_STATUS.DRAFT,
      class: {
        academicSemesterId,
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
      submittedAt: new Date(),
    },
  });

  // Buat audit log untuk setiap enrollment
  await prisma.krsApprovalLog.createMany({
    data: draftEnrollments.map(e => ({
      enrollmentId: e.id,
      fromStatus: KRS_STATUS.DRAFT,
      toStatus: KRS_STATUS.SUBMITTED,
      actorId: studentId,
      actorType: 'MAHASISWA',
    })),
  });

  return {
    message: `${result.count} mata kuliah berhasil disubmit untuk persetujuan`,
    submittedCount: result.count,
    academicSemesterId,
    academicYear: semester.academicYear,
    semesterType: semester.semesterType,
  };
};

// ======================== UPDATE STATUS (DOSEN / ADMIN) ========================

/**
 * Update status satu KRS enrollment (approve/reject).
 * Hanya bisa dilakukan oleh Dosen Pembimbing (Dospem) yang di-assign.
 *
 * Jika status baru = APPROVED, otomatis buat record di tabel Enrollment (bridge)
 * agar mahasiswa bisa mengakses assignment di course tersebut.
 */
const updateEnrollmentStatus = async (enrollmentId, newStatus, note = null, currentUser = null) => {
  const enrollment = await prisma.krsEnrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      status: true,
      studentId: true,
      classId: true,
      student: {
        select: { advisorId: true, name: true },
      },
      class: {
        select: {
          courseId: true,
          section: true,
          course: { select: { id: true, title: true, code: true } },
        },
      },
    },
  });

  if (!enrollment) {
    throw new Error('KRS enrollment tidak ditemukan');
  }

  // AUTHORIZATION: Dospem atau Admin (dengan alasan) boleh approve/reject
  let actorType = 'SYSTEM';
  if (currentUser) {
    if (currentUser.role === 'ADMIN') {
      // Admin hanya boleh force-approve/reject dengan alasan yang jelas
      if (!note || note.trim().length < 10) {
        throw new Error(
          'Admin wajib memberikan alasan minimal 10 karakter untuk menyetujui/menolak KRS'
        );
      }
      actorType = 'ADMIN';
    } else if (currentUser.role === 'DOSEN') {
      if (!currentUser.isDospem) {
        throw new Error('Anda tidak terdaftar sebagai Dosen Pembimbing');
      }
      if (enrollment.student.advisorId !== currentUser.id) {
        throw new Error('Anda bukan Dosen Pembimbing mahasiswa ini');
      }
      actorType = 'DOSPEM';
    }
  }

  // Validasi transisi status
  if (!isValidStatusTransition(enrollment.status, newStatus)) {
    throw new Error(
      `Tidak dapat mengubah status dari ${enrollment.status} ke ${newStatus}`
    );
  }

  // Gunakan transaction agar konsisten
  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update status KRS enrollment
    const result = await tx.krsEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: newStatus,
        note: note || null,
        approvedAt: newStatus === KRS_STATUS.APPROVED ? new Date() : undefined,
        approvedBy: newStatus === KRS_STATUS.APPROVED && currentUser ? currentUser.id : undefined,
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
            courseId: true,
            course: {
              select: { title: true, code: true },
            },
          },
        },
      },
    });

    // 2. Jika APPROVED, re-check kapasitas lalu buat bridge Enrollment
    if (newStatus === KRS_STATUS.APPROVED) {
      // Re-check kapasitas kelas untuk menghindari overbooking
      const classData = await tx.class.findUnique({
        where: { id: enrollment.classId },
        select: {
          capacity: true,
          _count: {
            select: {
              krsEnrollments: {
                where: { status: { in: ['APPROVED'] } },
              },
            },
          },
        },
      });

      if (classData && classData._count.krsEnrollments >= classData.capacity) {
        throw new Error(
          `Kapasitas kelas sudah penuh (${classData._count.krsEnrollments}/${classData.capacity}). Tidak dapat menyetujui KRS ini.`
        );
      }

      await tx.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: enrollment.studentId,
            courseId: enrollment.class.courseId,
          },
        },
        create: {
          userId: enrollment.studentId,
          courseId: enrollment.class.courseId,
        },
        update: {}, // do nothing if already exists
      });
    }

    // 3. Buat audit log
    await tx.krsApprovalLog.create({
      data: {
        enrollmentId,
        fromStatus: enrollment.status,
        toStatus: newStatus,
        actorId: currentUser?.id || null,
        actorType,
        note: note || null,
      },
    });

    return result;
  });

  return updated;
};

// ======================== BULK UPDATE STATUS (ADMIN) ========================

/**
 * Bulk update status KRS enrollments (approve/reject multiple).
 * Hanya bisa dilakukan oleh Dospem untuk mahasiswa bimbingannya.
 * Menggunakan transaction untuk konsistensi data.
 */
const bulkUpdateEnrollmentStatus = async (enrollmentIds, newStatus, note = null, currentUser = null) => {
  if (!enrollmentIds || enrollmentIds.length === 0) {
    throw new Error('Tidak ada enrollment yang dipilih');
  }

  if (enrollmentIds.length > 50) {
    throw new Error('Maksimal 50 enrollment per batch');
  }

  // Fetch all enrollments
  const enrollments = await prisma.krsEnrollment.findMany({
    where: { id: { in: enrollmentIds } },
    select: {
      id: true,
      status: true,
      studentId: true,
      student: {
        select: { advisorId: true },
      },
      class: {
        select: {
          courseId: true,
          section: true,
          course: { select: { title: true, code: true } },
        },
      },
    },
  });

  if (enrollments.length !== enrollmentIds.length) {
    throw new Error('Beberapa enrollment tidak ditemukan');
  }

  // AUTHORIZATION: Dospem hanya bisa approve mahasiswa bimbingannya, Admin dengan alasan
  let bulkActorType = 'SYSTEM';
  if (currentUser && currentUser.role === 'DOSEN') {
    if (!currentUser.isDospem) {
      throw new Error('Anda tidak terdaftar sebagai Dosen Pembimbing');
    }
    const unauthorized = enrollments.filter(e => e.student.advisorId !== currentUser.id);
    if (unauthorized.length > 0) {
      throw new Error('Beberapa mahasiswa bukan bimbingan Anda');
    }
    bulkActorType = 'DOSPEM';
  }
  if (currentUser && currentUser.role === 'ADMIN') {
    if (!note || note.trim().length < 10) {
      throw new Error(
        'Admin wajib memberikan alasan minimal 10 karakter untuk menyetujui/menolak KRS'
      );
    }
    bulkActorType = 'ADMIN';
  }

  // Validate all transitions
  const invalidTransitions = enrollments.filter(
    e => !isValidStatusTransition(e.status, newStatus)
  );

  if (invalidTransitions.length > 0) {
    throw new Error(
      `${invalidTransitions.length} enrollment tidak dapat diubah ke status ${newStatus}`
    );
  }

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Bulk update KRS status
    await tx.krsEnrollment.updateMany({
      where: { id: { in: enrollmentIds } },
      data: {
        status: newStatus,
        note: note || null,
        approvedAt: newStatus === KRS_STATUS.APPROVED ? new Date() : undefined,
        approvedBy: newStatus === KRS_STATUS.APPROVED && currentUser ? currentUser.id : undefined,
      },
    });

    // 2. If APPROVED, create bridge Enrollment records
    if (newStatus === KRS_STATUS.APPROVED) {
      for (const enrollment of enrollments) {
        await tx.enrollment.upsert({
          where: {
            userId_courseId: {
              userId: enrollment.studentId,
              courseId: enrollment.class.courseId,
            },
          },
          create: {
            userId: enrollment.studentId,
            courseId: enrollment.class.courseId,
          },
          update: {},
        });
      }
    }

    // 3. Create audit logs
    await tx.krsApprovalLog.createMany({
      data: enrollments.map(e => ({
        enrollmentId: e.id,
        fromStatus: e.status,
        toStatus: newStatus,
        actorId: currentUser?.id || null,
        actorType: bulkActorType,
        note: note || null,
      })),
    });

    return { count: enrollmentIds.length };
  });

  return {
    message: `${result.count} KRS enrollment berhasil di-${newStatus === 'APPROVED' ? 'approve' : 'reject'}`,
    updatedCount: result.count,
    status: newStatus,
  };
};

// ======================== PENDING KRS (DOSEN/ADMIN VIEW) ========================

/**
 * Ambil daftar KRS yang menunggu persetujuan (status SUBMITTED).
 * Dospem hanya melihat mahasiswa bimbingannya.
 * Admin melihat semua (monitoring).
 */
const getPendingKRS = async (filters = {}, currentUser = null) => {
  const where = { status: KRS_STATUS.SUBMITTED };

  // Dospem hanya melihat mahasiswa bimbingannya
  if (currentUser && currentUser.role === 'DOSEN') {
    where.student = { advisorId: currentUser.id };
  }

  if (filters.academicSemesterId) {
    where.class = { academicSemesterId: filters.academicSemesterId };
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
          academicSemesterId: true,
          academicSemester: {
            select: {
              academicYear: true,
              semesterType: true,
            },
          },
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

// ======================== REVISE REJECTED KRS ========================

/**
 * Mahasiswa merevisi KRS yang ditolak: REJECTED → DRAFT.
 * Hanya bisa dilakukan jika masa KRS masih terbuka.
 */
const reviseRejectedEnrollment = async (studentId, enrollmentId) => {
  const enrollment = await prisma.krsEnrollment.findFirst({
    where: { id: enrollmentId, studentId },
    select: {
      id: true,
      status: true,
      revisionCount: true,
      classId: true,
      class: {
        select: {
          academicSemesterId: true,
          section: true,
          course: {
            select: { title: true, code: true },
          },
        },
      },
    },
  });

  if (!enrollment) {
    throw new Error('KRS enrollment tidak ditemukan');
  }

  if (enrollment.status !== KRS_STATUS.REJECTED) {
    throw new Error('Hanya KRS yang ditolak yang dapat direvisi');
  }

  // Pastikan masa KRS masih terbuka
  await assertEnrollmentPeriodOpen(enrollment.class.academicSemesterId);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.krsEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: KRS_STATUS.DRAFT,
        note: null,
        revisionCount: { increment: 1 },
        submittedAt: null,
        approvedAt: null,
        approvedBy: null,
      },
      select: {
        id: true,
        status: true,
        revisionCount: true,
        note: true,
        updatedAt: true,
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

    // Audit log
    await tx.krsApprovalLog.create({
      data: {
        enrollmentId,
        fromStatus: KRS_STATUS.REJECTED,
        toStatus: KRS_STATUS.DRAFT,
        actorId: studentId,
        actorType: 'MAHASISWA',
        note: `Revisi #${enrollment.revisionCount + 1} - KRS direvisi setelah penolakan`,
      },
    });

    return result;
  });

  return {
    message: `Berhasil merevisi ${enrollment.class.course.code} - ${enrollment.class.course.title} (Kelas ${enrollment.class.section}). Silakan submit ulang.`,
    enrollment: updated,
  };
};

// ======================== APPROVAL HISTORY ========================

/**
 * Ambil riwayat approval KRS untuk satu enrollment.
 * Mahasiswa hanya bisa lihat miliknya, Daspem bisa lihat anak bimbingan, Admin semua.
 */
const getApprovalHistory = async (enrollmentId, currentUser) => {
  const enrollment = await prisma.krsEnrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      studentId: true,
      student: { select: { advisorId: true } },
    },
  });

  if (!enrollment) {
    throw new Error('KRS enrollment tidak ditemukan');
  }

  // Authorization
  if (currentUser.role === 'MAHASISWA' && enrollment.studentId !== currentUser.id) {
    throw new Error('Anda tidak memiliki akses ke riwayat KRS ini');
  }
  if (currentUser.role === 'DOSEN' && enrollment.student.advisorId !== currentUser.id) {
    throw new Error('Anda bukan Dosen Pembimbing mahasiswa ini');
  }

  const logs = await prisma.krsApprovalLog.findMany({
    where: { enrollmentId },
    orderBy: { createdAt: 'asc' },
  });

  return logs;
};

// ======================== ADVISORY (DOSPEM) ========================

/**
 * Ambil daftar mahasiswa bimbingan Dospem beserta status KRS mereka.
 */
const getAdvisoryStudents = async (dosenId, filters = {}) => {
  const where = { advisorId: dosenId, role: 'MAHASISWA' };

  const students = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      krsEnrollments: {
        where: filters.academicSemesterId ? {
          class: { academicSemesterId: filters.academicSemesterId },
        } : undefined,
        select: {
          id: true,
          status: true,
          submittedAt: true,
          class: {
            select: {
              id: true,
              section: true,
              academicSemesterId: true,
              academicSemester: {
                select: {
                  academicYear: true,
                  semesterType: true,
                },
              },
              course: {
                select: {
                  id: true,
                  title: true,
                  code: true,
                  sks: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Hitung statistik
  let totalPending = 0;
  let totalApproved = 0;
  let totalRejected = 0;

  const result = students.map(s => {
    const pending = s.krsEnrollments.filter(e => e.status === 'SUBMITTED').length;
    const approved = s.krsEnrollments.filter(e => e.status === 'APPROVED').length;
    const rejected = s.krsEnrollments.filter(e => e.status === 'REJECTED').length;
    totalPending += pending;
    totalApproved += approved;
    totalRejected += rejected;

    return {
      id: s.id,
      name: s.name,
      email: s.email,
      enrollments: s.krsEnrollments,
      stats: { pending, approved, rejected, total: s.krsEnrollments.length },
    };
  });

  return {
    students: result,
    summary: {
      totalStudents: students.length,
      totalPending,
      totalApproved,
      totalRejected,
    },
  };
};

// ======================== KRS MONITORING (ADMIN) ========================

/**
 * Monitoring KRS untuk Admin — melihat semua KRS grouped by Dospem.
 */
const getKrsMonitoring = async (filters = {}) => {
  const classWhere = {};
  if (filters.academicSemesterId) classWhere.academicSemesterId = filters.academicSemesterId;

  const enrollments = await prisma.krsEnrollment.findMany({
    where: {
      ...(Object.keys(classWhere).length > 0 ? { class: classWhere } : {}),
    },
    select: {
      id: true,
      status: true,
      submittedAt: true,
      approvedAt: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          advisorId: true,
          advisor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      class: {
        select: {
          id: true,
          section: true,
          academicSemesterId: true,
          academicSemester: {
            select: {
              academicYear: true,
              semesterType: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              code: true,
              sks: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by status for summary
  const summary = {
    total: enrollments.length,
    draft: enrollments.filter(e => e.status === 'DRAFT').length,
    submitted: enrollments.filter(e => e.status === 'SUBMITTED').length,
    approved: enrollments.filter(e => e.status === 'APPROVED').length,
    rejected: enrollments.filter(e => e.status === 'REJECTED').length,
  };

  return { enrollments, summary };
};

export {
  // New KRS (Class-based)
  getAvailableClasses,
  enrollClass,
  dropClass,
  getMyKRS,
  submitKRS,
  updateEnrollmentStatus,
  bulkUpdateEnrollmentStatus,
  getPendingKRS,
  // Revise & History
  reviseRejectedEnrollment,
  getApprovalHistory,
  // Advisory (Dospem)
  getAdvisoryStudents,
  getKrsMonitoring,
  // SKS Eligibility
  getSksEligibility,
};
