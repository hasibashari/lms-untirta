/**
 * KRS Fixtures
 *
 * Data factories for KRS-related tests.
 * Provides helpers for creating academic semesters, classes, and enrollments
 * in both unit-test (mock) and integration-test (real DB) contexts.
 */

// ─── Unit-test data (plain objects) ────────────────────────────

export const STUDENT_ID = 'student-uuid-1';
export const STUDENT_ID_2 = 'student-uuid-2';
export const DOSEN_ID = 'dosen-uuid-1';
export const DOSEN_ID_2 = 'dosen-uuid-2';
export const ADMIN_ID = 'admin-uuid-1';
export const SEMESTER_ID = 'semester-uuid-1';
export const CLASS_ID = 'class-uuid-1';
export const CLASS_ID_2 = 'class-uuid-2';
export const COURSE_ID = 'course-uuid-1';
export const COURSE_ID_2 = 'course-uuid-2';
export const ENROLLMENT_ID = 'enrollment-uuid-1';

export const mockSemester = (overrides = {}) => ({
  id: SEMESTER_ID,
  academicYear: '2025/2026',
  semesterType: 'GANJIL',
  status: 'OPEN',
  isActive: true,
  maxSks: 24,
  ...overrides,
});

export const mockClass = (overrides = {}) => ({
  id: CLASS_ID,
  courseId: COURSE_ID,
  lecturerId: DOSEN_ID,
  academicSemesterId: SEMESTER_ID,
  section: 'A',
  schedule: 'Senin 08:00-10:00',
  room: 'A1.01',
  capacity: 40,
  isEnrollmentOpen: true,
  course: {
    id: COURSE_ID,
    title: 'Pemrograman Web',
    code: 'IF-101',
    sks: 3,
    description: 'Pengantar pemrograman web',
    semester: 3,
  },
  lecturer: { id: DOSEN_ID, name: 'Dr. Dosen' },
  academicSemester: {
    id: SEMESTER_ID,
    academicYear: '2025/2026',
    semesterType: 'GANJIL',
  },
  _count: { krsEnrollments: 5 },
  ...overrides,
});

export const mockEnrollment = (overrides = {}) => ({
  id: ENROLLMENT_ID,
  studentId: STUDENT_ID,
  classId: CLASS_ID,
  status: 'PENDING',
  note: null,
  revisionCount: 0,
  submittedAt: new Date('2025-01-15'),
  approvedAt: null,
  approvedBy: null,
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-01-15'),
  student: {
    id: STUDENT_ID,
    name: 'Test Mahasiswa',
    email: 'mhs@test.com',
    advisorId: DOSEN_ID,
  },
  class: {
    id: CLASS_ID,
    section: 'A',
    courseId: COURSE_ID,
    academicSemesterId: SEMESTER_ID,
    schedule: 'Senin 08:00-10:00',
    room: 'A1.01',
    course: { id: COURSE_ID, title: 'Pemrograman Web', code: 'IF-101', sks: 3 },
    lecturer: { id: DOSEN_ID, name: 'Dr. Dosen' },
    academicSemester: { academicYear: '2025/2026', semesterType: 'GANJIL' },
  },
  ...overrides,
});

// ─── Integration-test helpers (real DB via Prisma) ─────────────

/**
 * Creates a full KRS test scenario in the real DB:
 * semester + course + class + advisor assignment.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {object} opts
 * @param {string} opts.dosenId - Lecturer / advisor user ID
 * @param {string} [opts.semesterStatus] - 'OPEN' | 'DRAFT' | 'CLOSED'
 * @param {number} [opts.capacity]
 * @param {boolean} [opts.isEnrollmentOpen]
 * @param {number} [opts.sks]
 * @param {number} [opts.maxSks]
 * @returns {Promise<{ semester, course, classOffering }>}
 */
export async function createKrsScenario(prisma, opts) {
  const {
    dosenId,
    semesterStatus = 'OPEN',
    capacity = 40,
    isEnrollmentOpen = true,
    sks = 3,
    maxSks = 24,
    courseCode,
    section = 'A',
  } = opts;

  const semester = await prisma.academicSemester.create({
    data: {
      academicYear: `2025/2026`,
      semesterType: 'GANJIL',
      status: semesterStatus,
      isActive: semesterStatus === 'OPEN',
      maxSks,
    },
  });

  const code = courseCode || `IF-${Date.now().toString().slice(-4)}`;
  const course = await prisma.course.create({
    data: {
      title: 'Pemrograman Web',
      code,
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
      section,
      schedule: 'Senin 08:00-10:00',
      room: 'A1.01',
      capacity,
      isEnrollmentOpen,
    },
  });

  return { semester, course, classOffering };
}
