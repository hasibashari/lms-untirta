import grpc from '@grpc/grpc-js';
import prisma from '../../config/prisma.js';

const ALLOWED_TRANSITIONS = {
  DRAFT: ['OPEN'],
  OPEN: ['CLOSED'],
  CLOSED: [],
};

const isTransitionAllowed = (from, to) => {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
};

const onOpen = async (tx, semesterId) => {
  await tx.class.updateMany({
    where: { academicSemesterId: semesterId },
    data: { isEnrollmentOpen: true },
  });
  await tx.academicSemester.updateMany({
    data: { isActive: false },
  });
  await tx.academicSemester.update({
    where: { id: semesterId },
    data: { isActive: true },
  });
};

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

  return null;
};

export const academicService = {
  GetAllSemesters: async (call, callback) => {
    try {
      const semesters = await prisma.academicSemester.findMany({
        orderBy: [{ academicYear: 'desc' }, { semesterType: 'asc' }],
        include: { _count: { select: { classes: true, finalGrades: true } } },
      });

      const formatted = semesters.map(s => ({
        ...s,
        startDate: s.startDate?.toISOString() || '',
        endDate: s.endDate?.toISOString() || '',
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }));

      callback(null, { semesters: formatted });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetActiveSemester: async (call, callback) => {
    try {
      const semester = await prisma.academicSemester.findFirst({
        where: { isActive: true },
        include: { _count: { select: { classes: true, finalGrades: true } } },
      });

      if (!semester) return callback(null, { semester: null });

      const formatted = {
        ...semester,
        startDate: semester.startDate?.toISOString() || '',
        endDate: semester.endDate?.toISOString() || '',
        createdAt: semester.createdAt.toISOString(),
        updatedAt: semester.updatedAt.toISOString(),
      };

      callback(null, { semester: formatted });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetSemesterById: async (call, callback) => {
    try {
      const { id } = call.request;
      const semester = await prisma.academicSemester.findUnique({
        where: { id },
        include: { _count: { select: { classes: true, finalGrades: true } } },
      });

      if (!semester) return callback({ code: grpc.status.NOT_FOUND, details: 'Semester akademik tidak ditemukan' });

      const formatted = {
        ...semester,
        startDate: semester.startDate?.toISOString() || '',
        endDate: semester.endDate?.toISOString() || '',
        createdAt: semester.createdAt.toISOString(),
        updatedAt: semester.updatedAt.toISOString(),
      };

      callback(null, { semester: formatted });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  CreateSemester: async (call, callback) => {
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

      const formatted = {
        ...created,
        startDate: created.startDate?.toISOString() || '',
        endDate: created.endDate?.toISOString() || '',
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };

      callback(null, { semester: formatted });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  UpdateSemester: async (call, callback) => {
    try {
      const data = call.request;
      const semester = await prisma.academicSemester.findUnique({ where: { id: data.id } });

      if (!semester) return callback({ code: grpc.status.NOT_FOUND, details: 'Semester akademik tidak ditemukan' });
      if (semester.status === 'CLOSED') return callback({ code: grpc.status.FAILED_PRECONDITION, details: 'Tidak dapat mengubah semester yang sudah CLOSED' });

      const updated = await prisma.academicSemester.update({
        where: { id: data.id },
        data: {
          startDate: data.startDate ? new Date(data.startDate) : semester.startDate,
          endDate: data.endDate ? new Date(data.endDate) : semester.endDate,
          maxSks: data.maxSks !== 0 ? data.maxSks : undefined,
          isAutoKrs: data.isAutoKrs !== undefined ? data.isAutoKrs : semester.isAutoKrs,
        },
      });

      const formatted = {
        ...updated,
        startDate: updated.startDate?.toISOString() || '',
        endDate: updated.endDate?.toISOString() || '',
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };

      callback(null, { semester: formatted });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  UpdateStatus: async (call, callback) => {
    try {
      const { id, newStatus } = call.request;
      const semester = await prisma.academicSemester.findUnique({ where: { id } });

      if (!semester) return callback({ code: grpc.status.NOT_FOUND, details: 'Semester akademik tidak ditemukan' });

      const currentStatus = semester.status;

      if (!isTransitionAllowed(currentStatus, newStatus)) {
        const allowed = ALLOWED_TRANSITIONS[currentStatus];
        const allowedStr = allowed.length > 0 ? allowed.join(', ') : 'tidak ada';
        return callback({ code: grpc.status.FAILED_PRECONDITION, details: `Tidak dapat mengubah status dari ${currentStatus} ke ${newStatus}. Transisi yang valid: ${allowedStr}` });
      }

      if (newStatus === 'OPEN') {
        const existingOpen = await prisma.academicSemester.findFirst({
          where: { status: 'OPEN', id: { not: id } },
          select: { id: true, academicYear: true, semesterType: true },
        });
        if (existingOpen) {
          return callback({ code: grpc.status.FAILED_PRECONDITION, details: `Sudah ada semester OPEN (${existingOpen.semesterType} ${existingOpen.academicYear}). Tutup semester tersebut terlebih dahulu sebelum membuka semester baru.` });
        }
      }

      if (newStatus === 'CLOSED') {
        const blockResult = await checkClosePreconditions(id);
        if (blockResult) {
          return callback({ code: grpc.status.FAILED_PRECONDITION, details: blockResult.message });
        }
      }

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

      const updated = await prisma.academicSemester.findUnique({
        where: { id },
        include: { _count: { select: { classes: true, finalGrades: true } } },
      });

      const formatted = {
        ...updated,
        startDate: updated.startDate?.toISOString() || '',
        endDate: updated.endDate?.toISOString() || '',
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };

      callback(null, { semester: formatted });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  DeleteSemester: async (call, callback) => {
    try {
      const { id } = call.request;
      const semester = await prisma.academicSemester.findUnique({
        where: { id },
        include: { _count: { select: { classes: true, finalGrades: true } } },
      });

      if (!semester) return callback({ code: grpc.status.NOT_FOUND, details: 'Semester akademik tidak ditemukan' });

      if (semester.status !== 'DRAFT') {
        return callback({ code: grpc.status.FAILED_PRECONDITION, details: `Tidak dapat menghapus semester dengan status ${semester.status}. Hanya semester DRAFT yang dapat dihapus.` });
      }

      if (semester._count.classes > 0 || semester._count.finalGrades > 0) {
        return callback({ code: grpc.status.FAILED_PRECONDITION, details: 'Tidak dapat menghapus semester yang sudah memiliki kelas atau nilai.' });
      }

      await prisma.academicSemester.delete({ where: { id } });
      callback(null, { id, message: 'Semester berhasil dihapus' });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetClosingReadiness: async (call, callback) => {
    try {
      const { id } = call.request;
      const semester = await prisma.academicSemester.findUnique({
        where: { id },
        select: { id: true, status: true, academicYear: true, semesterType: true, startDate: true, endDate: true, isActive: true, maxSks: true, createdAt: true, updatedAt: true },
      });

      if (!semester) return callback({ code: grpc.status.NOT_FOUND, details: 'Semester akademik tidak ditemukan' });

      const classes = await prisma.class.findMany({
        where: { academicSemesterId: id },
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

      const formattedSemester = {
        ...semester,
        startDate: semester.startDate?.toISOString() || '',
        endDate: semester.endDate?.toISOString() || '',
        createdAt: semester.createdAt?.toISOString() || '',
        updatedAt: semester.updatedAt?.toISOString() || '',
      };

      callback(null, { semester: formattedSemester, summary, classes: classDetails });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetStudentSemesters: async (call, callback) => {
    try {
      const { studentId } = call.request;

      const enrolledSemesterIds = await prisma.krsEnrollment.findMany({
        where: { studentId },
        select: { class: { select: { academicSemesterId: true } } },
        distinct: ['classId'],
      });

      const uniqueSemIds = [
        ...new Set(enrolledSemesterIds.map((e) => e.class.academicSemesterId)),
      ];

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

      const formatted = semesters.map(s => ({
        ...s,
        startDate: '',
        endDate: '',
        createdAt: '',
        updatedAt: '',
      }));

      callback(null, { semesters: formatted });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  }
};
