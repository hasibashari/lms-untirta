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
// Rollback side effects reverse those changes AND clean up dependent records.

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

  // Rollback: ENROLLMENT → PLANNING
  // Cleanup: close enrollment flags + delete ALL KRS enrollments (they were created during ENROLLMENT)
  // Rationale: PLANNING means no enrollment should exist yet.
  ROLLBACK_PLANNING: async (tx, semesterId) => {
    // 1. Close enrollment flags
    await tx.class.updateMany({
      where: { academicSemesterId: semesterId },
      data: { isEnrollmentOpen: false },
    });

    // 2. Get class IDs for this semester
    const classes = await tx.class.findMany({
      where: { academicSemesterId: semesterId },
      select: { id: true, courseId: true },
    });
    const classIds = classes.map((c) => c.id);

    if (classIds.length > 0) {
      // 3. Delete bridge Enrollment records created by KRS approval
      const courseIds = [...new Set(classes.map((c) => c.courseId))];
      // Get studentIds who have KRS in these classes to scope the bridge cleanup
      const krsStudentIds = await tx.krsEnrollment.findMany({
        where: { classId: { in: classIds } },
        select: { studentId: true },
        distinct: ['studentId'],
      });
      const studentIds = krsStudentIds.map((s) => s.studentId);

      if (studentIds.length > 0 && courseIds.length > 0) {
        await tx.enrollment.deleteMany({
          where: {
            userId: { in: studentIds },
            courseId: { in: courseIds },
          },
        });
      }

      // 4. Delete KRS approval logs for enrollments in these classes
      await tx.krsApprovalLog.deleteMany({
        where: {
          enrollment: { classId: { in: classIds } },
        },
      });

      // 5. Delete all KRS enrollments in these classes
      await tx.krsEnrollment.deleteMany({
        where: { classId: { in: classIds } },
      });
    }
  },

  // Rollback: ONGOING → ENROLLMENT
  // Cleanup: re-open enrollment, reset APPROVED/AUTO_APPROVED KRS back to DRAFT,
  // delete bridge Enrollment records, delete FinalGrade drafts (if any leaked through)
  // Rationale: going back to ENROLLMENT means students should be able to modify their KRS again.
  ROLLBACK_ENROLLMENT: async (tx, semesterId) => {
    // 1. Re-open enrollment flags
    await tx.class.updateMany({
      where: { academicSemesterId: semesterId },
      data: { isEnrollmentOpen: true },
    });

    // 2. Get class IDs for this semester
    const classes = await tx.class.findMany({
      where: { academicSemesterId: semesterId },
      select: { id: true, courseId: true },
    });
    const classIds = classes.map((c) => c.id);

    if (classIds.length > 0) {
      // 3. Delete any FinalGrade records that may have been created (precondition check
      //    should have blocked if finalized grades exist, so these are only DRAFTs)
      await tx.finalGrade.deleteMany({
        where: { classId: { in: classIds } },
      });

      // 4. Delete bridge Enrollment records created by KRS approval
      const courseIds = [...new Set(classes.map((c) => c.courseId))];
      const krsStudentIds = await tx.krsEnrollment.findMany({
        where: {
          classId: { in: classIds },
          status: { in: ['APPROVED', 'AUTO_APPROVED'] },
        },
        select: { studentId: true },
        distinct: ['studentId'],
      });
      const studentIds = krsStudentIds.map((s) => s.studentId);

      if (studentIds.length > 0 && courseIds.length > 0) {
        await tx.enrollment.deleteMany({
          where: {
            userId: { in: studentIds },
            courseId: { in: courseIds },
          },
        });
      }

      // 5. Reset APPROVED/AUTO_APPROVED/SUBMITTED KRS enrollments back to DRAFT
      await tx.krsEnrollment.updateMany({
        where: {
          classId: { in: classIds },
          status: { in: ['APPROVED', 'AUTO_APPROVED', 'SUBMITTED'] },
        },
        data: {
          status: 'DRAFT',
          submittedAt: null,
          approvedAt: null,
          approvedBy: null,
          note: 'Status direset ke DRAFT karena rollback semester ke ENROLLMENT',
        },
      });

      // 6. Log the reset in KRS approval logs
      const affectedEnrollments = await tx.krsEnrollment.findMany({
        where: { classId: { in: classIds } },
        select: { id: true, status: true },
      });
      if (affectedEnrollments.length > 0) {
        await tx.krsApprovalLog.createMany({
          data: affectedEnrollments.map((e) => ({
            enrollmentId: e.id,
            fromStatus: 'APPROVED', // approximate — actual may vary
            toStatus: 'DRAFT',
            actorType: 'SYSTEM',
            note: 'Rollback semester ke ENROLLMENT: KRS direset ke DRAFT',
          })),
        });
      }
    }
  },

  // Rollback: GRADING → ONGOING
  // Cleanup: delete all DRAFT FinalGrade records (precondition already blocks if FINALIZED exist)
  // Rationale: going back to ONGOING means grading hasn't happened yet.
  ROLLBACK_ONGOING: async (tx, semesterId) => {
    await tx.finalGrade.deleteMany({
      where: { academicSemesterId: semesterId, status: 'DRAFT' },
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

// ======================== FORWARD PRECONDITION CHECKS ========================

/**
 * Checks whether forward preconditions are met before a status advance.
 * Returns null if OK, or a structured error object if blocked.
 *
 * For GRADING → COMPLETED:
 *   - All APPROVED KRS students across all classes MUST have a FinalGrade record.
 *   - All FinalGrade records MUST be FINALIZED (not DRAFT).
 *
 * This prevents:
 *   - Students graduating without any grade (missing records)
 *   - Unreviewed DRAFT grades being auto-finalized as official
 */
const checkForwardPreconditions = async (semesterId, fromStatus, toStatus) => {
  if (fromStatus === 'GRADING' && toStatus === 'COMPLETED') {
    // 1. Count students with APPROVED KRS who are missing a FinalGrade record entirely
    const studentsWithoutGrade = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT ke."studentId")::int AS count
      FROM "KrsEnrollment" ke
      INNER JOIN "Class" c ON c.id = ke."classId"
      LEFT JOIN "FinalGrade" fg ON fg."studentId" = ke."studentId" AND fg."classId" = ke."classId"
      WHERE c."academicSemesterId" = ${semesterId}
        AND ke.status IN ('APPROVED', 'AUTO_APPROVED')
        AND fg.id IS NULL
    `;
    const missingGradeCount = studentsWithoutGrade[0]?.count ?? 0;

    // 2. Count FinalGrade records still in DRAFT status
    const draftGradeCount = await prisma.finalGrade.count({
      where: { academicSemesterId: semesterId, status: 'DRAFT' },
    });

    // 3. Count already-finalized for context
    const finalizedGradeCount = await prisma.finalGrade.count({
      where: { academicSemesterId: semesterId, status: 'FINALIZED' },
    });

    // 4. Total enrolled students for context
    const totalEnrolledResult = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT ke."studentId" || '-' || ke."classId")::int AS count
      FROM "KrsEnrollment" ke
      INNER JOIN "Class" c ON c.id = ke."classId"
      WHERE c."academicSemesterId" = ${semesterId}
        AND ke.status IN ('APPROVED', 'AUTO_APPROVED')
    `;
    const totalEnrolled = totalEnrolledResult[0]?.count ?? 0;

    if (missingGradeCount > 0 || draftGradeCount > 0) {
      const issues = [];
      if (missingGradeCount > 0) {
        issues.push(`${missingGradeCount} mahasiswa belum memiliki nilai akhir`);
      }
      if (draftGradeCount > 0) {
        issues.push(`${draftGradeCount} nilai masih berstatus DRAFT (belum difinalisasi dosen)`);
      }

      return {
        blocked: true,
        message:
          `Tidak dapat menyelesaikan semester: ${issues.join('; ')}. ` +
          `Semua nilai harus diinput dan difinalisasi sebelum semester dapat ditutup.`,
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

// ======================== COMPLETION READINESS CHECK ========================

/**
 * Public query to check whether a semester is ready for COMPLETED transition.
 * Used by the frontend to show pre-flight validation in the transition modal.
 *
 * Returns detailed grade completion status per class.
 */
const getCompletionReadiness = async (semesterId) => {
  const semester = await prisma.academicSemester.findUnique({
    where: { id: semesterId },
    select: { id: true, status: true, academicYear: true, semesterType: true },
  });
  if (!semester) throw new Error('Semester akademik tidak ditemukan');

  // Get all classes in this semester with their grade statistics
  const classes = await prisma.class.findMany({
    where: { academicSemesterId: semesterId },
    select: {
      id: true,
      section: true,
      course: { select: { code: true, title: true } },
      lecturer: { select: { name: true } },
      _count: {
        select: {
          krsEnrollments: { where: { status: { in: ['APPROVED', 'AUTO_APPROVED'] } } },
          finalGrades: true,
        },
      },
    },
    orderBy: [{ course: { code: 'asc' } }, { section: 'asc' }],
  });

  // For each class, count DRAFT vs FINALIZED grades
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
        isReady: missingGrades <= 0 && draftCount === 0,
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
  };

  return { semester, summary, classes: classDetails };
};

// ======================== ROLLBACK IMPACT PREVIEW ========================

/**
 * Preview what records will be affected by a rollback transition.
 * Used by the frontend to show a confirmation dialog with impact details.
 *
 * @param {string} semesterId
 * @param {string} fromStatus - Current semester status
 * @param {string} toStatus - Target rollback status
 * @returns {Promise<object>} Impact summary
 */
const getRollbackImpact = async (semesterId, fromStatus, toStatus) => {
  const semester = await prisma.academicSemester.findUnique({
    where: { id: semesterId },
    select: { id: true, status: true, academicYear: true, semesterType: true },
  });
  if (!semester) throw new Error('Semester akademik tidak ditemukan');

  const classes = await prisma.class.findMany({
    where: { academicSemesterId: semesterId },
    select: { id: true, courseId: true },
  });
  const classIds = classes.map((c) => c.id);

  const impact = {
    transition: `${fromStatus} → ${toStatus}`,
    semester,
    totalClasses: classes.length,
    krsEnrollments: { toDelete: 0, toReset: 0, details: '' },
    bridgeEnrollments: { toDelete: 0 },
    finalGrades: { toDelete: 0 },
    approvalLogs: { toDelete: 0 },
  };

  if (classIds.length === 0) return impact;

  if (fromStatus === 'ENROLLMENT' && toStatus === 'PLANNING') {
    // All KRS enrollments will be deleted
    const krsCount = await prisma.krsEnrollment.count({
      where: { classId: { in: classIds } },
    });
    impact.krsEnrollments.toDelete = krsCount;
    impact.krsEnrollments.details = 'Semua pendaftaran KRS akan dihapus karena kembali ke tahap perencanaan.';

    const logCount = await prisma.krsApprovalLog.count({
      where: { enrollment: { classId: { in: classIds } } },
    });
    impact.approvalLogs.toDelete = logCount;

    // Bridge enrollments from approved KRS
    const courseIds = [...new Set(classes.map((c) => c.courseId))];
    const krsStudentIds = await prisma.krsEnrollment.findMany({
      where: { classId: { in: classIds } },
      select: { studentId: true },
      distinct: ['studentId'],
    });
    const studentIds = krsStudentIds.map((s) => s.studentId);
    if (studentIds.length > 0 && courseIds.length > 0) {
      const bridgeCount = await prisma.enrollment.count({
        where: { userId: { in: studentIds }, courseId: { in: courseIds } },
      });
      impact.bridgeEnrollments.toDelete = bridgeCount;
    }
  }

  if (fromStatus === 'ONGOING' && toStatus === 'ENROLLMENT') {
    // KRS status will be reset to DRAFT
    const krsToReset = await prisma.krsEnrollment.count({
      where: {
        classId: { in: classIds },
        status: { in: ['APPROVED', 'AUTO_APPROVED', 'SUBMITTED'] },
      },
    });
    impact.krsEnrollments.toReset = krsToReset;
    impact.krsEnrollments.details = 'KRS yang sudah disetujui/disubmit akan direset ke DRAFT agar mahasiswa bisa merevisi.';

    // Bridge enrollments created by KRS approval
    const courseIds = [...new Set(classes.map((c) => c.courseId))];
    const krsStudentIds = await prisma.krsEnrollment.findMany({
      where: {
        classId: { in: classIds },
        status: { in: ['APPROVED', 'AUTO_APPROVED'] },
      },
      select: { studentId: true },
      distinct: ['studentId'],
    });
    const studentIds = krsStudentIds.map((s) => s.studentId);
    if (studentIds.length > 0 && courseIds.length > 0) {
      const bridgeCount = await prisma.enrollment.count({
        where: { userId: { in: studentIds }, courseId: { in: courseIds } },
      });
      impact.bridgeEnrollments.toDelete = bridgeCount;
    }

    // Draft grades (should be 0 due to precondition, but count for completeness)
    const draftGradeCount = await prisma.finalGrade.count({
      where: { classId: { in: classIds } },
    });
    impact.finalGrades.toDelete = draftGradeCount;
  }

  if (fromStatus === 'GRADING' && toStatus === 'ONGOING') {
    // Draft grades will be deleted
    const draftGradeCount = await prisma.finalGrade.count({
      where: { academicSemesterId: semesterId, status: 'DRAFT' },
    });
    impact.finalGrades.toDelete = draftGradeCount;
  }

  return impact;
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

  // 3b. Check forward preconditions (e.g., grade completeness before COMPLETED)
  if (rule.direction === 'FORWARD') {
    const blockResult = await checkForwardPreconditions(id, currentStatus, newStatus);
    if (blockResult) {
      const error = new Error(blockResult.message);
      error.code = 'PRECONDITION_FAILED';
      error.details = blockResult.details;
      throw error;
    }
  }

  // 4. For rollbacks, compute impact summary before executing (for audit)
  let rollbackImpactSummary = null;
  if (rule.direction === 'ROLLBACK') {
    rollbackImpactSummary = await getRollbackImpact(id, currentStatus, newStatus);
  }

  // 5. Execute transition + side effects + audit log in a single transaction
  await prisma.$transaction(async (tx) => {
    // Update status
    await tx.academicSemester.update({
      where: { id },
      data: { status: newStatus },
    });

    // Apply side effects (including rollback cleanup)
    await applySideEffects(tx, id, rule.direction, newStatus);

    // Build audit reason — append cleanup summary for rollbacks
    let auditReason = reason?.trim() || null;
    if (rollbackImpactSummary && rule.direction === 'ROLLBACK') {
      const parts = [];
      if (rollbackImpactSummary.krsEnrollments.toDelete > 0)
        parts.push(`${rollbackImpactSummary.krsEnrollments.toDelete} KRS dihapus`);
      if (rollbackImpactSummary.krsEnrollments.toReset > 0)
        parts.push(`${rollbackImpactSummary.krsEnrollments.toReset} KRS direset ke DRAFT`);
      if (rollbackImpactSummary.bridgeEnrollments.toDelete > 0)
        parts.push(`${rollbackImpactSummary.bridgeEnrollments.toDelete} enrollment bridge dihapus`);
      if (rollbackImpactSummary.finalGrades.toDelete > 0)
        parts.push(`${rollbackImpactSummary.finalGrades.toDelete} nilai draft dihapus`);
      if (rollbackImpactSummary.approvalLogs.toDelete > 0)
        parts.push(`${rollbackImpactSummary.approvalLogs.toDelete} log approval dihapus`);
      if (parts.length > 0) {
        auditReason = `${auditReason || ''} [Cleanup: ${parts.join('; ')}]`.trim();
      }
    }

    // Write audit log
    await tx.semesterStatusLog.create({
      data: {
        academicSemesterId: id,
        fromStatus: currentStatus,
        toStatus: newStatus,
        direction: rule.direction,
        performedBy,
        reason: auditReason,
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
  getCompletionReadiness,
  getRollbackImpact,
};
