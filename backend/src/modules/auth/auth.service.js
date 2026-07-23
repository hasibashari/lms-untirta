import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { signToken } from '../../config/jwt.js';
import { ROLES } from '../../config/roles.js';
import { AppError } from '../../config/errors.js';
import cache from '../../utils/cache.js';
import redisClient from '../../config/redis.js';
import * as emailService from '../../services/email.service.js';


// ======= REGISTER USER =======
export const registerUser = async ({ email, name, password }) => {
  // 1. Cek duplikasi email
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    if (existingUser.isEmailVerified) {
      throw new AppError(409, 'Email sudah terdaftar');
    }
    // Jika email terdaftar tapi belum diverifikasi, hapus user lama agar bisa mendaftar ulang
    await prisma.user.delete({ where: { id: existingUser.id } });
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

  // 4. Simpan ke DB dengan status isEmailVerified: false
  const newUser = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: ROLES.MAHASISWA,
      advisorId: assignedAdvisorId,
      isEmailVerified: false,
    },
  });

  // 5. Generate token verifikasi 256-bit
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

  await prisma.emailVerificationToken.create({
    data: {
      userId: newUser.id,
      tokenHash,
      expiresAt,
    },
  });

  // 6. Kirim email verifikasi via Resend API
  await emailService.sendVerificationEmail(newUser.email, rawToken);

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    isEmailVerified: false,
    message: 'Registrasi berhasil! Silakan periksa inbox atau spam email Anda untuk mengonfirmasi pendaftaran.',
  };
};

// ======= VERIFY EMAIL =======
export const verifyEmail = async ({ token }) => {
  if (!token) {
    throw new AppError(400, 'Token verifikasi email wajib diisi');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const tokenRecord = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw new AppError(400, 'Tautan verifikasi email tidak valid atau telah kadaluwarsa.');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { isEmailVerified: true, emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: tokenRecord.userId },
    }),
  ]);

  return { message: 'Email berhasil diverifikasi! Silakan login ke akun Anda.' };
};

// ======= RESEND VERIFICATION EMAIL =======
export const resendVerificationEmail = async ({ email }) => {
  const genericResponse = {
    message: 'Jika email terdaftar dan belum diverifikasi, email konfirmasi telah dikirimkan kembali.',
  };

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.isEmailVerified) {
    return genericResponse;
  }

  await prisma.emailVerificationToken.deleteMany({
    where: { userId: user.id },
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  await emailService.sendVerificationEmail(user.email, rawToken);

  return genericResponse;
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
      isEmailVerified: true,
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

  // 3. Cek verifikasi email
  if (!user.isEmailVerified) {
    throw new AppError(403, 'Email Anda belum diverifikasi. Silakan periksa inbox/spam email Anda atau minta kirim ulang email verifikasi.');
  }

  // 4. Generate token
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
  const genericResponse = {
    message: 'Jika email terdaftar di sistem, instruksi untuk reset password telah dikirimkan ke email Anda.',
  };

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Anti-User Enumeration: Jika email tidak ditemukan, kembalikan pesan generik tanpa throw Error
  if (!user) {
    return genericResponse;
  }

  // Generate 256-bit cryptographically secure raw token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit validity

  // Simpan token hash ke database
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  // Kirim email (mengirim rawToken ke email pengguna)
  await emailService.sendResetPasswordEmail(user.email, rawToken);

  return genericResponse;
};

// ======= RESET PASSWORD =======
export const resetPassword = async ({ token, newPassword }) => {
  if (!token) {
    throw new AppError(400, 'Token reset password wajib diisi');
  }

  // Hash incoming raw token dengan SHA-256 untuk dicocokkan di DB
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const resetTokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetTokenRecord || resetTokenRecord.used || resetTokenRecord.expiresAt < new Date()) {
    throw new AppError(400, 'Token reset password tidak valid atau telah kadaluwarsa.');
  }

  // Cek apakah password baru sama dengan password lama
  const isSamePassword = await bcrypt.compare(newPassword, resetTokenRecord.user.password);
  if (isSamePassword) {
    throw new AppError(400, 'Password baru tidak boleh sama dengan password lama Anda. Silakan gunakan password lain.');
  }

  // Hash password baru
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password user & tandai token sudah digunakan
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetTokenRecord.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetTokenRecord.id },
      data: { used: true },
    }),
  ]);

  // Invalidate Redis user session cache
  try {
    if (redisClient.isOpen) {
      await redisClient.del(`user:${resetTokenRecord.userId}`);
      await redisClient.del(`user:profile:${resetTokenRecord.userId}`);
    }
  } catch {
    // Non-blocking log
  }

  return { message: 'Password berhasil direset. Silakan login dengan password baru Anda.' };
};


