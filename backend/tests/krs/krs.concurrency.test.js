/**
 * KRS Enrollment — Concurrency Tests
 *
 * Tests race-condition safety of the enrollment system.
 * Uses REAL database with Serializable isolation transactions —
 * no mocking of $transaction.
 *
 * What we test:
 *   ✓ Capacity=1 with N concurrent enrollments → exactly 1 wins
 *   ✓ SKS limit with concurrent enrollments → does not exceed max
 *   ✓ Duplicate enrollment prevention under concurrency
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import prisma from '../helpers/prisma.js';
import { cleanDatabase } from '../helpers/db.js';

// Import the REAL service (not mocked) — it uses the real Prisma client
// We need to ensure the service module's Prisma instance points to the test DB.
// Since setup.js loads .env.test, the app's prisma.js will use DATABASE_URL from .env.test.
const { enrollClass } = await import('../../src/modules/krs/krs.service.js');

// ═════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════

async function createDosen() {
  return prisma.user.create({
    data: {
      email: `dosen-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
      name: 'Dosen Concurrency',
      password: 'hashed',
      role: 'DOSEN',
      isDospem: true,
    },
  });
}

async function createStudent(advisorId) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return prisma.user.create({
    data: {
      email: `mhs-${id}@test.com`,
      name: `Mahasiswa ${id}`,
      password: 'hashed',
      role: 'MAHASISWA',
      advisorId,
    },
  });
}

async function createScenario(dosenId, { capacity = 1, sks = 3, maxSks = 24 } = {}) {
  const semester = await prisma.academicSemester.create({
    data: {
      academicYear: '2025/2026',
      semesterType: 'GANJIL',
      status: 'OPEN',
      isActive: true,
      maxSks,
    },
  });

  const course = await prisma.course.create({
    data: {
      title: 'Concurrency Test Course',
      code: `CC-${Date.now().toString().slice(-4)}`,
      sks,
      teacherId: dosenId,
      semester: 3,
    },
  });

  const classOffering = await prisma.class.create({
    data: {
      courseId: course.id,
      lecturerId: dosenId,
      academicSemesterId: semester.id,
      section: 'A',
      schedule: 'Senin 08:00-10:00',
      room: 'A1.01',
      capacity,
      isEnrollmentOpen: true,
    },
  });

  return { semester, course, classOffering };
}

// ═════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════

describe('KRS Enrollment — Concurrency Safety', () => {
  let dosen;

  beforeEach(async () => {
    await cleanDatabase();
    dosen = await createDosen();
  });

  // ─── Capacity Race Condition ───────────────────────────────

  it('capacity=1: exactly 1 of N concurrent enrollments succeeds', async () => {
    const { classOffering } = await createScenario(dosen.id, { capacity: 1 });

    // Create N students
    const N = 5;
    const students = await Promise.all(
      Array.from({ length: N }, () => createStudent(dosen.id))
    );

    // Fire all enrollments concurrently
    const results = await Promise.allSettled(
      students.map(s => enrollClass(s.id, classOffering.id))
    );

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    // Exactly 1 should succeed
    expect(fulfilled).toHaveLength(1);
    // The rest should fail (CLASS_FULL or serialization error)
    expect(rejected).toHaveLength(N - 1);

    // Verify DB state: exactly 1 enrollment
    const enrollments = await prisma.krsEnrollment.findMany({
      where: { classId: classOffering.id },
    });
    expect(enrollments).toHaveLength(1);
  });

  it('capacity=3: at most 3 of 6 concurrent enrollments succeed', async () => {
    const { classOffering } = await createScenario(dosen.id, { capacity: 3 });

    const students = await Promise.all(
      Array.from({ length: 6 }, () => createStudent(dosen.id))
    );

    const results = await Promise.allSettled(
      students.map(s => enrollClass(s.id, classOffering.id))
    );

    const fulfilled = results.filter(r => r.status === 'fulfilled');

    // At most 3 should succeed (with Serializable, might be fewer due to retries)
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    expect(fulfilled.length).toBeLessThanOrEqual(3);

    // Verify DB state: enrolled count <= capacity
    const enrollments = await prisma.krsEnrollment.findMany({
      where: { classId: classOffering.id },
    });
    expect(enrollments.length).toBeLessThanOrEqual(3);
  });

  // ─── SKS Limit Race Condition ──────────────────────────────

  it('SKS limit: concurrent enrollments do not exceed maxSks', async () => {
    const maxSks = 6;
    const sks = 3;

    // Create 2 courses with 3 SKS each — total 6 is the limit
    const semester = await prisma.academicSemester.create({
      data: {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
        status: 'OPEN',
        isActive: true,
        maxSks,
      },
    });

    const courses = await Promise.all(
      Array.from({ length: 3 }, (_, i) =>
        prisma.course.create({
          data: {
            title: `SKS Test ${i}`,
            code: `SKS-${Date.now()}-${i}`,
            sks,
            teacherId: dosen.id,
            semester: 3,
          },
        })
      )
    );

    const classes = await Promise.all(
      courses.map((c, i) =>
        prisma.class.create({
          data: {
            courseId: c.id,
            lecturerId: dosen.id,
            academicSemesterId: semester.id,
            section: String.fromCharCode(65 + i),
            schedule: 'Senin 08:00-10:00',
            room: 'A1.01',
            capacity: 40,
            isEnrollmentOpen: true,
          },
        })
      )
    );

    // 1 student tries to enroll in all 3 classes (9 SKS > 6 limit)
    const student = await createStudent(dosen.id);

    const results = await Promise.allSettled(
      classes.map(cls => enrollClass(student.id, cls.id))
    );

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    // Should not enroll in more than 2 classes (2 * 3 SKS = 6 = maxSks)
    expect(fulfilled.length).toBeLessThanOrEqual(2);
    expect(rejected.length).toBeGreaterThanOrEqual(1);

    // Verify DB: total SKS enrolled <= maxSks
    const enrollments = await prisma.krsEnrollment.findMany({
      where: { studentId: student.id },
      include: { class: { include: { course: true } } },
    });

    const totalSks = enrollments.reduce((sum, e) => sum + (e.class.course.sks || 0), 0);
    expect(totalSks).toBeLessThanOrEqual(maxSks);
  });

  // ─── Duplicate Enrollment Race Condition ───────────────────

  it('same student cannot double-enroll in same class concurrently', async () => {
    const { classOffering } = await createScenario(dosen.id, { capacity: 40 });
    const student = await createStudent(dosen.id);

    // Fire 5 identical enrollment requests concurrently
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => enrollClass(student.id, classOffering.id))
    );

    const fulfilled = results.filter(r => r.status === 'fulfilled');

    // Exactly 1 should succeed; duplicates rejected
    expect(fulfilled).toHaveLength(1);

    // Verify DB: exactly 1 enrollment for this student + class
    const enrollments = await prisma.krsEnrollment.findMany({
      where: {
        studentId: student.id,
        classId: classOffering.id,
      },
    });
    expect(enrollments).toHaveLength(1);
  });
});
