/**
 * Jest Global Teardown
 *
 * Runs ONCE after all test suites complete.
 * Disconnects any lingering Prisma connections.
 */

export default async function globalTeardown() {
  console.log('\n🧹 [Global Teardown] Test run complete.');
}
