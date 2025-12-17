import { prisma } from '../config/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  // 1. Hash password
  const hashedPassword = bcrypt.hashSync('password123', 10);

  // 2. Buat Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lms.com' },
    update: {},
    create: {
      email: 'admin@lms.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'ADMIN', // Set role explisit di sini
    },
  });

  // 3. Buat Dosen
  const dosen = await prisma.user.upsert({
    where: { email: 'dosen@lms.com' },
    update: {},
    create: {
      email: 'dosen@lms.com',
      name: 'Pak Dosen Santoso',
      password: hashedPassword,
      role: 'DOSEN',
    },
  });
  console.log({ admin, dosen });
}

// Jalankan seeding
main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
