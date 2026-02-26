/**
 * Jest Setup — runs before EACH test file.
 *
 * Responsibilities:
 *   1. Load test environment (.env.test)
 *   2. Ensure PrismaClient uses test DATABASE_URL
 *   3. Provide global afterAll to disconnect Prisma
 *
 * Architecture Decision:
 *   - Unit tests (.service.test.js) mock Prisma entirely — no DB calls.
 *   - Integration tests (.api.test.js) use a real test database with
 *     table truncation between suites for isolation.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { afterAll } from '@jest/globals';
import prisma from './helpers/prisma.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.test') });

// Disconnect Prisma after each test file to prevent connection leaks
afterAll(async () => {
  await prisma.$disconnect();
});
