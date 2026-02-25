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

const getAllUsers = async (roleFilter, isDospemFilter) => {
  const whereClause = {};
  if (roleFilter) whereClause.role = roleFilter;
  if (isDospemFilter !== undefined) whereClause.isDospem = isDospemFilter;

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
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
      _count: {
        select: {
          advisedStudents: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isDospem: u.isDospem,
    advisorId: u.advisorId,
    advisor: u.advisor,
    advisedStudentCount: u._count.advisedStudents,
  }));
};

const getUserById = async userId => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
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

  return user;
};

// ======================== DOSPEM MANAGEMENT ========================

/**
 * Toggle isDospem status untuk seorang Dosen.
 */
const updateDospemStatus = async (userId, isDospem) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) throw new Error('User tidak ditemukan');
  if (user.role !== 'DOSEN') throw new Error('Hanya dosen yang dapat dijadikan Dosen Pembimbing');

  return await prisma.user.update({
    where: { id: userId },
    data: { isDospem },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isDospem: true,
    },
  });
};

/**
 * Assign advisor (Dospem) ke seorang mahasiswa.
 */
const assignAdvisor = async (studentId, advisorId) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true, advisorId: true },
  });

  if (!student) throw new Error('Mahasiswa tidak ditemukan');
  if (student.role !== 'MAHASISWA') throw new Error('Hanya mahasiswa yang dapat memiliki Dosen Pembimbing');

  if (advisorId) {
    const advisor = await prisma.user.findUnique({
      where: { id: advisorId },
      select: { id: true, role: true, isDospem: true },
    });

    if (!advisor) throw new Error('Dosen tidak ditemukan');
    if (advisor.role !== 'DOSEN') throw new Error('Advisor harus memiliki role DOSEN');
    if (!advisor.isDospem) throw new Error('Dosen ini belum ditunjuk sebagai Dosen Pembimbing');
  }

  return await prisma.user.update({
    where: { id: studentId },
    data: { advisorId: advisorId || null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
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
};

/**
 * Bulk assign advisor ke banyak mahasiswa sekaligus.
 */
const bulkAssignAdvisor = async (studentIds, advisorId) => {
  if (!studentIds || studentIds.length === 0) {
    throw new Error('Tidak ada mahasiswa yang dipilih');
  }

  if (studentIds.length > 50) {
    throw new Error('Maksimal 50 mahasiswa per batch');
  }

  // Validate advisor
  if (advisorId) {
    const advisor = await prisma.user.findUnique({
      where: { id: advisorId },
      select: { id: true, role: true, isDospem: true },
    });

    if (!advisor) throw new Error('Dosen tidak ditemukan');
    if (advisor.role !== 'DOSEN') throw new Error('Advisor harus memiliki role DOSEN');
    if (!advisor.isDospem) throw new Error('Dosen ini belum ditunjuk sebagai Dosen Pembimbing');
  }

  // Validate all students
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds }, role: 'MAHASISWA' },
    select: { id: true },
  });

  if (students.length !== studentIds.length) {
    throw new Error('Beberapa user bukan mahasiswa atau tidak ditemukan');
  }

  const result = await prisma.user.updateMany({
    where: { id: { in: studentIds } },
    data: { advisorId: advisorId || null },
  });

  return {
    message: `${result.count} mahasiswa berhasil di-assign ke Dosen Pembimbing`,
    updatedCount: result.count,
  };
};

/**
 * Get advisor summary — daftar semua Dospem dengan jumlah mahasiswa bimbingan.
 */
const getAdvisorSummary = async () => {
  const advisors = await prisma.user.findMany({
    where: { role: 'DOSEN', isDospem: true },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: {
          advisedStudents: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return advisors.map(a => ({
    id: a.id,
    name: a.name,
    email: a.email,
    advisedStudentCount: a._count.advisedStudents,
  }));
};

/**
 * Get students of a specific advisor (Dospem).
 */
const getAdvisorStudents = async (advisorId) => {
  const advisor = await prisma.user.findUnique({
    where: { id: advisorId },
    select: { id: true, role: true, isDospem: true, name: true },
  });

  if (!advisor) throw new Error('Dosen tidak ditemukan');
  if (!advisor.isDospem) throw new Error('Dosen ini bukan Dosen Pembimbing');

  const students = await prisma.user.findMany({
    where: { advisorId, role: 'MAHASISWA' },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: 'asc' },
  });

  return {
    advisor: { id: advisor.id, name: advisor.name },
    students,
  };
};

export {
  createUserByAdmin,
  getAllUsers,
  getUserById,
  updateDospemStatus,
  assignAdvisor,
  bulkAssignAdvisor,
  getAdvisorSummary,
  getAdvisorStudents,
};
