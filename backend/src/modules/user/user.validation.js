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

export { createUserSchema };
