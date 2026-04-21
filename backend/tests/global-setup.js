/**
 * Jest Global Setup
 *
 * Runs ONCE before all test suites.
 * Responsibilities:
 *   1. Load test environment variables (.env.test)
 *   2. Create the test database if it doesn't exist
 *   3. Run Prisma migrations against the test database
 *
 * This ensures every `npm test` run starts from a clean, migrated schema
 * without touching the development database.
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

export default async function globalSetup() {
  // 1. Load .env.test
  config({ path: resolve(rootDir, '.env.test') });
  
  // Safety Check: Jangan biarkan migrasi berjalan di database utama!
  if (!process.env.DATABASE_URL?.includes('lms_db_test')) {
    throw new Error('CRITICAL: Global setup detected a non-test database! Migrations aborted for safety.');
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined in .env.test');
  }

  console.log('\n🔧 [Global Setup] Using test database:', databaseUrl.replace(/\/\/.*@/, '//<credentials>@'));

  // 2. Create test database if it doesn't exist
  try {
    const dbName = new URL(databaseUrl).pathname.slice(1); // e.g. "lms_db_test"
    const baseUrl = databaseUrl.replace(`/${dbName}`, '/postgres');

    // Use pg to create DB — fail silently if it already exists
    const { default: pg } = await import('pg');
    const client = new pg.Client({ connectionString: baseUrl });
    await client.connect();

    try {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ [Global Setup] Created test database: ${dbName}`);
    } catch (err) {
      if (err.code === '42P04') {
        // Database already exists — that's fine
        console.log(`ℹ️  [Global Setup] Test database already exists: ${dbName}`);
      } else {
        throw err;
      }
    } finally {
      await client.end();
    }
  } catch (err) {
    console.error('⚠️  [Global Setup] Could not auto-create test database:', err.message);
    console.log('   Make sure the test database exists or create it manually.');
  }

  // 3. Run Prisma migrations
  try {
    console.log('🔄 [Global Setup] Running Prisma migrations...');
    execSync('npx prisma migrate deploy', {
      cwd: rootDir,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe',
    });
    console.log('✅ [Global Setup] Migrations applied successfully.');
  } catch (err) {
    console.error('❌ [Global Setup] Migration failed:', err.stderr?.toString() || err.message);
    throw err;
  }
}
