/**
 * Prisma Mock
 *
 * Creates a deeply-mocked PrismaClient for unit tests.
 * Every model method (findUnique, findMany, create, update, etc.) is a jest.fn().
 *
 * Usage in unit tests:
 *   jest.unstable_mockModule('../../src/config/prisma.js', () => ({
 *     default: createPrismaMock(),
 *   }));
 *
 * Then access mocks:
 *   const prisma = (await import('../../src/config/prisma.js')).default;
 *   prisma.user.findUnique.mockResolvedValue({ id: '1', ... });
 *
 * Architecture Decision:
 *   We mock at the module level (prisma.js) rather than mocking individual
 *   Prisma methods. This gives us full control over what the DB "returns"
 *   without any real database calls. Perfect for testing service logic in isolation.
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock for a single Prisma model with all common methods
 */
function createModelMock() {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  };
}

/**
 * Creates a fully mocked PrismaClient.
 * Includes all model namespaces from the schema.
 */
export function createPrismaMock() {
  return {
    user: createModelMock(),
    course: createModelMock(),
    enrollment: createModelMock(),
    material: createModelMock(),
    assignment: createModelMock(),
    submission: createModelMock(),
    class: createModelMock(),
    krsEnrollment: createModelMock(),
    academicSemester: createModelMock(),
    finalGrade: createModelMock(),
    krsApprovalLog: createModelMock(),

    // Prisma utility methods
    $transaction: jest.fn((fns) => {
      // If array of promises, resolve all. If callback, invoke it.
      if (Array.isArray(fns)) return Promise.all(fns);
      if (typeof fns === 'function') return fns(this);
      return Promise.resolve();
    }),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  };
}
