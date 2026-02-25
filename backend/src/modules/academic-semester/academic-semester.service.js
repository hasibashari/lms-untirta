import prisma from '../../config/prisma.js';

// ======================== SEMESTER STATE MACHINE ========================
// Defines the complete state machine for academic semester status transitions.
// Supports both forward (advance) and backward (rollback) transitions.
//
// Flow: PLANNING → ENROLLMENT → ONGOING → GRADING → COMPLETED
//
// Rollback rules:
//   - COMPLETED is a terminal state (no rollback)
//   - GRADING → ONGOING: only if no finalized grades
//   - ONGOING → ENROLLMENT: only if no finalized grades
//   - ENROLLMENT → PLANNING: always allowed
//
// Each transition may have side effects that are reversed on rollback.

const STATUS_ORDER = ['PLANNING', 'ENROLLMENT', 'ONGOING', 'GRADING', 'COMPLETED'];

/**
 * Full transition rules table.
 * Each key is a current status, value is an object of allowed target statuses
 * with direction and whether a reason is required.
 */
const TRANSITION_RULES = {
  PLANNING: {
    ENROLLMENT: { direction: 'FORWARD', reasonRequired: false },
  },
  ENROLLMENT: {
    PLANNING: { direction: 'ROLLBACK', reasonRequired: true },
    ONGOING: { direction: 'FORWARD', reasonRequired: false },
  },
  ONGOING: {
    ENROLLMENT: { direction: 'ROLLBACK', reasonRequired: true },
    GRADING: { direction: 'FORWARD', reasonRequired: false },
  },
  GRADING: {
    ONGOING: { direction: 'ROLLBACK', reasonRequired: true },
    COMPLETED: { direction: 'FORWARD', reasonRequired: true },
  },
  COMPLETED: {
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
// Forward side effects are applied when advancing status.
// Rollback side effects reverse those changes.

const SIDE_EFFECTS = {
  // Forward: PLANNING → ENROLLMENT — open class enrollment
  FORWARD_ENROLLMENT: async (tx, semesterId) => {
    await tx.class.updateMany({
      where: { academicSemesterId: semesterId },
      data: { isEnrollmentOpen: true },
    });
  },

  // Forward: ENROLLMENT → ONGOING — close class enrollment
  FORWARD_ONGOING: async (tx, semesterId) => {
    await tx.class.updateMany({
      where: { academicSemesterId: semesterId },
      data: { isEnrollmentOpen: false },
    });
  },

  // Forward: GRADING → COMPLETED — finalize all draft grades
  FORWARD_COMPLETED: async (tx, semesterId) => {
    await tx.finalGrade.updateMany({
      where: { academicSemesterId: semesterId, status: 'DRAFT' },
      data: { status: 'FINALIZED' },
    });
  },

  // Rollback: ENROLLMENT → PLANNING — close class enrollment
  ROLLBACK_PLANNING: async (tx, semesterId) => {
    await tx.class.updateMany({
      where: { academicSemesterId: semesterId },
      data: { isEnrollmentOpen: false },
    });
  },

  // Rollback: ONGOING → ENROLLMENT — re-open class enrollment
  ROLLBACK_ENROLLMENT: async (tx, semesterId) => {
    await tx.class.updateMany({
      where: { academicSemesterId: semesterId },
      data: { isEnrollmentOpen: true },
    });
  },
};

/**
 * Apply side effects for a transition.
 * Key format: "{direction}_{targetStatus}"
 */
const applySideEffects = async (tx, semesterId, direction, targetStatus) => {
  const key = `${direction}_${targetStatus}`;
  const handler = SIDE_EFFECTS[key];
  if (handler) {
    await handler(tx, semesterId);
  }
};

// ======================== ROLLBACK PRECONDITION CHECKS ========================

/**
 * Checks whether rollback preconditions are met.
 * Returns null if OK, or an error message string if blocked.
 */
const checkRollbackPreconditions = async (semesterId, fromStatus, toStatus) => {
  // GRADING → ONGOING: block if any grades were finalized
  if (fromStatus === 'GRADING' && toStatus === 'ONGOING') {
    const finalizedCount = await prisma.finalGrade.count({
      where: { academicSemesterId: semesterId, status: 'FINALIZED' },
    });
    if (finalizedCount > 0) {
      return `Tidak dapat rollback ke ONGOING karena sudah ada ${finalizedCount} nilai yang sudah difinalisasi. Ubah nilai ke DRAFT terlebih dahulu.`;
    }
  }

  // ONGOING → ENROLLMENT: block if any grades exist (draft or finalized)
  if (fromStatus === 'ONGOING' && toStatus === 'ENROLLMENT') {
    const gradeCount = await prisma.finalGrade.count({
      where: { academicSemesterId: semesterId },
    });
    if (gradeCount > 0) {
      return `Tidak dapat rollback ke ENROLLMENT karena sudah ada ${gradeCount} nilai akhir yang diinput. Hapus nilai terlebih dahulu.`;
    }
  }

  return null; // OK
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
      enrollmentStart: data.enrollmentStart ? new Date(data.enrollmentStart) : null,
      enrollmentEnd: data.enrollmentEnd ? new Date(data.enrollmentEnd) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      gradingDeadline: data.gradingDeadline ? new Date(data.gradingDeadline) : null,
      status: 'PLANNING',
      isActive: false,
    },
  });
};

// ======================== UPDATE SEMESTER ========================

const updateSemester = async (id, data) => {
  const semester = await prisma.academicSemester.findUnique({ where: { id } });
  if (!semester) throw new Error('Semester akademik tidak ditemukan');

  return prisma.academicSemester.update({
    where: { id },
    data: {
      enrollmentStart: data.enrollmentStart ? new Date(data.enrollmentStart) : semester.enrollmentStart,
      enrollmentEnd: data.enrollmentEnd ? new Date(data.enrollmentEnd) : semester.enrollmentEnd,
      startDate: data.startDate ? new Date(data.startDate) : semester.startDate,
      endDate: data.endDate ? new Date(data.endDate) : semester.endDate,
      gradingDeadline: data.gradingDeadline
        ? new Date(data.gradingDeadline)
        : semester.gradingDeadline,
    },
  });
};

// ======================== UPDATE STATUS (STATE MACHINE) ========================

/**
 * Transition semester status with full validation, side effects, and audit logging.
 *
 * @param {string} id - Semester ID
 * @param {string} newStatus - Target status
 * @param {string} performedBy - User ID of the admin performing the action
 * @param {string|null} reason - Reason for the transition (required for rollbacks and critical transitions)
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
      ? allowed.map(t => `${t.target} (${t.direction.toLowerCase()})`).join(', ')
      : 'tidak ada';
    throw new Error(
      `Tidak dapat mengubah status dari ${currentStatus} ke ${newStatus}. ` +
      `Transisi yang valid: ${allowedStr}`
    );
  }

  // 2. Validate reason is provided when required
  if (rule.reasonRequired && (!reason || reason.trim().length === 0)) {
    throw new Error(
      `Alasan wajib diisi untuk transisi ${rule.direction.toLowerCase()} dari ${currentStatus} ke ${newStatus}`
    );
  }

  // 3. Check rollback preconditions
  if (rule.direction === 'ROLLBACK') {
    const blockMessage = await checkRollbackPreconditions(id, currentStatus, newStatus);
    if (blockMessage) {
      throw new Error(blockMessage);
    }
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
      'Tidak dapat menghapus semester yang sudah memiliki kelas atau nilai. Ubah status ke COMPLETED.'
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
};
