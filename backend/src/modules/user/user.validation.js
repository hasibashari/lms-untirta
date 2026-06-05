import z from 'zod';

/**
 * Zod validation schema for creating a new user (Admin/Dosen).
 * Enforces email format, password length, and valid roles.
 */
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Email tidak valid' }),
    password: z.string().min(8, { message: 'Password minimal 8 karakter' }),
    name: z.string().min(3, { message: 'Nama terlalu pendek' }),
    role: z.enum(['DOSEN', 'ADMIN', 'MAHASISWA'], {
      message: 'Role harus DOSEN, ADMIN, atau MAHASISWA',
    }),
  }),
});

/**
 * Zod validation schema for updating Dospem status.
 */
export const updateDospemSchema = z.object({
  params: z.object({
    id: z.string().uuid('User ID tidak valid'),
  }),
  body: z.object({
    isDospem: z.boolean({ message: 'isDospem harus boolean' }),
  }),
});

/**
 * Zod validation schema for assigning an advisor to a student.
 */
export const assignAdvisorSchema = z.object({
  params: z.object({
    id: z.string().uuid('Student ID tidak valid'),
  }),
  body: z.object({
    advisorId: z.string().uuid('Advisor ID tidak valid').nullable().optional(),
  }),
});

/**
 * Zod validation schema for bulk assigning advisors.
 * Limits the batch size to 50 students.
 */
export const bulkAssignAdvisorSchema = z.object({
  body: z.object({
    studentIds: z.array(z.string().uuid('Student ID tidak valid')).min(1).max(50),
    advisorId: z.string().uuid('Advisor ID tidak valid').nullable().optional(),
  }),
});

/**
 * Zod validation schema for updating user profile.
 */
export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(3, { message: 'Nama terlalu pendek' }).optional(),
    email: z.string().email({ message: 'Email tidak valid' }).optional(),
    password: z.string().min(8, { message: 'Password minimal 8 karakter' }).optional(),
    nim: z.string().optional(),
  }),
});
