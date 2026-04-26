/**
 * Course Fixtures
 *
 * Static data factories for Course-related tests.
 */

export const validCourse = (teacherId, overrides = {}) => ({
  title: 'Pemrograman Web',
  description: 'Mata kuliah pemrograman web dasar',
  code: `IF-${Date.now().toString().slice(-4)}`,
  semester: 3,
  sks: 3,
  teacherId,
  ...overrides,
});

export const validCourseMinimal = (teacherId, overrides = {}) => ({
  title: 'Algoritma',
  code: `IF-${Date.now().toString().slice(-3)}A`,
  teacherId,
  ...overrides,
});

export const invalidCourseNoTitle = (teacherId) => ({
  code: 'IF-999',
  teacherId,
});

export const invalidCourseDuplicateCode = (teacherId) => ({
  title: 'Duplicate Course',
  code: 'IF-101', // will collide if IF-101 already exists
  teacherId,
});
