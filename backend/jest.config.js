/** @type {import('jest').Config} */
export default {
  // ─── Runtime ───────────────────────────────────────────────
  testEnvironment: "node",

  // ─── ESM Support ───────────────────────────────────────────
  // Jest 30 + Node >=22 supports ESM via --experimental-vm-modules.
  // We use `@jest/globals` imports instead of global `describe/it/expect`.
  transform: {},

  // ─── Test Discovery ────────────────────────────────────────
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.js"],

  // ─── Setup & Teardown ─────────────────────────────────────
  globalSetup: "<rootDir>/tests/global-setup.js",
  globalTeardown: "<rootDir>/tests/global-teardown.js",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // ─── Behavior ──────────────────────────────────────────────
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 15000,

  // ─── Coverage ──────────────────────────────────────────────
  collectCoverageFrom: [
    "src/modules/**/*.js",
    "src/utils/**/*.js",
    "!**/node_modules/**",
    "!**/*.validation.js",
    "!**/*.routes.js",
  ],

  // ─── Performance ───────────────────────────────────────────
  // Run test files sequentially to avoid DB conflicts in integration tests.
  // Unit tests are fast enough that parallelism yields minimal benefit.
  maxWorkers: 1,
};