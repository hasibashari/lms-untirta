import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { signToken } from '../../config/jwt.js';
import { ROLES } from '../../config/roles.js';
import { AppError } from '../../config/errors.js';
import cache from '../../utils/cache.js';

// ======= REGISTER USER =======
export const registerUser = async ({ email, name, password }) => {
  // 1. Cek duplikasi email
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError(409, 'Email sudah terdaftar'); // Error ini akan ditangkap Controller
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Cari dospem dengan jumlah mahasiswa bimbingan paling sedikit
  const dospems = await prisma.user.findMany({
    where: { role: 'DOSEN', isDospem: true },
    orderBy: {
      advisedStudents: {
        _count: 'asc'
      }
    },
    take: 1,
    select: { id: true }
  });

  let assignedAdvisorId = null;
  if (dospems.length > 0) {
    assignedAdvisorId = dospems[0].id;
  }

  // 4. Simpan ke DB
  const newUser = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: ROLES.MAHASISWA, // Default role
      advisorId: assignedAdvisorId,
    },
  });

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  };
};

// ======= LOGIN USER =======
export const loginUser = async ({ email, password }) => {
  // 1. Cari user berdasarkan email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      role: true,
      isDospem: true,
      nim: true,
    },
  });

  if (!user) {
    throw new AppError(401, 'Email atau password salah');
  }
  // 2. Cek password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError(401, 'Email atau password salah');
  }

  // 3. Generate token
  const token = signToken({
    userId: user.id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isDospem: user.isDospem,
      nim: user.nim,
    },
  };
};

// ======= GET USER BY ID =======
export const getUserById = async (userId) => {
  const cacheKey = `user:profile:${userId}`;

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          nim: true,
          role: true,
          isDospem: true,
          advisorId: true,
          advisor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!user) {
        throw new AppError(404, 'User tidak ditemukan');
      }

      return user;
    },
    1800 // Cache for 30 minutes
  );
};

// ======= FORGOT PASSWORD =======
export const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(404, 'Email tidak ditemukan di sistem.');
  }

  return { message: 'Email ditemukan, silakan masukkan password baru.' };
};

// ======= RESET PASSWORD =======
export const resetPassword = async ({ email, newPassword }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(404, 'User tidak ditemukan.');
  }

  // Hash password baru
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return { message: 'Password berhasil direset. Silakan login dengan password baru.' };
};

