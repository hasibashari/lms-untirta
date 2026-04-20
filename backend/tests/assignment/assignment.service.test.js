/**
 * Assignment Service — Unit Tests
 *
 * Tests the business logic in assignment.service.js in isolation.
 * Prisma is fully mocked — no database calls are made.
 *
 * What we test:
 *   ✓ createAssignment   — validation, ownership check
 *   ✓ getAssignmentDetail — found / not found
 *   ✓ updateAssignment   — DOSEN ownership, MAHASISWA restriction, ADMIN override, dueDate coercion
 *   ✓ deleteAssignment   — DOSEN ownership, MAHASISWA restriction, ADMIN override, count report
 *   ✓ getAssignmentsByCourse — enrollment check, status derivation (submitted/overdue/pending)
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
  createAssignment,
  getAssignmentDetail,
  updateAssignment,
  deleteAssignment,
  getAssignmentsByCourse,
} = await import('../../src/modules/assignment/assignment.service.js');

// ─── Shared Data ─────────────────────────────────────────────

const TEACHER_ID = 'teacher-uuid-1';
const STUDENT_ID = 'student-uuid-1';
const COURSE_ID = 'course-uuid-1';
const ASSIGNMENT_ID = 'assignment-uuid-1';

const futureDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
const pastDueDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

const baseCourse = {
  id: COURSE_ID,
  teacherId: TEACHER_ID,
  title: 'Algoritma',
  code: 'IF101',
};

// ─── Reset mocks before each test ─────────────────────────

beforeEach(() => {
  jest.resetAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// createAssignment
// ═══════════════════════════════════════════════════════════════

describe('createAssignment', () => {
  const data = { title: 'Tugas 1', description: 'Desc', dueDate: futureDueDate.toISOString() };

  it('should create assignment when teacher owns the course', async () => {
    prismaMock.course.findUnique.mockResolvedValue(baseCourse);
    const created = { id: ASSIGNMENT_ID, title: data.title, dueDate: futureDueDate, courseId: COURSE_ID };
    prismaMock.assignment.create.mockResolvedValue(created);

    const result = await createAssignment(COURSE_ID, TEACHER_ID, data);

    expect(result).toEqual(created);
    expect(prismaMock.course.findUnique).toHaveBeenCalledWith({ where: { id: COURSE_ID } });
    expect(prismaMock.assignment.create).toHaveBeenCalledTimes(1);
  });

  it('should throw when course not found', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);

    await expect(createAssignment(COURSE_ID, TEACHER_ID, data))
      .rejects.toThrow('Kelas tidak ditemukan');
  });

  it('should throw when teacher does not own the course', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ ...baseCourse, teacherId: 'other-teacher' });

    await expect(createAssignment(COURSE_ID, TEACHER_ID, data))
      .rejects.toThrow('Akses ditolak');
  });
});

// ═══════════════════════════════════════════════════════════════
// getAssignmentDetail
// ═══════════════════════════════════════════════════════════════

describe('getAssignmentDetail', () => {
  it('should return assignment details when found', async () => {
    const detail = { id: ASSIGNMENT_ID, title: 'Tugas 1', description: 'Desc', dueDate: futureDueDate };
    prismaMock.assignment.findUnique.mockResolvedValue(detail);

    const result = await getAssignmentDetail(ASSIGNMENT_ID);

    expect(result).toEqual(detail);
  });

  it('should return null when not found', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(null);

    const result = await getAssignmentDetail(ASSIGNMENT_ID);

    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// updateAssignment
// ═══════════════════════════════════════════════════════════════

describe('updateAssignment', () => {
  const updateData = { title: 'Updated Title', description: 'Updated Desc' };

  it('should throw when assignment not found', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(null);

    await expect(updateAssignment(ASSIGNMENT_ID, TEACHER_ID, 'DOSEN', updateData))
      .rejects.toThrow('Tugas tidak ditemukan');
  });

  it('should throw when DOSEN does not own the course', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: 'other-teacher' },
    });

    await expect(updateAssignment(ASSIGNMENT_ID, TEACHER_ID, 'DOSEN', updateData))
      .rejects.toThrow('Akses ditolak: Ini bukan tugas dari kelas Anda');
  });

  it('should throw when MAHASISWA tries to update', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: TEACHER_ID },
    });

    await expect(updateAssignment(ASSIGNMENT_ID, STUDENT_ID, 'MAHASISWA', updateData))
      .rejects.toThrow('Akses ditolak: Mahasiswa tidak dapat mengedit tugas');
  });

  it('should allow DOSEN who owns the course to update', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: TEACHER_ID },
    });
    const updated = { id: ASSIGNMENT_ID, ...updateData, dueDate: futureDueDate, courseId: COURSE_ID, updatedAt: new Date() };
    prismaMock.assignment.update.mockResolvedValue(updated);

    const result = await updateAssignment(ASSIGNMENT_ID, TEACHER_ID, 'DOSEN', updateData);

    expect(result).toEqual(updated);
  });

  it('should allow ADMIN to update any assignment', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: 'some-other-teacher' },
    });
    const updated = { id: ASSIGNMENT_ID, ...updateData, dueDate: futureDueDate, courseId: COURSE_ID, updatedAt: new Date() };
    prismaMock.assignment.update.mockResolvedValue(updated);

    const result = await updateAssignment(ASSIGNMENT_ID, 'admin-1', 'ADMIN', updateData);

    expect(result).toEqual(updated);
  });

  it('should convert dueDate when provided', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: TEACHER_ID },
    });
    prismaMock.assignment.update.mockResolvedValue({ id: ASSIGNMENT_ID });

    const dateStr = '2025-12-31T23:59:59Z';
    await updateAssignment(ASSIGNMENT_ID, TEACHER_ID, 'DOSEN', { dueDate: dateStr });

    const callData = prismaMock.assignment.update.mock.calls[0][0].data;
    expect(callData.dueDate).toEqual(new Date(dateStr));
  });
});

// ═══════════════════════════════════════════════════════════════
// deleteAssignment
// ═══════════════════════════════════════════════════════════════

describe('deleteAssignment', () => {
  it('should throw when assignment not found', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue(null);

    await expect(deleteAssignment(ASSIGNMENT_ID, TEACHER_ID, 'DOSEN'))
      .rejects.toThrow('Tugas tidak ditemukan');
  });

  it('should throw when DOSEN does not own the course', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: 'other-teacher' },
      _count: { submissions: 0 },
    });

    await expect(deleteAssignment(ASSIGNMENT_ID, TEACHER_ID, 'DOSEN'))
      .rejects.toThrow('Akses ditolak: Ini bukan tugas dari kelas Anda');
  });

  it('should throw when MAHASISWA tries to delete', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: TEACHER_ID },
      _count: { submissions: 0 },
    });

    await expect(deleteAssignment(ASSIGNMENT_ID, STUDENT_ID, 'MAHASISWA'))
      .rejects.toThrow('Akses ditolak: Mahasiswa tidak dapat menghapus tugas');
  });

  it('should delete assignment and return result for DOSEN owner', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: TEACHER_ID },
      _count: { submissions: 3 },
    });
    prismaMock.assignment.delete.mockResolvedValue({});

    const result = await deleteAssignment(ASSIGNMENT_ID, TEACHER_ID, 'DOSEN');

    expect(result.message).toBe('Tugas berhasil dihapus');
    expect(result.deletedSubmissions).toBe(3);
    expect(prismaMock.assignment.delete).toHaveBeenCalledWith({ where: { id: ASSIGNMENT_ID } });
  });

  it('should allow ADMIN to delete any assignment', async () => {
    prismaMock.assignment.findUnique.mockResolvedValue({
      id: ASSIGNMENT_ID,
      course: { id: COURSE_ID, teacherId: 'other-teacher' },
      _count: { submissions: 1 },
    });
    prismaMock.assignment.delete.mockResolvedValue({});

    const result = await deleteAssignment(ASSIGNMENT_ID, 'admin-1', 'ADMIN');

    expect(result.message).toBe('Tugas berhasil dihapus');
    expect(result.deletedSubmissions).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════
// getAssignmentsByCourse
// ═══════════════════════════════════════════════════════════════

describe('getAssignmentsByCourse', () => {
  it('should throw when course not found', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);

    await expect(getAssignmentsByCourse(COURSE_ID, STUDENT_ID, 'MAHASISWA'))
      .rejects.toThrow('Kelas tidak ditemukan');
  });

  it('should throw when mahasiswa is not enrolled', async () => {
    prismaMock.course.findUnique.mockResolvedValue(baseCourse);
    prismaMock.enrollment.findUnique.mockResolvedValue(null);

    await expect(getAssignmentsByCourse(COURSE_ID, STUDENT_ID, 'MAHASISWA'))
      .rejects.toThrow('Anda belum terdaftar di kelas ini');
  });

  it('should skip enrollment check for DOSEN', async () => {
    prismaMock.course.findUnique.mockResolvedValue(baseCourse);
    prismaMock.assignment.findMany.mockResolvedValue([]);

    const result = await getAssignmentsByCourse(COURSE_ID, TEACHER_ID, 'DOSEN');

    expect(prismaMock.enrollment.findUnique).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('should return submitted status when student has a submission', async () => {
    prismaMock.course.findUnique.mockResolvedValue(baseCourse);
    prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'enr-1' });
    prismaMock.assignment.findMany.mockResolvedValue([
      { id: ASSIGNMENT_ID, title: 'T1', dueDate: futureDueDate, submissions: [{ id: 'sub-1' }] },
    ]);

    const result = await getAssignmentsByCourse(COURSE_ID, STUDENT_ID, 'MAHASISWA');

    expect(result[0].status).toBe('submitted');
  });

  it('should return overdue status when past deadline with no submission', async () => {
    prismaMock.course.findUnique.mockResolvedValue(baseCourse);
    prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'enr-1' });
    prismaMock.assignment.findMany.mockResolvedValue([
      { id: ASSIGNMENT_ID, title: 'T1', dueDate: pastDueDate, submissions: [] },
    ]);

    const result = await getAssignmentsByCourse(COURSE_ID, STUDENT_ID, 'MAHASISWA');

    expect(result[0].status).toBe('overdue');
  });

  it('should return pending status when before deadline with no submission', async () => {
    prismaMock.course.findUnique.mockResolvedValue(baseCourse);
    prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'enr-1' });
    prismaMock.assignment.findMany.mockResolvedValue([
      { id: ASSIGNMENT_ID, title: 'T1', dueDate: futureDueDate, submissions: [] },
    ]);

    const result = await getAssignmentsByCourse(COURSE_ID, STUDENT_ID, 'MAHASISWA');

    expect(result[0].status).toBe('pending');
  });
});
