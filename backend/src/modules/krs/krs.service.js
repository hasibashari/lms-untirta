import prisma from '../../config/prisma.js';
import { KRS_STATUS, isValidStatusTransition } from '../../utils/academic.util.js';

// ========================================================================
// KRS SERVICE
// Mengelola pendaftaran KRS mahasiswa ke kelas offering.
// Modul ini TIDAK mengimpor service dari module lain.
// Semua akses data melalui Prisma.
// ========================================================================

// ======================== SKS ELIGIBILITY ========================

/**
 * Retrieves SKS (credit) eligibility information for a student in a specific semester.
 * The SKS limit is determined by the `maxSks` field on the AcademicSemester.
 * @param {string} studentId - The ID of the student.
 * @param {string} academicSemesterId - The ID of the academic semester.
 * @returns {Promise<{maxSKS: number, currentSKS: number, remainingSKS: number}>} An object with SKS details.
 */
const getSksEligibility = async (studentId, academicSemesterId) => {
  // Get semester's maxSks
  const semester = await prisma.academicSemester.findUnique({
    where: { id: academicSemesterId },
    select: { maxSks: true },
  });

  if (!semester) {
    throw new Error('Semester akademik tidak ditemukan');
  }

  const maxSKS = semester.maxSks;

  // Current semester enrollment SKS
  const currentEnrollments = await prisma.krsEnrollment.findMany({
    where: {
      studentId,
      class: { academicSemesterId },
      status: { in: ['PENDING', 'APPROVED'] },
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
    maxSKS,
    currentSKS,
    remainingSKS: maxSKS - currentSKS,
  };
};

// ======================== ENROLLMENT PERIOD GUARD ========================

/**
 * Asserts that the KRS enrollment period for a given semester is currently open.
 * It checks if the semester exists and its status is 'OPEN'.
 * @param {string} academicSemesterId - The ID of the academic semester to check.
 * @throws {Error} If the enrollment period is not open.
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
 * Retrieves class offerings available for a student's KRS.
 * It filters classes that are open for enrollment, not full, and not already taken by the student.
 * If no classes are available, it returns diagnostic metadata for the frontend.
 * @param {string} studentId - The ID of the student.
 * @param {object} [filters={}] - Optional filters (e.g., academicSemesterId, semester).
 * @returns {Promise<{classes: Array<object>, _meta: object|null}>} An object containing the list of classes and optional metadata.
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
 * Enrolls a student in a class offering for their KRS.
 * This function performs several critical validations:
 * - Checks if the class exists and is open for enrollment.
 * - Verifies that the class capacity has not been reached.
 * - Prevents duplicate enrollment in the same class or another section of the same course.
 * - Ensures the student's total SKS (credits) does not exceed the semester limit.
 * @param {string} studentId - The ID of the student.
 * @param {string} classId - The ID of the class to enroll in.
 * @returns {Promise<object>} The newly created KRS enrollment record.
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
      status: { in: ['PENDING', 'APPROVED'] },
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

  // Get semester's maxSks limit
  const semester = await prisma.academicSemester.findUnique({
    where: { id: classData.academicSemesterId },
    select: { maxSks: true },
  });
  const maxSKS = semester?.maxSks ?? 24;

  if (currentSKS + courseSKS > maxSKS) {
    const error = new Error(
      `Total SKS melebihi batas semester (${currentSKS}+${courseSKS} > ${maxSKS} SKS).`
    );
    error.code = 'SKS_LIMIT_EXCEEDED';
    error.details = { currentSKS, courseSKS, maxSKS };
    throw error;
  }

  // 6. Create KRS enrollment (directly as PENDING — no draft phase)
  const enrollment = await prisma.krsEnrollment.create({
    data: {
      studentId,
      classId,
      status: KRS_STATUS.PENDING,
      submittedAt: new Date(),
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
 * Allows a student to drop a class from their KRS.
 * This action is only permitted if the enrollment status is 'PENDING' or 'REJECTED'.
 * It is blocked if the class has already been 'APPROVED'.
 * @param {string} studentId - The ID of the student.
 * @param {string} classId - The ID of the class to drop.
 * @returns {Promise<{message: string, classId: string}>} A success message and the ID of the dropped class.
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
          academicSemesterId: true,
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

  // Semester must be OPEN to drop
  await assertEnrollmentPeriodOpen(enrollment.class.academicSemesterId);

  if (enrollment.status === KRS_STATUS.APPROVED) {
    throw new Error('Tidak dapat menghapus mata kuliah yang sudah disetujui');
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
 * Retrieves the list of classes a student has enrolled in for their KRS.
 * Can be filtered by a specific academic semester.
 * @param {string} studentId - The ID of the student.
 * @param {object} [filters={}] - Optional filters (e.g., academicSemesterId).
 * @returns {Promise<{enrollments: Array<object>, summary: object}>} The student's KRS details and a summary of total credits.
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

  // Get semester's maxSks from the first enrollment's semester, or query directly
  let maxSKSValue = 24;
  if (enrollments.length > 0) {
    const semesterData = await prisma.academicSemester.findUnique({
      where: { id: enrollments[0].class.academicSemesterId },
      select: { maxSks: true },
    });
    maxSKSValue = semesterData?.maxSks ?? 24;
  } else if (filters.academicSemesterId) {
    const semesterData = await prisma.academicSemester.findUnique({
      where: { id: filters.academicSemesterId },
      select: { maxSks: true },
    });
    maxSKSValue = semesterData?.maxSks ?? 24;
  }

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
    },
  };
};

// ======================== UPDATE STATUS (DOSEN / ADMIN) ========================

/**
 * Updates the status of a single KRS enrollment (e.g., from PENDING to APPROVED).
 * This is a critical state transition performed by an academic advisor (Dospem) or an Admin.
 * If approved, it creates a corresponding record in the main `Enrollment` table to grant course access.
 * If an approval is revoked, it removes the `Enrollment` record.
 * @param {string} enrollmentId - The ID of the KRS enrollment to update.
 * @param {string} newStatus - The target status ('APPROVED' or 'REJECTED').
 * @param {string|null} [note=null] - An optional note, required for rejections or admin actions.
 * @param {object|null} [currentUser=null] - The user performing the action.
 * @returns {Promise<object>} The updated KRS enrollment record.
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
          academicSemesterId: true,
          course: { select: { id: true, title: true, code: true } },
        },
      },
    },
  });

  if (!enrollment) {
    throw new Error('KRS enrollment tidak ditemukan');
  }

  // Guard: semester must be OPEN for any status change
  await assertEnrollmentPeriodOpen(enrollment.class.academicSemesterId);

  // Guard: validate state transition
  if (!isValidStatusTransition(enrollment.status, newStatus)) {
    throw new Error(
      `Tidak dapat mengubah status dari ${enrollment.status} ke ${newStatus}`
    );
  }

  // Detect revoke: APPROVED → REJECTED
  const isRevoke = enrollment.status === KRS_STATUS.APPROVED && newStatus === KRS_STATUS.REJECTED;

  // AUTHORIZATION: Dospem atau Admin (dengan alasan) boleh approve/reject
  let actorType = 'SYSTEM';
  if (currentUser) {
    if (currentUser.role === 'ADMIN') {
      // Admin cannot revoke approvals — only dospem can
      if (isRevoke) {
        throw new Error('Hanya Dosen Pembimbing yang dapat mencabut persetujuan KRS');
      }
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
      // Revoke requires a note explaining why
      if (isRevoke && (!note || note.trim().length === 0)) {
        throw new Error('Wajib memberikan alasan untuk mencabut persetujuan KRS');
      }
      actorType = 'DOSPEM';
    }
  }

  // Gunakan transaction agar konsisten
  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update status KRS enrollment
    const updateData = {
      status: newStatus,
      note: note || null,
    };

    if (newStatus === KRS_STATUS.APPROVED) {
      updateData.approvedAt = new Date();
      updateData.approvedBy = currentUser ? currentUser.id : null;
    }

    // On revoke (APPROVED → REJECTED), clear approval tracking
    if (isRevoke) {
      updateData.approvedAt = null;
      updateData.approvedBy = null;
    }

    const result = await tx.krsEnrollment.update({
      where: { id: enrollmentId },
      data: updateData,
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

    // 2b. If revoking (APPROVED → REJECTED), remove bridge Enrollment
    if (isRevoke) {
      await tx.enrollment.deleteMany({
        where: {
          userId: enrollment.studentId,
          courseId: enrollment.class.courseId,
        },
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
 * Updates the status of multiple KRS enrollments in a single batch operation.
 * This function is restricted to academic advisors for their advisees or Admins.
 * It uses a database transaction to ensure all updates succeed or fail together.
 * @param {Array<string>} enrollmentIds - An array of KRS enrollment IDs to update.
 * @param {string} newStatus - The target status for all enrollments.
 * @param {string|null} [note=null] - An optional note for the update.
 * @param {object|null} [currentUser=null] - The user performing the bulk action.
 * @returns {Promise<{message: string, updatedCount: number, status: string}>} A summary of the bulk operation.
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
          academicSemesterId: true,
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

  // Guard: semester must be OPEN
  const semesterIds = [...new Set(enrollments.map(e => e.class.academicSemesterId))];
  for (const semId of semesterIds) {
    await assertEnrollmentPeriodOpen(semId);
  }

  // AUTHORIZATION: Dospem hanya bisa approve mahasiswa bimbingannya, Admin dengan alasan
  let bulkActorType = 'SYSTEM';
  const hasRevokeItems = enrollments.some(e => e.status === KRS_STATUS.APPROVED);

  if (currentUser && currentUser.role === 'DOSEN') {
    if (!currentUser.isDospem) {
      throw new Error('Anda tidak terdaftar sebagai Dosen Pembimbing');
    }
    const unauthorized = enrollments.filter(e => e.student.advisorId !== currentUser.id);
    if (unauthorized.length > 0) {
      throw new Error('Beberapa mahasiswa bukan bimbingan Anda');
    }
    // Revoke in bulk requires a note
    if (hasRevokeItems && (!note || note.trim().length === 0)) {
      throw new Error('Wajib memberikan alasan untuk mencabut persetujuan KRS');
    }
    bulkActorType = 'DOSPEM';
  }
  if (currentUser && currentUser.role === 'ADMIN') {
    // Admin cannot revoke approvals
    if (hasRevokeItems) {
      throw new Error('Hanya Dosen Pembimbing yang dapat mencabut persetujuan KRS');
    }
    if (!note || note.trim().length < 10) {
      throw new Error(
        'Admin wajib memberikan alasan minimal 10 karakter untuk menyetujui/menolak KRS'
      );
    }
    bulkActorType = 'ADMIN';
  }

  // Validate: all enrollments must have valid transition to newStatus
  const invalidTransitions = enrollments.filter(e => !isValidStatusTransition(e.status, newStatus));

  if (invalidTransitions.length > 0) {
    throw new Error(
      `${invalidTransitions.length} enrollment tidak dapat diubah ke status ${newStatus}`
    );
  }

  // Separate revoke items (APPROVED → REJECTED) from normal items
  const revokeItems = enrollments.filter(e => e.status === KRS_STATUS.APPROVED);
  const normalItems = enrollments.filter(e => e.status !== KRS_STATUS.APPROVED);

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1a. Bulk update normal items (PENDING → APPROVED/REJECTED)
    if (normalItems.length > 0) {
      await tx.krsEnrollment.updateMany({
        where: { id: { in: normalItems.map(e => e.id) } },
        data: {
          status: newStatus,
          note: note || null,
          approvedAt: newStatus === KRS_STATUS.APPROVED ? new Date() : undefined,
          approvedBy: newStatus === KRS_STATUS.APPROVED && currentUser ? currentUser.id : undefined,
        },
      });
    }

    // 1b. Bulk update revoke items (APPROVED → REJECTED) — clear approval fields
    if (revokeItems.length > 0) {
      await tx.krsEnrollment.updateMany({
        where: { id: { in: revokeItems.map(e => e.id) } },
        data: {
          status: KRS_STATUS.REJECTED,
          note: note || null,
          approvedAt: null,
          approvedBy: null,
        },
      });
    }

    // 2. If APPROVED, create bridge Enrollment records
    if (newStatus === KRS_STATUS.APPROVED) {
      for (const enrollment of normalItems) {
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

    // 2b. If revoking, remove bridge Enrollment records
    if (revokeItems.length > 0) {
      for (const enrollment of revokeItems) {
        await tx.enrollment.deleteMany({
          where: {
            userId: enrollment.studentId,
            courseId: enrollment.class.courseId,
          },
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
 * Retrieves a list of KRS enrollments that are awaiting approval (status 'PENDING').
 * If the user is an advisor, it returns pending enrollments only for their advisees.
 * If the user is an Admin, it returns all pending enrollments across the system.
 * @param {object} [filters={}] - Optional filters (e.g., academicSemesterId).
 * @param {object|null} [currentUser=null] - The user requesting the list.
 * @returns {Promise<Array<object>>} A list of pending KRS enrollment records.
 */
const getPendingKRS = async (filters = {}, currentUser = null) => {
  const where = { status: KRS_STATUS.PENDING };

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
 * Allows a student to revise a rejected KRS enrollment.
 * This action transitions the status from 'REJECTED' back to 'PENDING' for re-approval.
 * It can only be performed during an open enrollment period.
 * @param {string} studentId - The ID of the student revising the enrollment.
 * @param {string} enrollmentId - The ID of the rejected KRS enrollment.
 * @returns {Promise<{message: string, enrollment: object}>} A success message and the updated enrollment data.
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
        status: KRS_STATUS.PENDING,
        note: null,
        revisionCount: { increment: 1 },
        submittedAt: new Date(),
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
        toStatus: KRS_STATUS.PENDING,
        actorId: studentId,
        actorType: 'MAHASISWA',
        note: `Revisi #${enrollment.revisionCount + 1} - KRS diajukan ulang setelah penolakan`,
      },
    });

    return result;
  });

  return {
    message: `Berhasil mengajukan ulang ${enrollment.class.course.code} - ${enrollment.class.course.title} (Kelas ${enrollment.class.section}). Menunggu persetujuan dosen.`,
    enrollment: updated,
  };
};

// ======================== APPROVAL HISTORY ========================

/**
 * Retrieves the approval history (audit log) for a single KRS enrollment.
 * Access is restricted: students can only view their own history, advisors can view their advisees',
 * and Admins can view any history.
 * @param {string} enrollmentId - The ID of the KRS enrollment.
 * @param {object} currentUser - The user requesting the history.
 * @returns {Promise<Array<object>>} An array of log entries.
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
 * Retrieves the list of advisees for a specific academic advisor (Dospem).
 * For each student, it includes their KRS enrollments and a summary of their status
 * (pending, approved, rejected) for the filtered semester.
 * @param {string} dosenId - The ID of the academic advisor.
 * @param {object} [filters={}] - Optional filters (e.g., academicSemesterId).
 * @returns {Promise<{students: Array<object>, summary: object}>} A list of advisees and an overall summary.
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
          note: true,
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
                  status: true,
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
    const pending = s.krsEnrollments.filter(e => e.status === 'PENDING').length;
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
 * Retrieves a comprehensive list of all KRS enrollments for administrative monitoring.
 * This provides a system-wide view of all student study plans for a given semester.
 * @param {object} [filters={}] - Optional filters (e.g., academicSemesterId).
 * @returns {Promise<{enrollments: Array<object>, summary: object}>} A list of all enrollments and a status summary.
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
    pending: enrollments.filter(e => e.status === 'PENDING').length,
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
