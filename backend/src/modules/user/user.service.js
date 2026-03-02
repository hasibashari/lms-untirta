import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';
import { AppError } from '../../config/errors.js';
import { paginate } from '../../utils/pagination.js';

/**
 * Creates a new user with a specific role initiated by an Admin.
 * Hashes a default password and ensures email uniqueness.
 * @param {object} data - User creation data.
 * @param {string} data.email - User email.
 * @param {string} data.name - User name.
 * @param {string} data.password - Raw password.
 * @param {string} data.role - Role (DOSEN or ADMIN).
 * @returns {Promise<object>} The created user object (excluding password).
 * @throws {Error} If email is already registered.
 */
const createUserByAdmin = async data => {
  // 1. Cek duplikasi
  const extistingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (extistingUser) {
    throw new AppError(409, 'Email sudah terdaftar');
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

/**
 * Retrieves all users matching the provided filters.
 * @param {string} [roleFilter] - Optional role to filter by.
 * @param {boolean} [isDospemFilter] - Optional isDospem status to filter by.
 * @returns {Promise<Array<object>>} List of users with advisor info and student counts.
 */
const getAllUsers = async (roleFilter, isDospemFilter, query = {}) => {
  const { skip, take, meta } = paginate(query);
  const whereClause = {};
  if (roleFilter) whereClause.role = roleFilter;
  if (isDospemFilter !== undefined) whereClause.isDospem = isDospemFilter;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
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
      skip,
      take,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return {
    data: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isDospem: u.isDospem,
      advisorId: u.advisorId,
      advisor: u.advisor,
      advisedStudentCount: u._count.advisedStudents,
    })),
    pagination: meta(total),
  };
};

/**
 * Retrieves a user by their unique ID.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object|null>} The user object or null if not found.
 */
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
 * Updates the `isDospem` status for a lecturer.
 * Verifies that the user is indeed a lecturer before updating.
 * @param {string} userId - The ID of the user (lecturer).
 * @param {boolean} isDospem - The new status.
 * @returns {Promise<object>} The updated user object.
 * @throws {Error} If user not found or not a lecturer.
 */
const updateDospemStatus = async (userId, isDospem) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) throw new AppError(404, 'User tidak ditemukan');
  if (user.role !== 'DOSEN') throw new AppError(400, 'Hanya dosen yang dapat dijadikan Dosen Pembimbing');

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
 * Assigns an academic advisor (Dospem) to a student.
 * Validates that the student exists and the advisor is a valid Dospem.
 * @param {string} studentId - The ID of the student.
 * @param {string|null} advisorId - The ID of the advisor (or null to unassign).
 * @returns {Promise<object>} The updated student object.
 * @throws {Error} If validation fails for student or advisor.
 */
const assignAdvisor = async (studentId, advisorId) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true, advisorId: true },
  });

  if (!student) throw new AppError(404, 'Mahasiswa tidak ditemukan');
  if (student.role !== 'MAHASISWA') throw new AppError(400, 'Hanya mahasiswa yang dapat memiliki Dosen Pembimbing');

  if (advisorId) {
    const advisor = await prisma.user.findUnique({
      where: { id: advisorId },
      select: { id: true, role: true, isDospem: true },
    });

    if (!advisor) throw new AppError(404, 'Dosen tidak ditemukan');
    if (advisor.role !== 'DOSEN') throw new AppError(400, 'Advisor harus memiliki role DOSEN');
    if (!advisor.isDospem) throw new AppError(400, 'Dosen ini belum ditunjuk sebagai Dosen Pembimbing');
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
 * Bulk assigns an academic advisor to multiple students.
 * @param {Array<string>} studentIds - List of student IDs.
 * @param {string|null} advisorId - The ID of the advisor (or null to unassign).
 * @returns {Promise<{message: string, updatedCount: number}>} Summary of the operation.
 * @throws {Error} If validation fails.
 */
const bulkAssignAdvisor = async (studentIds, advisorId) => {
  if (!studentIds || studentIds.length === 0) {
    throw new AppError(400, 'Tidak ada mahasiswa yang dipilih');
  }

  if (studentIds.length > 50) {
    throw new AppError(400, 'Maksimal 50 mahasiswa per batch');
  }

  // Validate advisor
  if (advisorId) {
    const advisor = await prisma.user.findUnique({
      where: { id: advisorId },
      select: { id: true, role: true, isDospem: true },
    });

    if (!advisor) throw new AppError(404, 'Dosen tidak ditemukan');
    if (advisor.role !== 'DOSEN') throw new AppError(400, 'Advisor harus memiliki role DOSEN');
    if (!advisor.isDospem) throw new AppError(400, 'Dosen ini belum ditunjuk sebagai Dosen Pembimbing');
  }

  // Validate all students
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds }, role: 'MAHASISWA' },
    select: { id: true },
  });

  if (students.length !== studentIds.length) {
    throw new AppError(400, 'Beberapa user bukan mahasiswa atau tidak ditemukan');
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
 * Retrieves a summary of all academic advisors (Dospem).
 * Includes the count of students currently assigned to each advisor.
 * @returns {Promise<Array<object>>} List of advisors with student counts.
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
 * Retrieves the list of students assigned to a specific advisor.
 * @param {string} advisorId - The ID of the advisor.
 * @returns {Promise<{advisor: object, students: Array<object>}>} Advisor details and list of students.
 * @throws {Error} If advisor not found or invalid.
 */
const getAdvisorStudents = async (advisorId) => {
  const advisor = await prisma.user.findUnique({
    where: { id: advisorId },
    select: { id: true, role: true, isDospem: true, name: true },
  });

  if (!advisor) throw new AppError(404, 'Dosen tidak ditemukan');
  if (!advisor.isDospem) throw new AppError(400, 'Dosen ini bukan Dosen Pembimbing');

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
