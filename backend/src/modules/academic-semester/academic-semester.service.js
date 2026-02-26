import prisma from '../../config/prisma.js';

// ======================== SEMESTER STATE MACHINE ========================
// Simplified lifecycle: DRAFT → OPEN → CLOSED
//
// DRAFT  – Persiapan: admin set kelas, konfigurasi semester
// OPEN   – Semester aktif: KRS, perkuliahan, dan penilaian berlangsung
// CLOSED – Semester selesai: nilai final visible, tidak bisa diubah

const STATUS_ORDER = ['DRAFT', 'OPEN', 'CLOSED'];

/**
 * Transition rules: linear forward only, no rollback.
 */
const TRANSITION_RULES = {
  DRAFT: {
    OPEN: { direction: 'FORWARD', reasonRequired: false },
  },
  OPEN: {
    CLOSED: { direction: 'FORWARD', reasonRequired: true },
  },
  CLOSED: {
    // Terminal state – no transitions allowed
  },
};

/**
 * Validate whether a transition is allowed and return the rule.
 * @returns {{ direction: string, reasonRequired: boolean } | null}
 */
const getTransitionRule = (currentStatus, targetStatus) => {
  return TRANSITION_RULES[currentStatus]?.[targetStatus] ?? null;
};

/**
 * Get all allowed transitions from a given status (used by frontend).
 */
const getAllowedTransitions = (currentStatus) => {
  const rules = TRANSITION_RULES[currentStatus] || {};
  return Object.entries(rules).map(([target, rule]) => ({
    target,
    direction: rule.direction,
    reasonRequired: rule.reasonRequired,
  }));
};

// ======================== SIDE EFFECT HANDLERS ========================

const SIDE_EFFECTS = {
  // Forward: DRAFT → OPEN — open class enrollment
  FORWARD_OPEN: async (tx, semesterId) => {
    await tx.class.updateMany({
      where: { academicSemesterId: semesterId },
      data: { isEnrollmentOpen: true },
    });
  },

  // Forward: OPEN → CLOSED — close enrollment + finalize all draft grades
  FORWARD_CLOSED: async (tx, semesterId) => {
    await tx.class.updateMany({
      where: { academicSemesterId: semesterId },
      data: { isEnrollmentOpen: false },
    });
    await tx.finalGrade.updateMany({
      where: { academicSemesterId: semesterId, status: 'DRAFT' },
      data: { status: 'FINALIZED' },
    });
  },
};

/**
 * Apply side effects for a transition.
 * Key format: "FORWARD_{targetStatus}"
 */
const applySideEffects = async (tx, semesterId, direction, targetStatus) => {
  const key = `${direction}_${targetStatus}`;
  const handler = SIDE_EFFECTS[key];
  if (handler) {
    await handler(tx, semesterId);
  }
};

// ======================== FORWARD PRECONDITION CHECKS ========================

/**
 * Checks whether forward preconditions are met before a status advance.
 * Returns null if OK, or a structured error object if blocked.
 *
 * For OPEN → CLOSED:
 *   - All APPROVED KRS students across all classes MUST have a FinalGrade record.
 *   - DRAFT FinalGrades are auto-finalized via side-effect, so they are NOT a blocker.
 */
const checkForwardPreconditions = async (semesterId, fromStatus, toStatus) => {
  if (fromStatus === 'OPEN' && toStatus === 'CLOSED') {
    // 1. Count students with APPROVED KRS who are missing a FinalGrade record entirely
    const studentsWithoutGrade = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT ke."studentId")::int AS count
      FROM "KrsEnrollment" ke
      INNER JOIN "Class" c ON c.id = ke."classId"
      LEFT JOIN "FinalGrade" fg ON fg."studentId" = ke."studentId" AND fg."classId" = ke."classId"
      WHERE c."academicSemesterId" = ${semesterId}
        AND ke.status IN ('APPROVED')
        AND fg.id IS NULL
    `;
    const missingGradeCount = studentsWithoutGrade[0]?.count ?? 0;

    // 2. Count grade status for context
    const draftGradeCount = await prisma.finalGrade.count({
      where: { academicSemesterId: semesterId, status: 'DRAFT' },
    });

    const finalizedGradeCount = await prisma.finalGrade.count({
      where: { academicSemesterId: semesterId, status: 'FINALIZED' },
    });

    // 3. Total enrolled students for context
    const totalEnrolledResult = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT ke."studentId" || '-' || ke."classId")::int AS count
      FROM "KrsEnrollment" ke
      INNER JOIN "Class" c ON c.id = ke."classId"
      WHERE c."academicSemesterId" = ${semesterId}
        AND ke.status IN ('APPROVED')
    `;
    const totalEnrolled = totalEnrolledResult[0]?.count ?? 0;

    // Only block on missing grades (DRAFT grades will be auto-finalized by side-effect)
    if (missingGradeCount > 0) {
      return {
        blocked: true,
        message:
          `Tidak dapat menutup semester: ${missingGradeCount} mahasiswa belum memiliki nilai akhir. ` +
          `Semua nilai harus diinput sebelum semester dapat ditutup.` +
          (draftGradeCount > 0 ? ` (${draftGradeCount} nilai DRAFT akan otomatis difinalisasi)` : ''),
        details: {
          totalEnrolled,
          missingGradeCount,
          draftGradeCount,
          finalizedGradeCount,
        },
      };
    }
  }

  return null; // OK
};

// ======================== CLOSING READINESS CHECK ========================

/**
 * Public query to check whether a semester is ready for CLOSED transition.
 * Used by the frontend to show pre-flight validation in the transition modal.
 */
const getClosingReadiness = async (semesterId) => {
  const semester = await prisma.academicSemester.findUnique({
    where: { id: semesterId },
    select: { id: true, status: true, academicYear: true, semesterType: true },
  });
  if (!semester) throw new Error('Semester akademik tidak ditemukan');

  const classes = await prisma.class.findMany({
    where: { academicSemesterId: semesterId },
    select: {
      id: true,
      section: true,
      course: { select: { code: true, title: true } },
      lecturer: { select: { name: true } },
      _count: {
        select: {
          krsEnrollments: { where: { status: { in: ['APPROVED'] } } },
          finalGrades: true,
        },
      },
    },
    orderBy: [{ course: { code: 'asc' } }, { section: 'asc' }],
  });

  const classDetails = await Promise.all(
    classes.map(async (cls) => {
      const [draftCount, finalizedCount] = await Promise.all([
        prisma.finalGrade.count({
          where: { classId: cls.id, status: 'DRAFT' },
        }),
        prisma.finalGrade.count({
          where: { classId: cls.id, status: 'FINALIZED' },
        }),
      ]);

      const enrolledStudents = cls._count.krsEnrollments;
      const totalGrades = cls._count.finalGrades;
      const missingGrades = enrolledStudents - totalGrades;

      return {
        classId: cls.id,
        courseCode: cls.course.code,
        courseTitle: cls.course.title,
        section: cls.section,
        lecturerName: cls.lecturer.name,
        enrolledStudents,
        totalGrades,
        draftCount,
        finalizedCount,
        missingGrades: missingGrades > 0 ? missingGrades : 0,
        // Missing grades block closure; DRAFT grades are auto-finalized on close
        isReady: missingGrades <= 0,
      };
    }),
  );

  const summary = {
    totalClasses: classDetails.length,
    readyClasses: classDetails.filter((c) => c.isReady).length,
    totalEnrolled: classDetails.reduce((sum, c) => sum + c.enrolledStudents, 0),
    totalGraded: classDetails.reduce((sum, c) => sum + c.totalGrades, 0),
    totalDraft: classDetails.reduce((sum, c) => sum + c.draftCount, 0),
    totalFinalized: classDetails.reduce((sum, c) => sum + c.finalizedCount, 0),
    totalMissing: classDetails.reduce((sum, c) => sum + c.missingGrades, 0),
    isReady: classDetails.every((c) => c.isReady),
    willAutoFinalize: classDetails.reduce((sum, c) => sum + c.draftCount, 0),
  };

  return { semester, summary, classes: classDetails };
};

// ======================== GET ALL SEMESTERS ========================

const getAllSemesters = async () => {
  return prisma.academicSemester.findMany({
    orderBy: [{ academicYear: 'desc' }, { semesterType: 'asc' }],
    include: {
      _count: {
        select: {
          classes: true,
          finalGrades: true,
        },
      },
    },
  });
};

// ======================== GET ACTIVE SEMESTER ========================

const getActiveSemester = async () => {
  return prisma.academicSemester.findFirst({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          classes: true,
          finalGrades: true,
        },
      },
    },
  });
};

// ======================== GET SEMESTER BY ID ========================

const getSemesterById = async (id) => {
  const semester = await prisma.academicSemester.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          classes: true,
          finalGrades: true,
        },
      },
    },
  });

  if (!semester) throw new Error('Semester akademik tidak ditemukan');
  return semester;
};

// ======================== GET STATUS LOGS ========================

const getStatusLogs = async (semesterId) => {
  return prisma.semesterStatusLog.findMany({
    where: { academicSemesterId: semesterId },
    orderBy: { createdAt: 'desc' },
    include: {
      performer: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
};

// ======================== CREATE SEMESTER ========================

const createSemester = async (data) => {
  // Check duplicate
  const existing = await prisma.academicSemester.findUnique({
    where: {
      academicYear_semesterType: {
        academicYear: data.academicYear,
        semesterType: data.semesterType,
      },
    },
  });

  if (existing) {
    throw new Error(
      `Semester ${data.semesterType} ${data.academicYear} sudah ada`
    );
  }

  return prisma.academicSemester.create({
    data: {
      academicYear: data.academicYear,
      semesterType: data.semesterType,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      maxSks: data.maxSks ?? 24,
      status: 'DRAFT',
      isActive: false,
    },
  });
};

// ======================== UPDATE SEMESTER ========================

const updateSemester = async (id, data) => {
  const semester = await prisma.academicSemester.findUnique({ where: { id } });
  if (!semester) throw new Error('Semester akademik tidak ditemukan');

  if (semester.status === 'CLOSED') {
    throw new Error('Tidak dapat mengubah semester yang sudah CLOSED');
  }

  return prisma.academicSemester.update({
    where: { id },
    data: {
      startDate: data.startDate ? new Date(data.startDate) : semester.startDate,
      endDate: data.endDate ? new Date(data.endDate) : semester.endDate,
      ...(data.maxSks !== undefined && { maxSks: data.maxSks }),
    },
  });
};

// ======================== UPDATE STATUS (STATE MACHINE) ========================

/**
 * Transition semester status with validation, side effects, and audit logging.
 * Linear forward only: DRAFT → OPEN → CLOSED
 */
const updateStatus = async (id, newStatus, performedBy, reason = null) => {
  const semester = await prisma.academicSemester.findUnique({ where: { id } });
  if (!semester) throw new Error('Semester akademik tidak ditemukan');

  const currentStatus = semester.status;

  // 1. Check if transition is defined in the state machine
  const rule = getTransitionRule(currentStatus, newStatus);
  if (!rule) {
    const allowed = getAllowedTransitions(currentStatus);
    const allowedStr = allowed.length > 0
      ? allowed.map(t => t.target).join(', ')
      : 'tidak ada';
    throw new Error(
      `Tidak dapat mengubah status dari ${currentStatus} ke ${newStatus}. ` +
      `Transisi yang valid: ${allowedStr}`
    );
  }

  // 2. Validate reason is provided when required
  if (rule.reasonRequired && (!reason || reason.trim().length === 0)) {
    throw new Error(
      `Alasan wajib diisi untuk transisi dari ${currentStatus} ke ${newStatus}`
    );
  }

  // 3. Check forward preconditions (e.g., grade completeness before CLOSED)
  const blockResult = await checkForwardPreconditions(id, currentStatus, newStatus);
  if (blockResult) {
    const error = new Error(blockResult.message);
    error.code = 'PRECONDITION_FAILED';
    error.details = blockResult.details;
    throw error;
  }

  // 4. Execute transition + side effects + audit log in a single transaction
  await prisma.$transaction(async (tx) => {
    // Update status
    await tx.academicSemester.update({
      where: { id },
      data: { status: newStatus },
    });

    // Apply side effects
    await applySideEffects(tx, id, rule.direction, newStatus);

    // Write audit log
    await tx.semesterStatusLog.create({
      data: {
        academicSemesterId: id,
        fromStatus: currentStatus,
        toStatus: newStatus,
        direction: rule.direction,
        performedBy,
        reason: reason?.trim() || null,
      },
    });
  });

  return prisma.academicSemester.findUnique({
    where: { id },
    include: {
      _count: {
        select: { classes: true, finalGrades: true },
      },
    },
  });
};

// ======================== SET ACTIVE ========================

const setActive = async (id) => {
  const semester = await prisma.academicSemester.findUnique({ where: { id } });
  if (!semester) throw new Error('Semester akademik tidak ditemukan');

  if (semester.status === 'CLOSED') {
    throw new Error('Tidak dapat mengaktifkan semester yang sudah CLOSED');
  }

  await prisma.$transaction(async (tx) => {
    // Deactivate all semesters
    await tx.academicSemester.updateMany({
      data: { isActive: false },
    });

    // Activate the selected one
    await tx.academicSemester.update({
      where: { id },
      data: { isActive: true },
    });
  });

  return prisma.academicSemester.findUnique({ where: { id } });
};

// ======================== DELETE SEMESTER ========================

const deleteSemester = async (id) => {
  const semester = await prisma.academicSemester.findUnique({
    where: { id },
    include: {
      _count: {
        select: { classes: true, finalGrades: true },
      },
    },
  });

  if (!semester) throw new Error('Semester akademik tidak ditemukan');

  if (semester._count.classes > 0 || semester._count.finalGrades > 0) {
    throw new Error(
      'Tidak dapat menghapus semester yang sudah memiliki kelas atau nilai. Ubah status ke CLOSED.'
    );
  }

  return prisma.academicSemester.delete({ where: { id } });
};

export {
  getAllSemesters,
  getActiveSemester,
  getSemesterById,
  getStatusLogs,
  createSemester,
  updateSemester,
  updateStatus,
  getAllowedTransitions,
  setActive,
  deleteSemester,
  getClosingReadiness,
};
