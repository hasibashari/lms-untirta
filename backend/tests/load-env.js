import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// 1. MUAT ENVIRONMENT .env.test SEGERA!
config({ path: resolve(rootDir, '.env.test'), override: true });

// 2. PROTEK: Jangan biarkan test berjalan jika DATABASE_URL tidak mengarah ke database test.
// Ini mencegah penghapusan data di database utama jika terjadi kesalahan konfigurasi.
const dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl.includes('lms_db_test')) {
  console.error('\n❌ [CRITICAL ERROR] Test attempts to use a NON-TEST database!');
  console.error('Current DATABASE_URL:', dbUrl.replace(/\/\/.*@/, '//<credentials>@'));
  console.error('Execution halted to prevent data loss in the main database.\n');
  process.exit(1);
}
