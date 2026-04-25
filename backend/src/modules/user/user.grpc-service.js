import grpc from '@grpc/grpc-js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';
import { paginate } from '../../utils/pagination.js';

export const userService = {
  CreateUserByAdmin: async (call, callback) => {
    try {
      const data = call.request;
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) {
        return callback({ code: grpc.status.ALREADY_EXISTS, details: 'Email sudah terdaftar' });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      let assignedAdvisorId = null;
      if (data.role === 'MAHASISWA') {
        const dospems = await prisma.user.findMany({
          where: { role: 'DOSEN', isDospem: true },
          include: {
            _count: {
              select: { advisedStudents: true }
            }
          }
        });
        if (dospems.length > 0) {
          dospems.sort((a, b) => a._count.advisedStudents - b._count.advisedStudents);
          assignedAdvisorId = dospems[0].id;
        }
      }

      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashedPassword,
          role: data.role,
          advisorId: assignedAdvisorId,
        },
        select: {
          id: true, name: true, email: true, role: true, createdAt: true,
        },
      });

      callback(null, { ...user, createdAt: user.createdAt.toISOString() });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetAllUsers: async (call, callback) => {
    try {
      const { role, isDospem, skip, take } = call.request;
      const query = { skip, take };
      const { skip: pSkip, take: pTake, meta } = paginate(query);
      
      const whereClause = {};
      if (role) whereClause.role = role;
      if (isDospem !== undefined && isDospem !== null) whereClause.isDospem = isDospem;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          select: {
            id: true, name: true, email: true, role: true, isDospem: true, advisorId: true,
            advisor: { select: { id: true, name: true, email: true } },
            _count: { select: { advisedStudents: true } },
          },
          orderBy: { name: 'asc' },
          skip: pSkip,
          take: pTake,
        }),
        prisma.user.count({ where: whereClause }),
      ]);

      const data = users.map(u => ({
        id: u.id, name: u.name, email: u.email, role: u.role, isDospem: u.isDospem, advisorId: u.advisorId,
        advisor: u.advisor || null,
        advisedStudentCount: u._count.advisedStudents,
      }));

      callback(null, { data, pagination: meta(total) });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetUserById: async (call, callback) => {
    try {
      const { id } = call.request;
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true, name: true, email: true, role: true, isDospem: true, advisorId: true,
          advisor: { select: { id: true, name: true, email: true } },
          _count: { select: { advisedStudents: true } }
        },
      });

      if (!user) {
        return callback({ code: grpc.status.NOT_FOUND, details: 'User tidak ditemukan' });
      }

      callback(null, {
        id: user.id, name: user.name, email: user.email, role: user.role, isDospem: user.isDospem,
        advisorId: user.advisorId, advisor: user.advisor || null, advisedStudentCount: user._count.advisedStudents
      });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  UpdateUser: async (call, callback) => {
    try {
      const data = call.request;
      const user = await prisma.user.findUnique({ where: { id: data.id } });
      if (!user) {
        return callback({ code: grpc.status.NOT_FOUND, details: 'User tidak ditemukan' });
      }

      if (data.email && data.email !== user.email) {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) return callback({ code: grpc.status.ALREADY_EXISTS, details: 'Email sudah terdaftar' });
      }

      const updateData = {};
      if (data.email) updateData.email = data.email;
      if (data.name) updateData.name = data.name;
      if (data.role) updateData.role = data.role;

      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      const updated = await prisma.user.update({
        where: { id: data.id },
        data: updateData,
        select: { id: true, name: true, email: true, role: true },
      });

      callback(null, updated);
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  DeleteUser: async (call, callback) => {
    try {
      const { id } = call.request;
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return callback({ code: grpc.status.NOT_FOUND, details: 'User tidak ditemukan' });

      const deleted = await prisma.user.delete({
        where: { id }, select: { id: true, name: true, email: true, role: true }
      });
      callback(null, deleted);
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  UpdateDospemStatus: async (call, callback) => {
    try {
      const { id, isDospem } = call.request;
      const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
      
      if (!user) return callback({ code: grpc.status.NOT_FOUND, details: 'User tidak ditemukan' });
      if (user.role !== 'DOSEN') return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Hanya dosen yang dapat dijadikan Dosen Pembimbing' });

      const updated = await prisma.user.update({
        where: { id }, data: { isDospem },
        select: { id: true, name: true, email: true, role: true, isDospem: true },
      });
      callback(null, updated);
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  AssignAdvisor: async (call, callback) => {
    try {
      const { studentId, advisorId } = call.request;
      const student = await prisma.user.findUnique({ where: { id: studentId }, select: { id: true, role: true } });
      
      if (!student) return callback({ code: grpc.status.NOT_FOUND, details: 'Mahasiswa tidak ditemukan' });
      if (student.role !== 'MAHASISWA') return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Hanya mahasiswa yang dapat memiliki Dosen Pembimbing' });

      if (advisorId) {
        const advisor = await prisma.user.findUnique({ where: { id: advisorId }, select: { id: true, role: true, isDospem: true } });
        if (!advisor) return callback({ code: grpc.status.NOT_FOUND, details: 'Dosen tidak ditemukan' });
        if (advisor.role !== 'DOSEN') return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Advisor harus memiliki role DOSEN' });
        if (!advisor.isDospem) return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Dosen ini belum ditunjuk sebagai Dosen Pembimbing' });
      }

      const updated = await prisma.user.update({
        where: { id: studentId }, data: { advisorId: advisorId || null },
        select: { id: true, name: true, email: true, role: true, advisorId: true, advisor: { select: { id: true, name: true, email: true } } },
      });

      callback(null, { ...updated, advisor: updated.advisor || null });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  BulkAssignAdvisor: async (call, callback) => {
    try {
      const { studentIds, advisorId } = call.request;
      if (!studentIds || studentIds.length === 0) return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Tidak ada mahasiswa yang dipilih' });
      if (studentIds.length > 50) return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Maksimal 50 mahasiswa per batch' });

      if (advisorId) {
        const advisor = await prisma.user.findUnique({ where: { id: advisorId }, select: { id: true, role: true, isDospem: true } });
        if (!advisor) return callback({ code: grpc.status.NOT_FOUND, details: 'Dosen tidak ditemukan' });
        if (advisor.role !== 'DOSEN') return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Advisor harus memiliki role DOSEN' });
        if (!advisor.isDospem) return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Dosen ini belum ditunjuk sebagai Dosen Pembimbing' });
      }

      const students = await prisma.user.findMany({ where: { id: { in: studentIds }, role: 'MAHASISWA' }, select: { id: true } });
      if (students.length !== studentIds.length) return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Beberapa user bukan mahasiswa atau tidak ditemukan' });

      const result = await prisma.user.updateMany({ where: { id: { in: studentIds } }, data: { advisorId: advisorId || null } });
      
      callback(null, { message: `${result.count} mahasiswa berhasil di-assign`, updatedCount: result.count });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetAdvisorSummary: async (call, callback) => {
    try {
      const advisors = await prisma.user.findMany({
        where: { role: 'DOSEN', isDospem: true },
        select: {
          id: true, name: true, email: true,
          advisedStudents: { select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } },
          _count: { select: { advisedStudents: true } },
        },
        orderBy: { name: 'asc' },
      });

      const data = advisors.map(a => ({
        id: a.id, name: a.name, email: a.email,
        advisedStudentCount: a._count.advisedStudents,
        students: a.advisedStudents,
      }));

      callback(null, { data });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetAdvisorStudents: async (call, callback) => {
    try {
      const { advisorId } = call.request;
      const advisor = await prisma.user.findUnique({ where: { id: advisorId }, select: { id: true, role: true, isDospem: true, name: true, email: true } });
      
      if (!advisor) return callback({ code: grpc.status.NOT_FOUND, details: 'Dosen tidak ditemukan' });
      if (!advisor.isDospem) return callback({ code: grpc.status.INVALID_ARGUMENT, details: 'Dosen ini bukan Dosen Pembimbing' });

      const students = await prisma.user.findMany({
        where: { advisorId, role: 'MAHASISWA' },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      });

      callback(null, { advisor: { id: advisor.id, name: advisor.name, email: advisor.email }, students });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  },

  GetAdminStats: async (call, callback) => {
    try {
      const [totalUsers, totalCourses, totalDosen, totalMahasiswa] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.user.count({ where: { role: 'DOSEN' } }),
        prisma.user.count({ where: { role: 'MAHASISWA' } }),
      ]);
      callback(null, { totalUsers, totalCourses, totalDosen, totalMahasiswa });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message });
    }
  }
};
