/**
 * Academic Semester Fixtures
 */

export const validSemester = (overrides = {}) => ({
  academicYear: '2025/2026',
  semesterType: 'GANJIL',
  status: 'DRAFT',
  maxSks: 24,
  startDate: '2025-09-01T00:00:00.000Z',
  endDate: '2026-01-31T00:00:00.000Z',
  ...overrides,
});

export const validSemesterGenap = (overrides = {}) => ({
  academicYear: '2025/2026',
  semesterType: 'GENAP',
  status: 'DRAFT',
  maxSks: 24,
  startDate: '2026-02-01T00:00:00.000Z',
  endDate: '2026-07-31T00:00:00.000Z',
  ...overrides,
});
