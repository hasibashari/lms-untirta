import grpc from '@grpc/grpc-js';
import prisma from '../../config/prisma.js';

// =============================================================================
// CONFIG & CONSTANTS
// =============================================================================

const ALLOWED_TRANSITIONS = {
  DRAFT: ['OPEN'],
  OPEN: ['CLOSED'],
  CLOSED: [],
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Validasi apakah transisi status semester diizinkan
 */
const isTransitionAllowed = (from, to) => {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
};

/**
 * Normalisasi objek semester untuk dikirim via gRPC
 */
const mapSemesterResponse = (s) => {
  if (!s) return null;
  return {
    ...s,
    startDate: s.startDate?.toISOString() || '',
    endDate: s.endDate?.toISOString() || '',
    createdAt: s.createdAt?.toISOString() || '',
    updatedAt: s.updatedAt?.toISOString() || '',
  };
};

/**
 * Logika saat semester dibuka (OPEN)
 */
const onOpen = async (tx, semesterId) => {
  // 1. Buka pendaftaran untuk semua kelas di semester ini
  await tx.class.updateMany({
    where: { academicSemesterId: semesterId },
    data: { isEnrollmentOpen: true },
  });
  
  // 2. Set semester lain menjadi tidak aktif
  await tx.academicSemester.updateMany({
    data: { isActive: false },
  });
  
  // 3. Set semester ini menjadi aktif
  await tx.academicSemester.update({
    where: { id: semesterId },
    data: { isActive: true },
  });
};

/**
 * Logika saat semester ditutup (CLOSED)
 */
const onClose = async (tx, semesterId) => {
  // 1. Tutup semua pendaftaran kelas
  await tx.class.updateMany({
    where: { academicSemesterId: semesterId },
    data: { isEnrollmentOpen: false },
  });
  
  // 2. Finalisasi nilai yang masih DRAFT
  await tx.finalGrade.updateMany({
    where: { academicSemesterId: semesterId, status: 'DRAFT' },
    data: { status: 'FINALIZED' },
  });
  
  // 3. Set semester menjadi tidak aktif
  await tx.academicSemester.update({
    where: { id: semesterId },
    data: { isActive: false },
  });
};

/**
 * Mengecek apakah semester siap untuk ditutup
 * (Semua mahasiswa yang APPROVED harus sudah punya nilai)
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
    
    return {
      blocked: true,
      message: `Tidak dapat menutup semester: ${missingGradeCount} mahasiswa belum memiliki nilai akhir. ` +
               `Semua nilai harus diinput sebelum semester dapat ditutup.` +
               (draftGradeCount > 0 ? ` (${draftGradeCount} nilai DRAFT akan otomatis difinalisasi)` : ''),
    };
  }

  return null;
};

// =============================================================================
// HANDLERS — QUERY OPERATIONS
// =============================================================================

export const GetAllSemesters = async (call, callback) => {
  try {
    const semesters = await prisma.academicSemester.findMany({
      orderBy: [{ academicYear: 'desc' }, { semesterType: 'asc' }],
      include: { _count: { select: { classes: true, finalGrades: true } } },
    });

    callback(null, { semesters: semesters.map(mapSemesterResponse) });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GetActiveSemester = async (call, callback) => {
  try {
    const semester = await prisma.academicSemester.findFirst({
      where: { isActive: true },
      include: { _count: { select: { classes: true, finalGrades: true } } },
    });

    callback(null, { semester: mapSemesterResponse(semester) });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GetSemesterById = async (call, callback) => {
  try {
    const semester = await prisma.academicSemester.findUnique({
      where: { id: call.request.id },
      include: { _count: { select: { classes: true, finalGrades: true } } },
    });

    if (!semester) return callback({ code: grpc.status.NOT_FOUND, details: 'Semester tidak ditemukan' });

    callback(null, { semester: mapSemesterResponse(semester) });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GetStudentSemesters = async (call, callback) => {
  try {
    const { studentId } = call.request;

    // Ambil semester dimana mahasiswa pernah ambil KRS
    const enrolledSemesterIds = await prisma.krsEnrollment.findMany({
      where: { studentId },
      select: { class: { select: { academicSemesterId: true } } },
      distinct: ['classId'],
    });

    const uniqueSemIds = [...new Set(enrolledSemesterIds.map((e) => e.class.academicSemesterId))];

    // Selalu sertakan semester OPEN jika ada
    const openSemester = await prisma.academicSemester.findFirst({
      where: { status: 'OPEN' },
      select: { id: true },
    });

    if (openSemester && !uniqueSemIds.includes(openSemester.id)) {
      uniqueSemIds.push(openSemester.id);
    }

    if (uniqueSemIds.length === 0) return callback(null, { semesters: [] });

    const semesters = await prisma.academicSemester.findMany({
      where: {
        id: { in: uniqueSemIds },
        status: { in: ['OPEN', 'CLOSED'] },
      },
      orderBy: [{ academicYear: 'desc' }, { semesterType: 'asc' }],
    });

    callback(null, { semesters: semesters.map(mapSemesterResponse) });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

// =============================================================================
// HANDLERS — ADMIN OPERATIONS
// =============================================================================

export const CreateSemester = async (call, callback) => {
  try {
    const data = call.request;
    
    const existing = await prisma.academicSemester.findUnique({
      where: {
        academicYear_semesterType: {
          academicYear: data.academicYear,
          semesterType: data.semesterType,
        },
      },
    });

    if (existing) {
      return callback({ code: grpc.status.ALREADY_EXISTS, details: `Semester ${data.semesterType} ${data.academicYear} sudah ada` });
    }

    const created = await prisma.academicSemester.create({
      data: {
        academicYear: data.academicYear,
        semesterType: data.semesterType,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        maxSks: data.maxSks || 24,
        isAutoKrs: data.isAutoKrs !== undefined ? data.isAutoKrs : true,
        status: 'DRAFT',
        isActive: false,
      },
    });

    callback(null, { semester: mapSemesterResponse(created) });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const UpdateSemester = async (call, callback) => {
  try {
    const data = call.request;
    const semester = await prisma.academicSemester.findUnique({ where: { id: data.id } });

    if (!semester) return callback({ code: grpc.status.NOT_FOUND, details: 'Semester tidak ditemukan' });
    if (semester.status === 'CLOSED') {
      return callback({ code: grpc.status.FAILED_PRECONDITION, details: 'Semester CLOSED tidak bisa diubah' });
    }

    const updated = await prisma.academicSemester.update({
      where: { id: data.id },
      data: {
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        maxSks: data.maxSks || undefined,
        isAutoKrs: data.isAutoKrs !== undefined ? data.isAutoKrs : undefined,
      },
    });

    callback(null, { semester: mapSemesterResponse(updated) });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const UpdateStatus = async (call, callback) => {
  try {
    const { id, newStatus } = call.request;
    const semester = await prisma.academicSemester.findUnique({ where: { id } });

    if (!semester) return callback({ code: grpc.status.NOT_FOUND, details: 'Semester tidak ditemukan' });

    if (!isTransitionAllowed(semester.status, newStatus)) {
      return callback({ code: grpc.status.FAILED_PRECONDITION, details: `Transisi dari ${semester.status} ke ${newStatus} tidak valid` });
    }

    // Validasi tambahan untuk OPEN
    if (newStatus === 'OPEN') {
      const existingOpen = await prisma.academicSemester.findFirst({
        where: { status: 'OPEN', id: { not: id } },
      });
      if (existingOpen) {
        return callback({ code: grpc.status.FAILED_PRECONDITION, details: 'Tutup semester OPEN yang ada terlebih dahulu' });
      }
    }

    // Validasi tambahan untuk CLOSED
    if (newStatus === 'CLOSED') {
      const blockResult = await checkClosePreconditions(id);
      if (blockResult) return callback({ code: grpc.status.FAILED_PRECONDITION, details: blockResult.message });
    }

    // Eksekusi transisi status
    await prisma.$transaction(async (tx) => {
      await tx.academicSemester.update({
        where: { id },
        data: { status: newStatus },
      });

      if (newStatus === 'OPEN') await onOpen(tx, id);
      else if (newStatus === 'CLOSED') await onClose(tx, id);
    });

    const updated = await prisma.academicSemester.findUnique({
      where: { id },
      include: { _count: { select: { classes: true, finalGrades: true } } },
    });

    callback(null, { semester: mapSemesterResponse(updated) });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const DeleteSemester = async (call, callback) => {
  try {
    const { id } = call.request;
    const semester = await prisma.academicSemester.findUnique({
      where: { id },
      include: { _count: { select: { classes: true, finalGrades: true } } },
    });

    if (!semester) return callback({ code: grpc.status.NOT_FOUND, details: 'Semester tidak ditemukan' });
    if (semester.status !== 'DRAFT') {
      return callback({ code: grpc.status.FAILED_PRECONDITION, details: 'Hanya semester DRAFT yang dapat dihapus' });
    }
    if (semester._count.classes > 0) {
      return callback({ code: grpc.status.FAILED_PRECONDITION, details: 'Semester sudah memiliki kelas' });
    }

    await prisma.academicSemester.delete({ where: { id } });
    callback(null, { id, message: 'Semester berhasil dihapus' });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GetClosingReadiness = async (call, callback) => {
  try {
    const { id } = call.request;
    const semester = await prisma.academicSemester.findUnique({ where: { id } });
    if (!semester) return callback({ code: grpc.status.NOT_FOUND, details: 'Semester tidak ditemukan' });

    const classes = await prisma.class.findMany({
      where: { academicSemesterId: id },
      select: {
        id: true, section: true,
        course: { select: { code: true, title: true } },
        lecturer: { select: { name: true } },
        _count: {
          select: {
            krsEnrollments: { where: { status: 'APPROVED' } },
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

        const missingGrades = cls._count.krsEnrollments - cls._count.finalGrades;

        return {
          classId: cls.id,
          courseCode: cls.course.code,
          courseTitle: cls.course.title,
          section: cls.section,
          lecturerName: cls.lecturer.name,
          enrolledStudents: cls._count.krsEnrollments,
          totalGrades: cls._count.finalGrades,
          draftCount, finalizedCount,
          missingGrades: Math.max(0, missingGrades),
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

    callback(null, {
      semester: mapSemesterResponse(semester),
      summary,
      classes: classDetails
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};


