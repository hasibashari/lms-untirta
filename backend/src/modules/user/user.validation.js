import z from 'zod';

const createUserSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Email tidak valid' }),
    password: z.string().min(8, { message: 'Password minimal 8 karakter' }),
    name: z.string().min(3, { message: 'Nama terlalu pendek' }),
    role: z.enum(['DOSEN', 'ADMIN', 'MAHASISWA'], {
      message: 'Role harus DOSEN, ADMIN, atau MAHASISWA',
    }),
  }),
});

const updateDospemSchema = z.object({
  params: z.object({
    id: z.string().uuid('User ID tidak valid'),
  }),
  body: z.object({
    isDospem: z.boolean({ message: 'isDospem harus boolean' }),
  }),
});

const assignAdvisorSchema = z.object({
  params: z.object({
    id: z.string().uuid('Student ID tidak valid'),
  }),
  body: z.object({
    advisorId: z.string().uuid('Advisor ID tidak valid').nullable().optional(),
  }),
});

const bulkAssignAdvisorSchema = z.object({
  body: z.object({
    studentIds: z.array(z.string().uuid('Student ID tidak valid')).min(1).max(50),
    advisorId: z.string().uuid('Advisor ID tidak valid').nullable().optional(),
  }),
});

export { createUserSchema, updateDospemSchema, assignAdvisorSchema, bulkAssignAdvisorSchema };
