import { prisma } from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';

const createUserByAdmin = async data => {
  // 1. Cek duplikasi
  const extistingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (extistingUser) {
    throw new Error('Email sudah terdaftar');
  }

  // 2. Hash Password Default (Misal: admin memberi password awal "123456")
  // Nanti user bisa ganti password sendiri (fitur update profile)
  const hashedPassword = await hashPassword(data.password);

  // 3. Create User dengan Role sesuai input Admin
  return await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role, // Admin bisa memilih: 'DOSEN' atau 'ADMIN'
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    }, // Jangan return password
  });
};

export { createUserByAdmin };
