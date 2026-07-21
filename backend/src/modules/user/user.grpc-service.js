import grpc from '@grpc/grpc-js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';
import { paginate } from '../../utils/pagination.js';
import cache from '../../utils/cache.js';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Hash password menggunakan bcrypt
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

/**
 * Mencari dosen pembimbing dengan jumlah bimbingan paling sedikit
 * (Load balancing bimbingan mahasiswa baru)
 */
const findLeastBusyAdvisor = async () => {
  const dospems = await prisma.user.findMany({
    where: { role: 'DOSEN', isDospem: true },
    orderBy: {
      advisedStudents: { _count: 'asc' }
    },
    take: 1,
    select: { id: true }
  });
  return dospems.length > 0 ? dospems[0].id : null;
};

// =============================================================================
// HANDLERS — CORE USER OPERATIONS
// =============================================================================

export const CreateUserByAdmin = async (call, callback) => {
  try {
    const data = call.request;

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) return callback({ code: grpc.status.ALREADY_EXISTS, details: 'Email sudah terdaftar' });

    const hashedPassword = await hashPassword(data.password);

    // Penugasan advisor otomatis untuk mahasiswa baru
    let assignedAdvisorId = null;
    if (data.role === 'MAHASISWA') {
      assignedAdvisorId = await findLeastBusyAdvisor();
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role,
        nim: data.nim || undefined,
        advisorId: assignedAdvisorId,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true, nim: true },
    });

    callback(null, { ...user, createdAt: user.createdAt.toISOString() });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GetAllUsers = async (call, callback) => {
  try {
    const { role, isDospem, page, limit } = call.request;
    const { skip, take, meta } = paginate({ page, limit });

    const where = {};
    if (role) where.role = role;
    if (isDospem !== undefined && isDospem !== null) where.isDospem = isDospem;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true, isDospem: true, advisorId: true, nim: true,
          advisor: { select: { id: true, name: true, email: true } },
          _count: { select: { advisedStudents: true } },
        },
        orderBy: { name: 'asc' },
        skip, take,
      }),
      prisma.user.count({ where }),
    ]);

    const data = users.map(u => ({
      ...u,
      advisor: u.advisor || null,
      advisedStudentCount: u._count.advisedStudents,
    }));

    callback(null, { data, pagination: meta(total) });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GetUserById = async (call, callback) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: call.request.id },
      select: {
        id: true, name: true, email: true, role: true, isDospem: true, advisorId: true, nim: true,
        advisor: { select: { id: true, name: true, email: true } },
        _count: { select: { advisedStudents: true } }
      },
    });

    if (!user) return callback({ code: grpc.status.NOT_FOUND, details: 'User tidak ditemukan' });

    callback(null, {
      ...user,
      advisor: user.advisor || null,
      advisedStudentCount: user._count.advisedStudents
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const UpdateUser = async (call, callback) => {
  try {
    const data = call.request;
    const user = await prisma.user.findUnique({ where: { id: data.id } });
    if (!user) return callback({ code: grpc.status.NOT_FOUND, details: 'User tidak ditemukan' });

    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) return callback({ code: grpc.status.ALREADY_EXISTS, details: 'Email sudah terdaftar' });
    }

    const updated = await prisma.user.update({
      where: { id: data.id },
      data: {
        email: data.email || undefined,
        name: data.name || undefined,
        role: data.role || undefined,
        nim: data.nim || undefined,
        password: data.password ? await hashPassword(data.password) : undefined,
      },
      select: { id: true, name: true, email: true, role: true, nim: true },
    });

    callback(null, updated);
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const DeleteUser = async (call, callback) => {
  try {
    const { id } = call.request;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return callback({ code: grpc.status.NOT_FOUND, details: 'User tidak ditemukan' });

    const deleted = await prisma.user.delete({
      where: { id },
      select: { id: true, name: true, email: true, role: true }
    });
    callback(null, deleted);
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

// =============================================================================
// HANDLERS — DOSEN PEMBIMBING (ADVISOR) OPERATIONS
// =============================================================================

export const UpdateDospemStatus = async (call, callback) => {
  try {
    const { id, isDospem } = call.request;
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });

    if (!user) return callback({ code: grpc.status.NOT_FOUND, details: 'User tidak ditemukan' });
    if (user.role !== 'DOSEN') return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Hanya dosen yang bisa menjadi Dospem' });

    const updated = await prisma.user.update({
      where: { id },
      data: { isDospem },
      select: { id: true, name: true, email: true, role: true, isDospem: true }
    });
    callback(null, updated);
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const AssignAdvisor = async (call, callback) => {
  try {
    const { studentId, advisorId } = call.request;

    const student = await prisma.user.findUnique({ where: { id: studentId }, select: { id: true, role: true } });
    if (!student || student.role !== 'MAHASISWA') {
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'User bukan mahasiswa' });
    }

    if (advisorId) {
      const advisor = await prisma.user.findUnique({ where: { id: advisorId }, select: { id: true, role: true, isDospem: true } });
      if (!advisor || !advisor.isDospem) {
        return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Dosen bukan dospem aktif' });
      }
    }

    const updated = await prisma.user.update({
      where: { id: studentId },
      data: { advisorId: advisorId || null },
      include: { advisor: { select: { id: true, name: true, email: true } } },
    });

    callback(null, {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      advisorId: updated.advisorId,
      advisor: updated.advisor || null
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const BulkAssignAdvisor = async (call, callback) => {
  try {
    const { studentIds, advisorId } = call.request;
    if (!studentIds?.length) return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Tidak ada mahasiswa dipilih' });

    if (advisorId) {
      const advisor = await prisma.user.findUnique({ where: { id: advisorId }, select: { isDospem: true } });
      if (!advisor?.isDospem) return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Advisor tidak valid' });
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: studentIds }, role: 'MAHASISWA' },
      data: { advisorId: advisorId || null }
    });

    callback(null, { message: 'Berhasil update batch', updatedCount: result.count });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GetAdvisorSummary = async (call, callback) => {
  try {
    const advisors = await prisma.user.findMany({
      where: { role: 'DOSEN', isDospem: true },
      include: {
        advisedStudents: { select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } },
        _count: { select: { advisedStudents: true } },
      },
      orderBy: { name: 'asc' },
    });

    callback(null, {
      data: advisors.map(a => ({
        id: a.id, name: a.name, email: a.email,
        advisedStudentCount: a._count.advisedStudents,
        students: a.advisedStudents
      }))
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

export const GetAdvisorStudents = async (call, callback) => {
  try {
    const { advisorId } = call.request;
    const advisor = await prisma.user.findUnique({ where: { id: advisorId }, select: { id: true, name: true, email: true, isDospem: true } });

    if (!advisor?.isDospem) return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Dosen bukan dospem' });

    const students = await prisma.user.findMany({
      where: { advisorId, role: 'MAHASISWA' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' }
    });

    callback(null, {
      advisor: { id: advisor.id, name: advisor.name, email: advisor.email },
      students
    });
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

// =============================================================================
// HANDLERS — DASHBOARD & STATS
// =============================================================================

export const GetAdminStats = async (call, callback) => {
  try {
    const data = await cache.getOrSet(
      'admin:dashboard:stats',
      async () => {
        const [totalUsers, totalCourses, totalDosen, totalMahasiswa] = await Promise.all([
          prisma.user.count(),
          prisma.course.count(),
          prisma.user.count({ where: { role: 'DOSEN' } }),
          prisma.user.count({ where: { role: 'MAHASISWA' } }),
        ]);
        return { totalUsers, totalCourses, totalDosen, totalMahasiswa };
      },
      60
    );
    callback(null, data);
  } catch (error) {
    callback({ code: grpc.status.INTERNAL, details: error.message });
  }
};

