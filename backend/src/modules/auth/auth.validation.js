import z from 'zod';

/**
 * Zod validation schema for the user registration payload.
 * Enforces format and length constraints for email, password, and name.
 * Note: Role assignment is handled in the service layer, not validated here.
 */
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Email tidak valid' }),
    password: z.string().min(8, { message: 'Password minimal 8 karakter' }),
    name: z.string().min(3, { message: 'Nama terlalu pendek' }),
    // Role tidak divalidasi disini karena user register defaultnya Mahasiswa (diatur di service)
  }),
});

/**
 * Zod validation schema for the user login payload.
 * Ensures email and password are provided and meet basic format requirements.
 */
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Email tidak valid' }),
    password: z.string().min(1, { message: 'Password wajib diisi' }),
  }),
});
