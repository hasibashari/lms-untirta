/**
 * Academic Semester Service — Unit Tests
 *
 * Tests the business logic in academic.service.js in isolation.
 * Prisma is fully mocked — no database calls are made.
 *
 * What we test:
 *   ✓ getAllSemesters — returns ordered list
 *   ✓ getActiveSemester — returns active or null
 *   ✓ getSemesterById — success, not found
 *   ✓ createSemester — success, duplicate
 *   ✓ updateSemester — success, not found, CLOSED blocked
 *   ✓ updateStatus — state machine transitions, guards, preconditions
 *   ✓ deleteSemester — success, not found, non-DRAFT, has dependencies
 *   ✓ getClosingReadiness — summary, not found
 *   ✓ getStudentSemesters — enrolled, open, empty
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismaMock } from '../helpers/prisma-mock.js';

// ─── Mock Setup ──────────────────────────────────────────────

const prismaMock = createPrismaMock();

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: prismaMock,
}));

// ─── Import AFTER mocking ────────────────────────────────────
const {
  getAllSemesters,
  getActiveSemester,
  getSemesterById,
  createSemester,
  updateSemester,
  updateStatus,
  deleteSemester,
  getClosingReadiness,
  getStudentSemesters,
} = await import('../../src/modules/academic/academic.service.js');

// ─── Shared Data ─────────────────────────────────────────────
const SEMESTER_ID = 'sem-uuid-1';

const baseSemester = {
  id: SEMESTER_ID,
  academicYear: '2025/2026',
  semesterType: 'GANJIL',
  status: 'DRAFT',
  isActive: false,
  maxSks: 24,
  startDate: null,
  endDate: null,
};

const baseSemesterWithCounts = {
  ...baseSemester,
  _count: { classes: 0, finalGrades: 0 },
};

// ─── Reset ───────────────────────────────────────────────────
beforeEach(() => {
  jest.resetAllMocks();
});

// ═════════════════════════════════════════════════════════════
// getAllSemesters
// ═════════════════════════════════════════════════════════════
describe('getAllSemesters', () => {
  it('returns all semesters ordered by academicYear desc', async () => {
    const semesters = [baseSemesterWithCounts];
    prismaMock.academicSemester.findMany.mockResolvedValueOnce(semesters);

    const result = await getAllSemesters();

    expect(result).toEqual(semesters);
    expect(prismaMock.academicSemester.findMany).toHaveBeenCalledWith({
      orderBy: [{ academicYear: 'desc' }, { semesterType: 'asc' }],
      include: { _count: { select: { classes: true, finalGrades: true } } },
    });
  });
});

// ═════════════════════════════════════════════════════════════
// getActiveSemester
// ═════════════════════════════════════════════════════════════
describe('getActiveSemester', () => {
  it('returns the active semester', async () => {
    const active = { ...baseSemesterWithCounts, status: 'OPEN', isActive: true };
    prismaMock.academicSemester.findFirst.mockResolvedValueOnce(active);

    const result = await getActiveSemester();

    expect(result).toEqual(active);
    expect(prismaMock.academicSemester.findFirst).toHaveBeenCalledWith({
      where: { isActive: true },
      include: { _count: { select: { classes: true, finalGrades: true } } },
    });
  });

  it('returns null when no active semester', async () => {
    prismaMock.academicSemester.findFirst.mockResolvedValueOnce(null);

    const result = await getActiveSemester();

    expect(result).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════
// getSemesterById
// ═════════════════════════════════════════════════════════════
describe('getSemesterById', () => {
  it('returns semester by id', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(baseSemesterWithCounts);

    const result = await getSemesterById(SEMESTER_ID);

    expect(result).toEqual(baseSemesterWithCounts);
    expect(prismaMock.academicSemester.findUnique).toHaveBeenCalledWith({
      where: { id: SEMESTER_ID },
      include: { _count: { select: { classes: true, finalGrades: true } } },
    });
  });

  it('throws when not found', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(null);

    await expect(getSemesterById('nonexistent')).rejects.toThrow(
      'Semester akademik tidak ditemukan',
    );
  });
});

// ═════════════════════════════════════════════════════════════
// createSemester
// ═════════════════════════════════════════════════════════════
describe('createSemester', () => {
  it('creates a new semester with default maxSks', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(null);
    prismaMock.academicSemester.create.mockResolvedValueOnce(baseSemester);

    const result = await createSemester({
      academicYear: '2025/2026',
      semesterType: 'GANJIL',
    });

    expect(result).toEqual(baseSemester);
    expect(prismaMock.academicSemester.create).toHaveBeenCalledWith({
      data: {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
        startDate: null,
        endDate: null,
        maxSks: 24,
        status: 'DRAFT',
        isActive: false,
      },
    });
  });

  it('creates with explicit maxSks and dates', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(null);
    prismaMock.academicSemester.create.mockResolvedValueOnce(baseSemester);

    await createSemester({
      academicYear: '2025/2026',
      semesterType: 'GANJIL',
      maxSks: 20,
      startDate: '2025-09-01',
      endDate: '2026-01-31',
    });

    expect(prismaMock.academicSemester.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        maxSks: 20,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-01-31'),
      }),
    });
  });

  it('throws when semester already exists', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(baseSemester);

    await expect(
      createSemester({ academicYear: '2025/2026', semesterType: 'GANJIL' }),
    ).rejects.toThrow('Semester GANJIL 2025/2026 sudah ada');
  });
});

// ═════════════════════════════════════════════════════════════
// updateSemester
// ═════════════════════════════════════════════════════════════
describe('updateSemester', () => {
  it('updates dates and maxSks', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(baseSemester);
    prismaMock.academicSemester.update.mockResolvedValueOnce({
      ...baseSemester,
      maxSks: 20,
    });

    const result = await updateSemester(SEMESTER_ID, { maxSks: 20 });

    expect(result.maxSks).toBe(20);
    expect(prismaMock.academicSemester.update).toHaveBeenCalledWith({
      where: { id: SEMESTER_ID },
      data: expect.objectContaining({ maxSks: 20 }),
    });
  });

  it('throws when not found', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(null);

    await expect(updateSemester('nonexistent', {})).rejects.toThrow(
      'Semester akademik tidak ditemukan',
    );
  });

  it('throws when semester is CLOSED', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce({
      ...baseSemester,
      status: 'CLOSED',
    });

    await expect(updateSemester(SEMESTER_ID, { maxSks: 20 })).rejects.toThrow(
      'Tidak dapat mengubah semester yang sudah CLOSED',
    );
  });
});

// ═════════════════════════════════════════════════════════════
// updateStatus — State Machine
// ═════════════════════════════════════════════════════════════
describe('updateStatus', () => {
  it('transitions DRAFT → OPEN and runs onOpen side-effects', async () => {
    // 1) findUnique for lookup
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(baseSemester);
    // 2) findFirst for existing open check → none
    prismaMock.academicSemester.findFirst.mockResolvedValueOnce(null);
    // 3) $transaction executes callback with prismaMock as tx
    prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock));
    // mocks for side-effects inside tx
    prismaMock.academicSemester.update.mockResolvedValue({});
    prismaMock.class.updateMany.mockResolvedValue({});
    prismaMock.academicSemester.updateMany.mockResolvedValue({});
    // 4) final findUnique after tx
    const updatedSemester = { ...baseSemesterWithCounts, status: 'OPEN', isActive: true };
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(updatedSemester);

    const result = await updateStatus(SEMESTER_ID, 'OPEN');

    expect(result).toEqual(updatedSemester);
    // verify enrollment opened
    expect(prismaMock.class.updateMany).toHaveBeenCalledWith({
      where: { academicSemesterId: SEMESTER_ID },
      data: { isEnrollmentOpen: true },
    });
    // verify all semesters deactivated then this one activated
    expect(prismaMock.academicSemester.updateMany).toHaveBeenCalledWith({
      data: { isActive: false },
    });
  });

  it('blocks DRAFT → OPEN when another semester is already OPEN', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(baseSemester);
    prismaMock.academicSemester.findFirst.mockResolvedValueOnce({
      id: 'other-sem',
      academicYear: '2024/2025',
      semesterType: 'GENAP',
    });

    await expect(updateStatus(SEMESTER_ID, 'OPEN')).rejects.toThrow(
      'Sudah ada semester OPEN',
    );
  });

  it('transitions OPEN → CLOSED when no missing grades', async () => {
    const openSemester = { ...baseSemester, status: 'OPEN', isActive: true };
    // 1) lookup
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(openSemester);
    // 2) checkClosePreconditions: $queryRaw returns 0 missing
    prismaMock.$queryRaw.mockResolvedValueOnce([{ count: 0 }]);
    // 3) transaction
    prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock));
    prismaMock.academicSemester.update.mockResolvedValue({});
    prismaMock.class.updateMany.mockResolvedValue({});
    prismaMock.finalGrade.updateMany.mockResolvedValue({});
    // 4) final findUnique
    const closedSemester = { ...baseSemesterWithCounts, status: 'CLOSED', isActive: false };
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(closedSemester);

    const result = await updateStatus(SEMESTER_ID, 'CLOSED');

    expect(result).toEqual(closedSemester);
    // verify enrollment closed
    expect(prismaMock.class.updateMany).toHaveBeenCalledWith({
      where: { academicSemesterId: SEMESTER_ID },
      data: { isEnrollmentOpen: false },
    });
    // verify draft grades finalized
    expect(prismaMock.finalGrade.updateMany).toHaveBeenCalledWith({
      where: { academicSemesterId: SEMESTER_ID, status: 'DRAFT' },
      data: { status: 'FINALIZED' },
    });
  });

  it('blocks OPEN → CLOSED when preconditions fail (missing grades)', async () => {
    const openSemester = { ...baseSemester, status: 'OPEN', isActive: true };
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(openSemester);
    // missing grades
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ count: 5 }])   // studentsWithoutGrade
      .mockResolvedValueOnce([{ count: 20 }]);  // totalEnrolled
    prismaMock.finalGrade.count
      .mockResolvedValueOnce(3)   // draftGradeCount
      .mockResolvedValueOnce(12); // finalizedGradeCount

    await expect(updateStatus(SEMESTER_ID, 'CLOSED')).rejects.toThrow(
      'Tidak dapat menutup semester',
    );

    try {
      await updateStatus(SEMESTER_ID, 'CLOSED');
    } catch (err) {
      // Re-mock for this second call
    }
    // Already threw above, just verify the pattern
  });

  it('rejects precondition error with code PRECONDITION_FAILED', async () => {
    const openSemester = { ...baseSemester, status: 'OPEN', isActive: true };
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(openSemester);
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ count: 2 }])
      .mockResolvedValueOnce([{ count: 10 }]);
    prismaMock.finalGrade.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(7);

    try {
      await updateStatus(SEMESTER_ID, 'CLOSED');
      expect(true).toBe(false); // should not reach
    } catch (err) {
      expect(err.code).toBe('PRECONDITION_FAILED');
      expect(err.details).toEqual({
        totalEnrolled: 10,
        missingGradeCount: 2,
        draftGradeCount: 1,
        finalizedGradeCount: 7,
      });
    }
  });

  it('rejects invalid transition DRAFT → CLOSED', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(baseSemester);

    await expect(updateStatus(SEMESTER_ID, 'CLOSED')).rejects.toThrow(
      'Tidak dapat mengubah status dari DRAFT ke CLOSED',
    );
  });

  it('rejects invalid transition OPEN → DRAFT', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce({
      ...baseSemester,
      status: 'OPEN',
    });

    await expect(updateStatus(SEMESTER_ID, 'DRAFT')).rejects.toThrow(
      'Tidak dapat mengubah status dari OPEN ke DRAFT',
    );
  });

  it('rejects any transition from CLOSED', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce({
      ...baseSemester,
      status: 'CLOSED',
    });

    await expect(updateStatus(SEMESTER_ID, 'OPEN')).rejects.toThrow(
      'Transisi yang valid: tidak ada',
    );
  });

  it('throws when semester not found', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(null);

    await expect(updateStatus('nonexistent', 'OPEN')).rejects.toThrow(
      'Semester akademik tidak ditemukan',
    );
  });
});

// ═════════════════════════════════════════════════════════════
// deleteSemester
// ═════════════════════════════════════════════════════════════
describe('deleteSemester', () => {
  it('deletes a DRAFT semester with no dependencies', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(baseSemesterWithCounts);
    prismaMock.academicSemester.delete.mockResolvedValueOnce(baseSemester);

    const result = await deleteSemester(SEMESTER_ID);

    expect(result).toEqual(baseSemester);
    expect(prismaMock.academicSemester.delete).toHaveBeenCalledWith({
      where: { id: SEMESTER_ID },
    });
  });

  it('throws when not found', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(null);

    await expect(deleteSemester('nonexistent')).rejects.toThrow(
      'Semester akademik tidak ditemukan',
    );
  });

  it('throws when semester is OPEN', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce({
      ...baseSemesterWithCounts,
      status: 'OPEN',
    });

    await expect(deleteSemester(SEMESTER_ID)).rejects.toThrow(
      'Hanya semester DRAFT yang dapat dihapus',
    );
  });

  it('throws when semester has classes', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce({
      ...baseSemester,
      _count: { classes: 3, finalGrades: 0 },
    });

    await expect(deleteSemester(SEMESTER_ID)).rejects.toThrow(
      'sudah memiliki kelas atau nilai',
    );
  });

  it('throws when semester has final grades', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce({
      ...baseSemester,
      _count: { classes: 0, finalGrades: 5 },
    });

    await expect(deleteSemester(SEMESTER_ID)).rejects.toThrow(
      'sudah memiliki kelas atau nilai',
    );
  });
});

// ═════════════════════════════════════════════════════════════
// getClosingReadiness
// ═════════════════════════════════════════════════════════════
describe('getClosingReadiness', () => {
  it('returns readiness summary for a semester', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce({
      id: SEMESTER_ID,
      status: 'OPEN',
      academicYear: '2025/2026',
      semesterType: 'GANJIL',
    });

    const classData = {
      id: 'class-1',
      section: 'A',
      course: { code: 'IF101', title: 'Pemrograman' },
      lecturer: { name: 'Dr. Budi' },
      _count: { krsEnrollments: 10, finalGrades: 10 },
    };
    prismaMock.class.findMany.mockResolvedValueOnce([classData]);
    prismaMock.finalGrade.count
      .mockResolvedValueOnce(0)   // draftCount
      .mockResolvedValueOnce(10); // finalizedCount

    const result = await getClosingReadiness(SEMESTER_ID);

    expect(result.semester.id).toBe(SEMESTER_ID);
    expect(result.summary.totalClasses).toBe(1);
    expect(result.summary.isReady).toBe(true);
    expect(result.summary.totalMissing).toBe(0);
    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].isReady).toBe(true);
  });

  it('reports unready classes with missing grades', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce({
      id: SEMESTER_ID,
      status: 'OPEN',
      academicYear: '2025/2026',
      semesterType: 'GANJIL',
    });

    const classData = {
      id: 'class-1',
      section: 'A',
      course: { code: 'IF101', title: 'Pemrograman' },
      lecturer: { name: 'Dr. Budi' },
      _count: { krsEnrollments: 10, finalGrades: 7 },
    };
    prismaMock.class.findMany.mockResolvedValueOnce([classData]);
    prismaMock.finalGrade.count
      .mockResolvedValueOnce(2)  // draftCount
      .mockResolvedValueOnce(5); // finalizedCount

    const result = await getClosingReadiness(SEMESTER_ID);

    expect(result.summary.isReady).toBe(false);
    expect(result.summary.totalMissing).toBe(3);
    expect(result.classes[0].isReady).toBe(false);
    expect(result.classes[0].missingGrades).toBe(3);
  });

  it('throws when semester not found', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValueOnce(null);

    await expect(getClosingReadiness('nonexistent')).rejects.toThrow(
      'Semester akademik tidak ditemukan',
    );
  });
});

// ═════════════════════════════════════════════════════════════
// getStudentSemesters
// ═════════════════════════════════════════════════════════════
describe('getStudentSemesters', () => {
  const STUDENT_ID = 'student-uuid-1';

  it('returns semesters where student has enrollments', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValueOnce([
      { class: { academicSemesterId: SEMESTER_ID } },
    ]);
    prismaMock.academicSemester.findFirst.mockResolvedValueOnce(null); // no open
    prismaMock.academicSemester.findMany.mockResolvedValueOnce([
      { id: SEMESTER_ID, academicYear: '2025/2026', semesterType: 'GANJIL', status: 'CLOSED', isActive: false, maxSks: 24 },
    ]);

    const result = await getStudentSemesters(STUDENT_ID);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(SEMESTER_ID);
  });

  it('includes open semester even if no enrollments', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValueOnce([]);
    prismaMock.academicSemester.findFirst.mockResolvedValueOnce({
      id: 'open-sem',
    });
    prismaMock.academicSemester.findMany.mockResolvedValueOnce([
      { id: 'open-sem', academicYear: '2025/2026', semesterType: 'GANJIL', status: 'OPEN', isActive: true, maxSks: 24 },
    ]);

    const result = await getStudentSemesters(STUDENT_ID);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('open-sem');
  });

  it('returns empty array when no enrollments and no open semester', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValueOnce([]);
    prismaMock.academicSemester.findFirst.mockResolvedValueOnce(null);

    const result = await getStudentSemesters(STUDENT_ID);

    expect(result).toEqual([]);
  });
});
