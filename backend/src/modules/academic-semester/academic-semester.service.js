import prisma from '../../config/prisma.js';

// ======================== SEMESTER STATE MACHINE ========================
// Simplified lifecycle: DRAFT → OPEN → CLOSED
//
// DRAFT  – Persiapan: admin set kelas, konfigurasi semester
// OPEN   – Semester aktif: KRS, perkuliahan, dan penilaian berlangsung
// CLOSED – Semester selesai: nilai final visible, tidak bisa diubah
//
// Only ONE semester can be OPEN at a time.
// The OPEN semester is automatically the "active" semester (isActive = true).

/**
 * Allowed transitions (forward-only, no rollback).
 */
const ALLOWED_TRANSITIONS = {
  DRAFT: ['OPEN'],
  OPEN: ['CLOSED'],
  CLOSED: [], // terminal state
};

/**
 * Check if a status transition is allowed.
 */
const isTransitionAllowed = (from, to) => {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
};

// ======================== SIDE EFFECTS ========================

/**
 * DRAFT → OPEN: open class enrollment, set isActive.
 */
const onOpen = async (tx, semesterId) => {
  await tx.class.updateMany({
    where: { academicSemesterId: semesterId },
    data: { isEnrollmentOpen: true },
  });
  // Deactivate all semesters, then activate this one
  await tx.academicSemester.updateMany({
    data: { isActive: false },
  });
  await tx.academicSemester.update({
    where: { id: semesterId },
    data: { isActive: true },
  });
};

/**
 * OPEN → CLOSED: close enrollment, finalize draft grades, clear isActive.
 */
const onClose = async (tx, semesterId) => {
  await tx.class.updateMany({
    where: { academicSemesterId: semesterId },
    data: { isEnrollmentOpen: false },
  });
  await tx.finalGrade.updateMany({
    where: { academicSemesterId: semesterId, status: 'DRAFT' },
    data: { status: 'FINALIZED' },
  });
  await tx.academicSemester.update({
    where: { id: semesterId },
    data: { isActive: false },
  });
};

// ======================== PRECONDITION CHECKS ========================

/**
 * Check preconditions before OPEN → CLOSED.
 * All APPROVED KRS students must have a FinalGrade record.
 * (DRAFT grades are auto-finalized by side-effect, so not a blocker.)
 */
const checkClosePreconditions = async (semesterId) => {
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

  if (missingGradeCount > 0) {
    const draftGradeCount = await prisma.finalGrade.count({
      where: { academicSemesterId: semesterId, status: 'DRAFT' },
    });
    const finalizedGradeCount = await prisma.finalGrade.count({
      where: { academicSemesterId: semesterId, status: 'FINALIZED' },
    });
    const totalEnrolledResult = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT ke."studentId" || '-' || ke."classId")::int AS count
      FROM "KrsEnrollment" ke
      INNER JOIN "Class" c ON c.id = ke."classId"
      WHERE c."academicSemesterId" = ${semesterId}
        AND ke.status IN ('APPROVED')
    `;
    const totalEnrolled = totalEnrolledResult[0]?.count ?? 0;

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

  return null; // OK
};

// ======================== CLOSING READINESS CHECK ========================

/**
 * Pre-flight check: is the semester ready to be closed?
 * Used by frontend to display a readiness summary in the transition modal.
 * @param {string} semesterId - The ID of the semester to check.
 * @returns {Promise<object>} An object containing the semester details and a readiness summary.
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
        prisma.finalGrade.count({ where: { classId: cls.id, status: 'DRAFT' } }),
        prisma.finalGrade.count({ where: { classId: cls.id, status: 'FINALIZED' } }),
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

// ======================== CRUD ========================

/**
 * Retrieves all academic semesters.
 * @returns {Promise<Array<object>>} List of semesters with counts of classes and grades.
 */
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

/**
 * Retrieves the currently active academic semester.
 * @returns {Promise<object|null>} The active semester object or null if none exists.
 */
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

/**
 * Retrieves a semester by its ID.
 * @param {string} id - The semester ID.
 * @returns {Promise<object>} The semester object.
 * @throws {Error} If the semester is not found.
 */
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

/**
 * Creates a new academic semester.
 * @param {object} data - The semester data.
 * @param {string} data.academicYear - The academic year (e.g., "2023/2024").
 * @param {string} data.semesterType - The type ("GANJIL" or "GENAP").
 * @param {string|Date} [data.startDate] - Start date.
 * @param {string|Date} [data.endDate] - End date.
 * @returns {Promise<object>} The created semester.
 */
const createSemester = async (data) => {
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

/**
 * Updates an existing academic semester.
 * @param {string} id - The semester ID.
 * @param {object} data - The update data.
 * @returns {Promise<object>} The updated semester.
 * @throws {Error} If the semester is not found.
 * @throws {Error} If attempting to update a CLOSED semester.
 */
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
 * Transition semester status.
 * Linear forward only: DRAFT → OPEN → CLOSED.
 * OPEN automatically sets the semester as active (only one allowed).
 * CLOSED clears the active flag.
 * @param {string} id - The semester ID.
 * @param {string} newStatus - The target status.
 * @returns {Promise<object>} The updated semester.
 * @throws {Error} If the transition is invalid.
 * @throws {Error} If preconditions (like grade completion) are not met.
 */
const updateStatus = async (id, newStatus) => {
  const semester = await prisma.academicSemester.findUnique({ where: { id } });
  if (!semester) throw new Error('Semester akademik tidak ditemukan');

  const currentStatus = semester.status;

  // 1. Validate transition
  if (!isTransitionAllowed(currentStatus, newStatus)) {
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    const allowedStr = allowed.length > 0 ? allowed.join(', ') : 'tidak ada';
    throw new Error(
      `Tidak dapat mengubah status dari ${currentStatus} ke ${newStatus}. ` +
      `Transisi yang valid: ${allowedStr}`
    );
  }

  // 2. Guard: only one OPEN semester at a time
  if (newStatus === 'OPEN') {
    const existingOpen = await prisma.academicSemester.findFirst({
      where: { status: 'OPEN', id: { not: id } },
      select: { id: true, academicYear: true, semesterType: true },
    });
    if (existingOpen) {
      throw new Error(
        `Sudah ada semester OPEN (${existingOpen.semesterType} ${existingOpen.academicYear}). ` +
        `Tutup semester tersebut terlebih dahulu sebelum membuka semester baru.`
      );
    }
  }

  // 3. Close preconditions (grade completeness)
  if (newStatus === 'CLOSED') {
    const blockResult = await checkClosePreconditions(id);
    if (blockResult) {
      const error = new Error(blockResult.message);
      error.code = 'PRECONDITION_FAILED';
      error.details = blockResult.details;
      throw error;
    }
  }

  // 4. Execute transition + side effects in a single transaction
  await prisma.$transaction(async (tx) => {
    await tx.academicSemester.update({
      where: { id },
      data: { status: newStatus },
    });

    if (newStatus === 'OPEN') {
      await onOpen(tx, id);
    } else if (newStatus === 'CLOSED') {
      await onClose(tx, id);
    }
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

// ======================== DELETE SEMESTER ========================

/**
 * Deletes a semester.
 * Only allowed for DRAFT semesters that have no associated classes or grades.
 * @param {string} id - The semester ID.
 * @returns {Promise<object>} The deleted semester object.
 */
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

  // Only DRAFT can be deleted
  if (semester.status !== 'DRAFT') {
    throw new Error(
      `Tidak dapat menghapus semester dengan status ${semester.status}. Hanya semester DRAFT yang dapat dihapus.`
    );
  }

  if (semester._count.classes > 0 || semester._count.finalGrades > 0) {
    throw new Error(
      'Tidak dapat menghapus semester yang sudah memiliki kelas atau nilai.'
    );
  }

  return prisma.academicSemester.delete({ where: { id } });
};

// ======================== STUDENT SEMESTER LIST ========================

/**
 * Get semesters visible to a student.
 * Returns: all OPEN/CLOSED semesters where the student has KRS enrollments,
 * plus the currently OPEN semester (even if no enrollments yet).
 * @param {string} studentId - The ID of the student.
 * @returns {Promise<Array<object>>} List of semesters ordered by newest first.
 */
const getStudentSemesters = async (studentId) => {
  // 1. Semesters where student has enrollments (OPEN or CLOSED only)
  const enrolledSemesterIds = await prisma.krsEnrollment.findMany({
    where: { studentId },
    select: { class: { select: { academicSemesterId: true } } },
    distinct: ['classId'],
  });

  const uniqueSemIds = [
    ...new Set(enrolledSemesterIds.map((e) => e.class.academicSemesterId)),
  ];

  // 2. Also include the currently OPEN semester (student may not have enrolled yet)
  const openSemester = await prisma.academicSemester.findFirst({
    where: { status: 'OPEN' },
    select: { id: true },
  });

  if (openSemester && !uniqueSemIds.includes(openSemester.id)) {
    uniqueSemIds.push(openSemester.id);
  }

  if (uniqueSemIds.length === 0) return [];

  // 3. Fetch semester details — exclude DRAFT
  const semesters = await prisma.academicSemester.findMany({
    where: {
      id: { in: uniqueSemIds },
      status: { in: ['OPEN', 'CLOSED'] },
    },
    select: {
      id: true,
      academicYear: true,
      semesterType: true,
      status: true,
      isActive: true,
      maxSks: true,
    },
    orderBy: [{ academicYear: 'desc' }, { semesterType: 'asc' }],
  });

  return semesters;
};

export {
  getAllSemesters,
  getActiveSemester,
  getSemesterById,
  createSemester,
  updateSemester,
  updateStatus,
  deleteSemester,
  getClosingReadiness,
  getStudentSemesters,
};
