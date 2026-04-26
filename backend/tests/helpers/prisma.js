/**
 * Test Prisma Client
 *
 * A dedicated PrismaClient instance for tests.
 * Uses DATABASE_URL from .env.test (loaded by setup.js / global-setup.js).
 *
 * Why a separate instance?
 *   - Prevents accidental coupling with the app's singleton.
 *   - Makes it easy to control connection lifecycle in tests.
 *   - Integration tests import this directly for seeding/cleanup.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Silence query logs in tests unless debugging
  log: process.env.DEBUG_PRISMA ? ['query', 'error'] : ['error'],
});

export default prisma;
