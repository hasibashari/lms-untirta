import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';

const createUserByAdmin = async data => {
  // 1. Cek duplikasi
  const extistingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (extistingUser) {
    throw new Error('Email sudah terdaftar');
  }

  // 2. Hash Password Default (Misal: admin memberi password awal "123456")
  // Nanti user bisa ganti password sendiri (fitur update profile)
  const hashedPassword = await bcrypt.hash(data.password, 10);

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
      name: true,
      email: true,
      role: true,
      createdAt: true,
    }, // Jangan return password
  });
};

const getAllUsers = async roleFilter => {
  const whereClause = roleFilter ? { role: roleFilter } : {};

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      // password: false (JANGAN return password!)
    },
    orderBy: {
      name: 'asc',
    },
  });

  return users;
};

const getUserById = async userId => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return user;
};

export { createUserByAdmin, getAllUsers, getUserById };
