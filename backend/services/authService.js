import { prisma } from '../config/prisma.js';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';

// Register a new user
const registerUser = async ({ email, name, password }) => {
  // 1. Cek duplikasi email
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email sudah terdaftar'); // Error ini akan ditangkap Controller
  }

  // 2. Hash password
  const hashedPassword = await hashPassword(password);

  // 3. Simpan ke DB
  const newUser = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: 'MAHASISWA', // Default role
    },
  });

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
  };
};

// Login user
const loginUser = async ({ email, password }) => {
  // 1. Cari user berdasarkan email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Email atau password salah');
  }
  // 2. Cek password
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new Error('Email atau password salah');
  }

  // 3. Generate token
  const token = generateToken({
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
    },
  };
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

  if (!user) {
    throw new Error('User tidak ditemukan');
  }

  return user;
};

export { registerUser, loginUser, getUserById };
