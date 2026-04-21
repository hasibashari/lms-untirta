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

import './load-env.js'; // MUST BE FIRST - loads .env.test and protects main DB
import { beforeAll, afterAll, expect } from '@jest/globals';
import prisma from './helpers/prisma.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

let grpcServer;

// Mulai server gRPC sebelum test agar Express API Gateway bisa terhubung
beforeAll(async () => {
  const testPath = expect.getState().testPath || '';
  const shouldStartGrpcServer = testPath.endsWith('.api.test.js');

  if (!shouldStartGrpcServer) {
    return;
  }

  const { startGrpcServer } = await import('../src/grpc/server.js');
  grpcServer = startGrpcServer();
  // Berikan sedikit jeda waktu agar server berhasil bind ke port 50051
  await new Promise((resolve) => setTimeout(resolve, 200));
});

// Disconnect Prisma after each test file to prevent connection leaks
afterAll(async () => {
  if (grpcServer) {
    await new Promise((resolve) => grpcServer.tryShutdown(resolve));
  }
  await prisma.$disconnect();
});
