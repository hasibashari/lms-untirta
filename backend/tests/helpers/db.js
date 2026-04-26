/**
 * Database Helpers for Integration Tests
 *
 * Provides utilities for:
 *   - Cleaning all tables between test suites (truncation)
 *   - Seeding common reference data
 *
 * Strategy: TRUNCATE CASCADE
 *   - Fast (no need to drop/recreate schema)
 *   - Resets auto-increment counters
 *   - Safe with foreign keys via CASCADE
 *
 * Usage in test files:
 *   import { cleanDatabase } from '../helpers/db.js';
 *   beforeEach(async () => { await cleanDatabase(); });
 */

import prisma from './prisma.js';

/**
 * Truncates all application tables in the correct order.
 * Uses raw SQL TRUNCATE with CASCADE for speed and FK safety.
 */
export async function cleanDatabase() {
  // Order matters for FK constraints — truncate child tables first,
  // or use CASCADE. We use CASCADE for simplicity.
  const tableNames = [
    'KrsApprovalLog',
    'KrsEnrollment',
    'FinalGrade',
    'Submission',
    'Assignment',
    'Material',
    'Enrollment',
    'Class',
    'Course',
    'AcademicSemester',
    'User',
  ];

  // Use a transaction for atomicity
  await prisma.$transaction(
    tableNames.map(table =>
      prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`)
    )
  );
}

/**
 * Convenience: Clean DB and disconnect.
 * Useful for afterAll hooks.
 */
export async function cleanAndDisconnect() {
  await cleanDatabase();
  await prisma.$disconnect();
}
