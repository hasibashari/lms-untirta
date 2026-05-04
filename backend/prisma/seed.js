import prisma from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  // 1. Hash password
  const hashedPassword = bcrypt.hashSync('password123', 10);

  // 2. Buat Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@untirta.ac.id' },
    update: {},
    create: {
      email: 'admin@untirta.ac.id',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'ADMIN', // Set role explisit di sini
    },
  });

  // 3. Buat Dosen
  const dosen = await prisma.user.upsert({
    where: { email: 'budi.santoso@untirta.ac.id' },
    update: { isDospem: true },
    create: {
      email: 'budi.santoso@untirta.ac.id',
      name: 'Budi Santoso ST.,MT',
      password: hashedPassword,
      role: 'DOSEN',
      isDospem: true,
    },
  });

  // 4. Buat Mahasiswa
  const mahasiswa = await prisma.user.upsert({
    where: { email: 'budi@untirta.ac.id' },
    update: {
      nim: '230000001',
      advisorId: dosen.id,
    },
    create: {
      email: 'budi@untirta.ac.id',
      name: 'Budi Setiawan',
      password: hashedPassword,
      role: 'MAHASISWA',
      nim: '230000001',
      advisorId: dosen.id,
    },
  });

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
