/**
 * KRS Service — Unit Tests
 *
 * Tests the business logic in krs.service.js in isolation.
 * Prisma is fully mocked — no database calls are made.
 *
 * What we test:
 *   ✓ getSksEligibility — success, semester not found
 *   ✓ getAvailableClasses — with results, empty with diagnostics, auto-resolve semester
 *   ✓ enrollClass — success, class not found, enrollment closed, semester not open,
 *                    capacity full, duplicate enrollment, duplicate course, SKS limit
 *   ✓ dropClass — success, not enrolled, approved (blocked), semester not open
 *   ✓ getMyKRS — with enrollments, empty, with academicSemesterId filter
 *   ✓ updateEnrollmentStatus — approve, reject, revoke, invalid transition,
 *                               not found, dospem auth, admin auth, admin revoke blocked
 *   ✓ bulkUpdateEnrollmentStatus — success, empty array, not found, auth checks
 *   ✓ getPendingKRS — dosen view, admin view, with filter
 *   ✓ reviseRejectedEnrollment — success, not found, not rejected, semester closed
 *   ✓ getApprovalHistory — success, not found, unauthorized student, unauthorized dosen
 *   ✓ getAdvisoryStudents — success, with filter
 *   ✓ getKrsMonitoring — success, with filter
 *
 * Mocking Strategy:
 *   jest.unstable_mockModule() replaces ../../config/prisma.js BEFORE
 *   the service module is imported. Required for ESM mocking.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismaMock } from '../helpers/prisma-mock.js';
import {
  STUDENT_ID,
  STUDENT_ID_2,
  DOSEN_ID,
  ADMIN_ID,
  SEMESTER_ID,
  CLASS_ID,
  COURSE_ID,
  COURSE_ID_2,
  ENROLLMENT_ID,
  mockSemester,
  mockClass,
  mockEnrollment,
} from '../fixtures/krs.fixture.js';

// ─── Mock Setup ──────────────────────────────────────────────

const prismaMock = createPrismaMock();

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: prismaMock,
}));

// ─── Import AFTER mocking ────────────────────────────────────

const {
  getSksEligibility,
  getAvailableClasses,
  enrollClass,
  dropClass,
  getMyKRS,
  updateEnrollmentStatus,
  bulkUpdateEnrollmentStatus,
  getPendingKRS,
  reviseRejectedEnrollment,
  getApprovalHistory,
  getAdvisoryStudents,
  getKrsMonitoring,
} = await import('../../src/modules/krs/krs.service.js');

// ─── Helpers ─────────────────────────────────────────────────

/** Configure $transaction mock to execute the callback with prismaMock as tx */
function setupTransaction() {
  prismaMock.$transaction.mockImplementation(async (fn) => {
    if (typeof fn === 'function') return fn(prismaMock);
    if (Array.isArray(fn)) return Promise.all(fn);
    return undefined;
  });
}

// ═════════════════════════════════════════════════════════════
// TESTS
// ═════════════════════════════════════════════════════════════

beforeEach(() => {
  jest.resetAllMocks();
  setupTransaction();
});

// ─── getSksEligibility ───────────────────────────────────────

describe('getSksEligibility', () => {
  it('should return SKS info when data exists', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValue({ maxSks: 24 });
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      { class: { course: { sks: 3 } } },
      { class: { course: { sks: 4 } } },
    ]);

    const result = await getSksEligibility(STUDENT_ID, SEMESTER_ID);

    expect(result).toEqual({ maxSKS: 24, currentSKS: 7, remainingSKS: 17 });
    expect(prismaMock.academicSemester.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: SEMESTER_ID } })
    );
  });

  it('should default sks to 3 when course has no sks', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValue({ maxSks: 24 });
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      { class: { course: { sks: null } } },
    ]);

    const result = await getSksEligibility(STUDENT_ID, SEMESTER_ID);
    expect(result.currentSKS).toBe(3);
  });

  it('should throw when semester not found', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValue(null);

    await expect(getSksEligibility(STUDENT_ID, 'bad-id'))
      .rejects.toThrow('Semester akademik tidak ditemukan');
  });
});

// ─── getAvailableClasses ─────────────────────────────────────

describe('getAvailableClasses', () => {
  it('should return available classes for student', async () => {
    const cls = mockClass();
    prismaMock.academicSemester.findFirst.mockResolvedValue({ id: SEMESTER_ID, status: 'OPEN' });
    prismaMock.academicSemester.findUnique.mockResolvedValue(
      mockSemester({ _count: { classes: 5 } })
    );
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);
    prismaMock.class.findMany.mockResolvedValue([cls]);

    const result = await getAvailableClasses(STUDENT_ID);

    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].course.code).toBe('IF-101');
    expect(result._meta).toBeNull();
  });

  it('should exclude classes already enrolled by student', async () => {
    prismaMock.academicSemester.findFirst.mockResolvedValue({ id: SEMESTER_ID, status: 'OPEN' });
    prismaMock.academicSemester.findUnique.mockResolvedValue(
      mockSemester({ _count: { classes: 5 } })
    );
    prismaMock.krsEnrollment.findMany.mockResolvedValue([{ classId: CLASS_ID }]);
    prismaMock.class.findMany.mockResolvedValue([]);

    const result = await getAvailableClasses(STUDENT_ID);

    // The where clause should include notIn
    const callArgs = prismaMock.class.findMany.mock.calls[0][0];
    expect(callArgs.where.id).toEqual({ notIn: [CLASS_ID] });
  });

  it('should use provided academicSemesterId filter', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValue(
      mockSemester({ _count: { classes: 2 } })
    );
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);
    prismaMock.class.findMany.mockResolvedValue([]);
    prismaMock.class.count.mockResolvedValue(0);

    await getAvailableClasses(STUDENT_ID, { academicSemesterId: SEMESTER_ID });

    // findFirst (auto-resolve) should NOT be called when semester is provided
    expect(prismaMock.academicSemester.findFirst).not.toHaveBeenCalled();
  });

  it('should return diagnostic _meta when no classes found (NO_CLASSES_CREATED)', async () => {
    prismaMock.academicSemester.findFirst.mockResolvedValue({ id: SEMESTER_ID, status: 'OPEN' });
    prismaMock.academicSemester.findUnique.mockResolvedValue(
      mockSemester({ _count: { classes: 0 } })
    );
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);
    prismaMock.class.findMany.mockResolvedValue([]);
    prismaMock.class.count
      .mockResolvedValueOnce(0) // totalClassesInSemester
      .mockResolvedValueOnce(0); // closedClasses

    const result = await getAvailableClasses(STUDENT_ID);

    expect(result.classes).toHaveLength(0);
    expect(result._meta).not.toBeNull();
    expect(result._meta.reason).toBe('NO_CLASSES_CREATED');
  });

  it('should return NO_ACTIVE_SEMESTER when no semester found', async () => {
    prismaMock.academicSemester.findFirst.mockResolvedValue(null);
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);
    prismaMock.class.findMany.mockResolvedValue([]);

    const result = await getAvailableClasses(STUDENT_ID);

    expect(result._meta.reason).toBe('NO_ACTIVE_SEMESTER');
  });

  it('should filter by course semester when provided', async () => {
    prismaMock.academicSemester.findFirst.mockResolvedValue({ id: SEMESTER_ID, status: 'OPEN' });
    prismaMock.academicSemester.findUnique.mockResolvedValue(
      mockSemester({ _count: { classes: 5 } })
    );
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);
    prismaMock.class.findMany.mockResolvedValue([]);
    prismaMock.class.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(0);

    await getAvailableClasses(STUDENT_ID, { semester: '3' });

    const callArgs = prismaMock.class.findMany.mock.calls[0][0];
    expect(callArgs.where.course).toEqual({ semester: 3 });
  });
});

// ─── enrollClass ─────────────────────────────────────────────

describe('enrollClass', () => {
  const classData = {
    id: CLASS_ID,
    capacity: 40,
    isEnrollmentOpen: true,
    academicSemesterId: SEMESTER_ID,
    courseId: COURSE_ID,
    course: { id: COURSE_ID, title: 'Pemrograman Web', code: 'IF-101', sks: 3 },
    _count: { krsEnrollments: 5 },
  };

  beforeEach(() => {
    // Default happy-path mocks
    prismaMock.class.findUnique.mockResolvedValue(classData);
    prismaMock.academicSemester.findUnique
      .mockResolvedValueOnce(mockSemester()) // assertEnrollmentPeriodOpen
      .mockResolvedValueOnce({ maxSks: 24 }); // SKS limit check
    prismaMock.krsEnrollment.findUnique.mockResolvedValue(null); // no existing
    prismaMock.krsEnrollment.findFirst.mockResolvedValue(null); // no dup course
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]); // 0 current SKS
    prismaMock.krsEnrollment.create.mockResolvedValue({
      id: ENROLLMENT_ID,
      status: 'PENDING',
      createdAt: new Date(),
      class: mockClass(),
    });
  });

  it('should enroll student successfully', async () => {
    const result = await enrollClass(STUDENT_ID, CLASS_ID);

    expect(result.id).toBe(ENROLLMENT_ID);
    expect(result.status).toBe('PENDING');
    expect(prismaMock.krsEnrollment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: STUDENT_ID,
          classId: CLASS_ID,
          status: 'PENDING',
        }),
      })
    );
  });

  it('should throw when class not found', async () => {
    prismaMock.class.findUnique.mockResolvedValue(null);

    const error = await enrollClass(STUDENT_ID, 'bad-class').catch(e => e);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Kelas offering tidak ditemukan');
  });

  it('should throw when enrollment is closed', async () => {
    prismaMock.class.findUnique.mockResolvedValue({
      ...classData,
      isEnrollmentOpen: false,
    });

    const error = await enrollClass(STUDENT_ID, CLASS_ID).catch(e => e);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('ENROLLMENT_CLOSED');
    expect(error.message).toBe('Pendaftaran kelas ini belum dibuka');
  });

  it('should throw when semester is not OPEN', async () => {
    prismaMock.academicSemester.findUnique.mockReset();
    prismaMock.academicSemester.findUnique.mockResolvedValue(
      mockSemester({ status: 'CLOSED', academicYear: '2025/2026', semesterType: 'GANJIL' })
    );

    const error = await enrollClass(STUDENT_ID, CLASS_ID).catch(e => e);
    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/Masa pengisian KRS.*belum dibuka atau sudah ditutup/);
  });

  it('should throw when class capacity is full', async () => {
    prismaMock.class.findUnique.mockResolvedValue({
      ...classData,
      _count: { krsEnrollments: 40 },
    });

    const error = await enrollClass(STUDENT_ID, CLASS_ID).catch(e => e);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('CLASS_FULL');
    expect(error.message).toBe('Kapasitas kelas sudah penuh');
  });

  it('should throw when student already enrolled in same class', async () => {
    prismaMock.krsEnrollment.findUnique.mockResolvedValue({ id: 'existing' });

    const error = await enrollClass(STUDENT_ID, CLASS_ID).catch(e => e);
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Anda sudah terdaftar di kelas ini');
  });

  it('should throw when student enrolled in another section of same course', async () => {
    prismaMock.krsEnrollment.findFirst.mockResolvedValue({
      id: 'dup',
      class: { section: 'B' },
    });

    const error = await enrollClass(STUDENT_ID, CLASS_ID).catch(e => e);
    expect(error.statusCode).toBe(409);
    expect(error.message).toMatch(/sudah mengambil mata kuliah ini di kelas B/);
  });

  it('should throw when SKS limit exceeded', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      { class: { course: { sks: 12 } } },
      { class: { course: { sks: 10 } } },
    ]);
    // Reset semester mock to return maxSks of 24 for the SKS check
    prismaMock.academicSemester.findUnique.mockReset();
    prismaMock.academicSemester.findUnique
      .mockResolvedValueOnce(mockSemester()) // assertEnrollmentPeriodOpen
      .mockResolvedValueOnce({ maxSks: 24 }); // SKS limit

    const error = await enrollClass(STUDENT_ID, CLASS_ID).catch(e => e);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('SKS_LIMIT_EXCEEDED');
    expect(error.message).toMatch(/Total SKS melebihi batas semester/);
  });

  it('should set error code SKS_LIMIT_EXCEEDED on SKS error', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      { class: { course: { sks: 23 } } },
    ]);
    prismaMock.academicSemester.findUnique.mockReset();
    prismaMock.academicSemester.findUnique
      .mockResolvedValueOnce(mockSemester())
      .mockResolvedValueOnce({ maxSks: 24 });

    try {
      await enrollClass(STUDENT_ID, CLASS_ID);
      expect(true).toBe(false); // should not reach
    } catch (error) {
      expect(error.code).toBe('SKS_LIMIT_EXCEEDED');
      expect(error.details).toHaveProperty('currentSKS');
      expect(error.details).toHaveProperty('courseSKS');
      expect(error.details).toHaveProperty('maxSKS');
    }
  });
});

// ─── dropClass ───────────────────────────────────────────────

describe('dropClass', () => {
  it('should drop a PENDING enrollment successfully', async () => {
    prismaMock.krsEnrollment.findUnique.mockResolvedValue({
      id: ENROLLMENT_ID,
      status: 'PENDING',
      class: {
        academicSemesterId: SEMESTER_ID,
        course: { title: 'Pemrograman Web', code: 'IF-101' },
        section: 'A',
      },
    });
    prismaMock.academicSemester.findUnique.mockResolvedValue(mockSemester());
    prismaMock.krsEnrollment.delete.mockResolvedValue({});

    const result = await dropClass(STUDENT_ID, CLASS_ID);

    expect(result.message).toContain('Berhasil menghapus');
    expect(result.classId).toBe(CLASS_ID);
    expect(prismaMock.krsEnrollment.delete).toHaveBeenCalled();
  });

  it('should drop a REJECTED enrollment', async () => {
    prismaMock.krsEnrollment.findUnique.mockResolvedValue({
      id: ENROLLMENT_ID,
      status: 'REJECTED',
      class: {
        academicSemesterId: SEMESTER_ID,
        course: { title: 'Pemrograman Web', code: 'IF-101' },
        section: 'A',
      },
    });
    prismaMock.academicSemester.findUnique.mockResolvedValue(mockSemester());
    prismaMock.krsEnrollment.delete.mockResolvedValue({});

    const result = await dropClass(STUDENT_ID, CLASS_ID);
    expect(result.message).toContain('Berhasil menghapus');
  });

  it('should throw when not enrolled', async () => {
    prismaMock.krsEnrollment.findUnique.mockResolvedValue(null);

    const error = await dropClass(STUDENT_ID, CLASS_ID).catch(e => e);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Anda tidak terdaftar di kelas ini');
  });

  it('should throw when enrollment is APPROVED', async () => {
    prismaMock.krsEnrollment.findUnique.mockResolvedValue({
      id: ENROLLMENT_ID,
      status: 'APPROVED',
      class: {
        academicSemesterId: SEMESTER_ID,
        course: { title: 'PW', code: 'IF-101' },
        section: 'A',
      },
    });
    prismaMock.academicSemester.findUnique.mockResolvedValue(mockSemester());

    const error = await dropClass(STUDENT_ID, CLASS_ID).catch(e => e);
    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/Tidak dapat menghapus mata kuliah yang sudah disetujui/);
  });

  it('should throw when semester is not OPEN', async () => {
    prismaMock.krsEnrollment.findUnique.mockResolvedValue({
      id: ENROLLMENT_ID,
      status: 'PENDING',
      class: {
        academicSemesterId: SEMESTER_ID,
        course: { title: 'PW', code: 'IF-101' },
        section: 'A',
      },
    });
    prismaMock.academicSemester.findUnique.mockResolvedValue(
      mockSemester({ status: 'DRAFT', academicYear: '2025/2026', semesterType: 'GANJIL' })
    );

    await expect(dropClass(STUDENT_ID, CLASS_ID))
      .rejects.toThrow(/Masa pengisian KRS.*belum dibuka atau sudah ditutup/);
  });
});

// ─── getMyKRS ────────────────────────────────────────────────

describe('getMyKRS', () => {
  it('should return enrollments with summary', async () => {
    const enrollment = mockEnrollment();
    prismaMock.krsEnrollment.findMany.mockResolvedValue([enrollment]);
    prismaMock.academicSemester.findUnique.mockResolvedValue({ maxSks: 24 });

    const result = await getMyKRS(STUDENT_ID);

    expect(result.enrollments).toHaveLength(1);
    expect(result.enrollments[0].id).toBe(ENROLLMENT_ID);
    expect(result.summary.totalCourses).toBe(1);
    expect(result.summary.totalSKS).toBe(3);
    expect(result.summary.maxSKS).toBe(24);
  });

  it('should return empty list when no enrollments', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);

    const result = await getMyKRS(STUDENT_ID);

    expect(result.enrollments).toHaveLength(0);
    expect(result.summary.totalCourses).toBe(0);
    expect(result.summary.totalSKS).toBe(0);
  });

  it('should filter by academicSemesterId when provided', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);
    prismaMock.academicSemester.findUnique.mockResolvedValue({ maxSks: 24 });

    await getMyKRS(STUDENT_ID, { academicSemesterId: SEMESTER_ID });

    const callArgs = prismaMock.krsEnrollment.findMany.mock.calls[0][0];
    expect(callArgs.where.class).toEqual({ academicSemesterId: SEMESTER_ID });
  });

  it('should default maxSKS to 24 when no semester data', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);

    const result = await getMyKRS(STUDENT_ID);

    expect(result.summary.maxSKS).toBe(24);
  });
});

// ─── updateEnrollmentStatus ──────────────────────────────────

describe('updateEnrollmentStatus', () => {
  const pendingEnrollment = {
    id: ENROLLMENT_ID,
    status: 'PENDING',
    studentId: STUDENT_ID,
    classId: CLASS_ID,
    student: { advisorId: DOSEN_ID, name: 'Test Mahasiswa' },
    class: {
      courseId: COURSE_ID,
      section: 'A',
      academicSemesterId: SEMESTER_ID,
      course: { id: COURSE_ID, title: 'Pemrograman Web', code: 'IF-101' },
    },
  };

  const dospemUser = { id: DOSEN_ID, role: 'DOSEN', isDospem: true };
  const adminUser = { id: ADMIN_ID, role: 'ADMIN' };

  beforeEach(() => {
    prismaMock.krsEnrollment.findUnique.mockResolvedValue(pendingEnrollment);
    prismaMock.academicSemester.findUnique.mockResolvedValue(mockSemester());
    prismaMock.krsEnrollment.update.mockResolvedValue({
      id: ENROLLMENT_ID,
      status: 'APPROVED',
      note: null,
      updatedAt: new Date(),
      student: { id: STUDENT_ID, name: 'Test', email: 'mhs@test.com' },
      class: {
        section: 'A',
        courseId: COURSE_ID,
        course: { title: 'Pemrograman Web', code: 'IF-101' },
      },
    });
    prismaMock.class.findUnique.mockResolvedValue({
      capacity: 40,
      _count: { krsEnrollments: 5 },
    });
    prismaMock.enrollment.upsert.mockResolvedValue({});
    prismaMock.krsApprovalLog.create.mockResolvedValue({});
  });

  it('should approve enrollment by dospem', async () => {
    const result = await updateEnrollmentStatus(
      ENROLLMENT_ID, 'APPROVED', null, dospemUser
    );

    expect(result.status).toBe('APPROVED');
    expect(prismaMock.krsEnrollment.update).toHaveBeenCalled();
    expect(prismaMock.krsApprovalLog.create).toHaveBeenCalled();
  });

  it('should reject enrollment by dospem', async () => {
    prismaMock.krsEnrollment.update.mockResolvedValue({
      ...pendingEnrollment,
      status: 'REJECTED',
      note: 'Tidak sesuai',
    });

    const result = await updateEnrollmentStatus(
      ENROLLMENT_ID, 'REJECTED', 'Tidak sesuai', dospemUser
    );

    expect(result.status).toBe('REJECTED');
  });

  it('should approve enrollment by admin with note', async () => {
    const result = await updateEnrollmentStatus(
      ENROLLMENT_ID, 'APPROVED', 'Disetujui karena alasan tertentu oleh admin', adminUser
    );

    expect(result.status).toBe('APPROVED');
  });

  it('should throw when enrollment not found', async () => {
    prismaMock.krsEnrollment.findUnique.mockResolvedValue(null);

    const error = await updateEnrollmentStatus('bad-id', 'APPROVED', null, dospemUser).catch(e => e);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('KRS enrollment tidak ditemukan');
  });

  it('should throw on invalid state transition', async () => {
    prismaMock.krsEnrollment.findUnique.mockResolvedValue({
      ...pendingEnrollment,
      status: 'REJECTED',
    });

    const error = await updateEnrollmentStatus(ENROLLMENT_ID, 'APPROVED', null, dospemUser).catch(e => e);
    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/Tidak dapat mengubah status/);
  });

  it('should throw when dosen is not dospem', async () => {
    const error = await updateEnrollmentStatus(
      ENROLLMENT_ID, 'APPROVED', null,
      { id: DOSEN_ID, role: 'DOSEN', isDospem: false }
    ).catch(e => e);
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Anda tidak terdaftar sebagai Dosen Pembimbing');
  });

  it('should throw when dospem is not advisor of the student', async () => {
    const error = await updateEnrollmentStatus(
      ENROLLMENT_ID, 'APPROVED', null,
      { id: 'other-dosen-id', role: 'DOSEN', isDospem: true }
    ).catch(e => e);
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Anda bukan Dosen Pembimbing mahasiswa ini');
  });

  it('should throw when admin tries to revoke approval', async () => {
    prismaMock.krsEnrollment.findUnique.mockResolvedValue({
      ...pendingEnrollment,
      status: 'APPROVED',
    });

    const error = await updateEnrollmentStatus(ENROLLMENT_ID, 'REJECTED', 'Revoke by admin test', adminUser).catch(e => e);
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Hanya Dosen Pembimbing yang dapat mencabut persetujuan KRS');
  });

  it('should throw when admin provides short note', async () => {
    await expect(
      updateEnrollmentStatus(ENROLLMENT_ID, 'APPROVED', 'short', adminUser)
    ).rejects.toThrow('Admin wajib memberikan alasan minimal 10 karakter');
  });

  it('should handle revoke by dospem (APPROVED → REJECTED)', async () => {
    prismaMock.krsEnrollment.findUnique.mockResolvedValue({
      ...pendingEnrollment,
      status: 'APPROVED',
    });
    prismaMock.krsEnrollment.update.mockResolvedValue({
      ...pendingEnrollment,
      status: 'REJECTED',
      note: 'Matakuliah tidak sesuai dengan rencana studi',
    });
    prismaMock.enrollment.deleteMany.mockResolvedValue({ count: 1 });

    const result = await updateEnrollmentStatus(
      ENROLLMENT_ID, 'REJECTED',
      'Matakuliah tidak sesuai dengan rencana studi',
      dospemUser
    );

    expect(result.status).toBe('REJECTED');
    expect(prismaMock.enrollment.deleteMany).toHaveBeenCalled();
  });

  it('should throw on revoke by dospem without note', async () => {
    prismaMock.krsEnrollment.findUnique.mockResolvedValue({
      ...pendingEnrollment,
      status: 'APPROVED',
    });

    const error = await updateEnrollmentStatus(ENROLLMENT_ID, 'REJECTED', null, dospemUser).catch(e => e);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Wajib memberikan alasan untuk mencabut persetujuan KRS');
  });

  it('should throw when class capacity full on approval', async () => {
    prismaMock.class.findUnique.mockResolvedValue({
      capacity: 40,
      _count: { krsEnrollments: 40 },
    });

    const error = await updateEnrollmentStatus(ENROLLMENT_ID, 'APPROVED', null, dospemUser).catch(e => e);
    expect(error.statusCode).toBe(400);
    expect(error.message).toMatch(/Kapasitas kelas sudah penuh/);
  });
});

// ─── bulkUpdateEnrollmentStatus ──────────────────────────────

describe('bulkUpdateEnrollmentStatus', () => {
  const enrollments = [
    {
      id: 'e1',
      status: 'PENDING',
      studentId: STUDENT_ID,
      student: { advisorId: DOSEN_ID },
      class: {
        academicSemesterId: SEMESTER_ID,
        courseId: COURSE_ID,
        section: 'A',
        course: { title: 'PW', code: 'IF-101' },
      },
    },
    {
      id: 'e2',
      status: 'PENDING',
      studentId: STUDENT_ID_2,
      student: { advisorId: DOSEN_ID },
      class: {
        academicSemesterId: SEMESTER_ID,
        courseId: COURSE_ID_2,
        section: 'B',
        course: { title: 'Algo', code: 'IF-102' },
      },
    },
  ];

  const dospemUser = { id: DOSEN_ID, role: 'DOSEN', isDospem: true };
  const adminUser = { id: ADMIN_ID, role: 'ADMIN' };

  beforeEach(() => {
    prismaMock.krsEnrollment.findMany.mockResolvedValue(enrollments);
    prismaMock.academicSemester.findUnique.mockResolvedValue(mockSemester());
    prismaMock.krsEnrollment.updateMany.mockResolvedValue({ count: 2 });
    prismaMock.enrollment.upsert.mockResolvedValue({});
    prismaMock.krsApprovalLog.createMany.mockResolvedValue({ count: 2 });
  });

  it('should bulk approve enrollments by dospem', async () => {
    const result = await bulkUpdateEnrollmentStatus(
      ['e1', 'e2'], 'APPROVED', null, dospemUser
    );

    expect(result.updatedCount).toBe(2);
    expect(result.status).toBe('APPROVED');
    expect(prismaMock.krsEnrollment.updateMany).toHaveBeenCalled();
  });

  it('should bulk reject with note by admin', async () => {
    const result = await bulkUpdateEnrollmentStatus(
      ['e1', 'e2'], 'REJECTED', 'Alasan penolakan yang cukup panjang', adminUser
    );

    expect(result.updatedCount).toBe(2);
    expect(result.status).toBe('REJECTED');
  });

  it('should throw when array is empty', async () => {
    await expect(
      bulkUpdateEnrollmentStatus([], 'APPROVED', null, dospemUser)
    ).rejects.toThrow('Tidak ada enrollment yang dipilih');
  });

  it('should throw when too many enrollments (>50)', async () => {
    const bigArray = Array.from({ length: 51 }, (_, i) => `e-${i}`);

    await expect(
      bulkUpdateEnrollmentStatus(bigArray, 'APPROVED', null, dospemUser)
    ).rejects.toThrow('Maksimal 50 enrollment per batch');
  });

  it('should throw when some enrollments not found', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValue([enrollments[0]]);

    await expect(
      bulkUpdateEnrollmentStatus(['e1', 'e2'], 'APPROVED', null, dospemUser)
    ).rejects.toThrow('Beberapa enrollment tidak ditemukan');
  });

  it('should throw when dosen is not dospem', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValue([enrollments[0]]);

    await expect(
      bulkUpdateEnrollmentStatus(
        ['e1'], 'APPROVED', null,
        { id: DOSEN_ID, role: 'DOSEN', isDospem: false }
      )
    ).rejects.toThrow('Anda tidak terdaftar sebagai Dosen Pembimbing');
  });

  it('should throw when advisor for wrong students', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      { ...enrollments[0], student: { advisorId: 'other-dosen' } },
    ]);

    await expect(
      bulkUpdateEnrollmentStatus(['e1'], 'APPROVED', null, dospemUser)
    ).rejects.toThrow('Beberapa mahasiswa bukan bimbingan Anda');
  });

  it('should throw when admin short note', async () => {
    await expect(
      bulkUpdateEnrollmentStatus(['e1', 'e2'], 'APPROVED', 'short', adminUser)
    ).rejects.toThrow('Admin wajib memberikan alasan minimal 10 karakter');
  });

  it('should throw when invalid transition exists', async () => {
    // One enrollment is REJECTED, which cannot transition to APPROVED
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      { ...enrollments[0], status: 'REJECTED' },
    ]);

    await expect(
      bulkUpdateEnrollmentStatus(['e1'], 'APPROVED', null, dospemUser)
    ).rejects.toThrow(/enrollment tidak dapat diubah ke status/);
  });
});

// ─── getPendingKRS ───────────────────────────────────────────

describe('getPendingKRS', () => {
  it('should return pending enrollments for dosen (filtered by advisees)', async () => {
    const pending = [mockEnrollment()];
    prismaMock.krsEnrollment.findMany.mockResolvedValue(pending);

    const result = await getPendingKRS(
      {},
      { role: 'DOSEN', id: DOSEN_ID }
    );

    expect(result).toHaveLength(1);
    const callArgs = prismaMock.krsEnrollment.findMany.mock.calls[0][0];
    expect(callArgs.where.status).toBe('PENDING');
    expect(callArgs.where.student).toEqual({ advisorId: DOSEN_ID });
  });

  it('should return all pending enrollments for admin', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);

    await getPendingKRS({}, { role: 'ADMIN', id: ADMIN_ID });

    const callArgs = prismaMock.krsEnrollment.findMany.mock.calls[0][0];
    expect(callArgs.where.status).toBe('PENDING');
    expect(callArgs.where.student).toBeUndefined();
  });

  it('should apply academicSemesterId filter', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);

    await getPendingKRS(
      { academicSemesterId: SEMESTER_ID },
      { role: 'ADMIN', id: ADMIN_ID }
    );

    const callArgs = prismaMock.krsEnrollment.findMany.mock.calls[0][0];
    expect(callArgs.where.class).toEqual({ academicSemesterId: SEMESTER_ID });
  });
});

// ─── reviseRejectedEnrollment ────────────────────────────────

describe('reviseRejectedEnrollment', () => {
  const rejectedEnrollment = {
    id: ENROLLMENT_ID,
    status: 'REJECTED',
    revisionCount: 0,
    classId: CLASS_ID,
    class: {
      academicSemesterId: SEMESTER_ID,
      section: 'A',
      course: { title: 'Pemrograman Web', code: 'IF-101' },
    },
  };

  beforeEach(() => {
    prismaMock.krsEnrollment.findFirst.mockResolvedValue(rejectedEnrollment);
    prismaMock.academicSemester.findUnique.mockResolvedValue(mockSemester());
    prismaMock.krsEnrollment.update.mockResolvedValue({
      id: ENROLLMENT_ID,
      status: 'PENDING',
      revisionCount: 1,
      note: null,
      updatedAt: new Date(),
      class: {
        section: 'A',
        course: { title: 'Pemrograman Web', code: 'IF-101' },
      },
    });
    prismaMock.krsApprovalLog.create.mockResolvedValue({});
  });

  it('should revise rejected enrollment back to PENDING', async () => {
    const result = await reviseRejectedEnrollment(STUDENT_ID, ENROLLMENT_ID);

    expect(result.message).toContain('Berhasil mengajukan ulang');
    expect(result.enrollment.status).toBe('PENDING');
    expect(result.enrollment.revisionCount).toBe(1);
  });

  it('should throw when enrollment not found', async () => {
    prismaMock.krsEnrollment.findFirst.mockResolvedValue(null);

    await expect(reviseRejectedEnrollment(STUDENT_ID, 'bad-id'))
      .rejects.toThrow('KRS enrollment tidak ditemukan');
  });

  it('should throw when enrollment is not REJECTED', async () => {
    prismaMock.krsEnrollment.findFirst.mockResolvedValue({
      ...rejectedEnrollment,
      status: 'PENDING',
    });

    await expect(reviseRejectedEnrollment(STUDENT_ID, ENROLLMENT_ID))
      .rejects.toThrow('Hanya KRS yang ditolak yang dapat direvisi');
  });

  it('should throw when semester is not OPEN', async () => {
    prismaMock.academicSemester.findUnique.mockResolvedValue(
      mockSemester({ status: 'CLOSED', academicYear: '2025/2026', semesterType: 'GANJIL' })
    );

    await expect(reviseRejectedEnrollment(STUDENT_ID, ENROLLMENT_ID))
      .rejects.toThrow(/Masa pengisian KRS.*belum dibuka atau sudah ditutup/);
  });
});

// ─── getApprovalHistory ──────────────────────────────────────

describe('getApprovalHistory', () => {
  const enrollmentData = {
    id: ENROLLMENT_ID,
    studentId: STUDENT_ID,
    student: { advisorId: DOSEN_ID },
  };

  beforeEach(() => {
    prismaMock.krsEnrollment.findUnique.mockResolvedValue(enrollmentData);
    prismaMock.krsApprovalLog.findMany.mockResolvedValue([
      { id: 'log-1', fromStatus: 'PENDING', toStatus: 'APPROVED', actorType: 'DOSPEM' },
    ]);
  });

  it('should return approval history for student (own enrollment)', async () => {
    const logs = await getApprovalHistory(
      ENROLLMENT_ID,
      { id: STUDENT_ID, role: 'MAHASISWA' }
    );

    expect(logs).toHaveLength(1);
    expect(logs[0].fromStatus).toBe('PENDING');
  });

  it('should return history for dospem (advisor of student)', async () => {
    const logs = await getApprovalHistory(
      ENROLLMENT_ID,
      { id: DOSEN_ID, role: 'DOSEN' }
    );

    expect(logs).toHaveLength(1);
  });

  it('should return history for admin (any enrollment)', async () => {
    const logs = await getApprovalHistory(
      ENROLLMENT_ID,
      { id: ADMIN_ID, role: 'ADMIN' }
    );

    expect(logs).toHaveLength(1);
  });

  it('should throw when enrollment not found', async () => {
    prismaMock.krsEnrollment.findUnique.mockResolvedValue(null);

    await expect(
      getApprovalHistory('bad-id', { id: STUDENT_ID, role: 'MAHASISWA' })
    ).rejects.toThrow('KRS enrollment tidak ditemukan');
  });

  it('should throw when student tries to access another student enrollment', async () => {
    await expect(
      getApprovalHistory(ENROLLMENT_ID, { id: 'other-student', role: 'MAHASISWA' })
    ).rejects.toThrow('Anda tidak memiliki akses ke riwayat KRS ini');
  });

  it('should throw when dosen is not advisor of the student', async () => {
    await expect(
      getApprovalHistory(ENROLLMENT_ID, { id: 'other-dosen', role: 'DOSEN' })
    ).rejects.toThrow('Anda bukan Dosen Pembimbing mahasiswa ini');
  });
});

// ─── getAdvisoryStudents ─────────────────────────────────────

describe('getAdvisoryStudents', () => {
  it('should return students with enrollment stats', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: STUDENT_ID,
        name: 'Mahasiswa 1',
        email: 'mhs1@test.com',
        krsEnrollments: [
          { id: 'e1', status: 'PENDING', note: null, submittedAt: new Date(), class: {} },
          { id: 'e2', status: 'APPROVED', note: null, submittedAt: new Date(), class: {} },
        ],
      },
    ]);

    const result = await getAdvisoryStudents(DOSEN_ID);

    expect(result.students).toHaveLength(1);
    expect(result.students[0].stats.pending).toBe(1);
    expect(result.students[0].stats.approved).toBe(1);
    expect(result.summary.totalStudents).toBe(1);
    expect(result.summary.totalPending).toBe(1);
    expect(result.summary.totalApproved).toBe(1);
  });

  it('should apply academicSemesterId filter', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);

    await getAdvisoryStudents(DOSEN_ID, { academicSemesterId: SEMESTER_ID });

    const callArgs = prismaMock.user.findMany.mock.calls[0][0];
    expect(callArgs.select.krsEnrollments.where).toEqual({
      class: { academicSemesterId: SEMESTER_ID },
    });
  });

  it('should return empty when no advisees', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);

    const result = await getAdvisoryStudents(DOSEN_ID);

    expect(result.students).toHaveLength(0);
    expect(result.summary.totalStudents).toBe(0);
  });
});

// ─── getKrsMonitoring ────────────────────────────────────────

describe('getKrsMonitoring', () => {
  it('should return all enrollments with summary', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValue([
      { id: 'e1', status: 'PENDING' },
      { id: 'e2', status: 'APPROVED' },
      { id: 'e3', status: 'REJECTED' },
    ]);

    const result = await getKrsMonitoring();

    expect(result.enrollments).toHaveLength(3);
    expect(result.summary.total).toBe(3);
    expect(result.summary.pending).toBe(1);
    expect(result.summary.approved).toBe(1);
    expect(result.summary.rejected).toBe(1);
  });

  it('should apply academicSemesterId filter', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);

    await getKrsMonitoring({ academicSemesterId: SEMESTER_ID });

    const callArgs = prismaMock.krsEnrollment.findMany.mock.calls[0][0];
    expect(callArgs.where.class).toEqual({ academicSemesterId: SEMESTER_ID });
  });

  it('should return empty summary when no enrollments', async () => {
    prismaMock.krsEnrollment.findMany.mockResolvedValue([]);

    const result = await getKrsMonitoring();

    expect(result.summary.total).toBe(0);
    expect(result.summary.pending).toBe(0);
  });
});
