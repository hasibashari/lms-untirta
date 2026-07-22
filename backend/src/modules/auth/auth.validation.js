// Validasi payload untuk endpoint otentikasi menggunakan Zod.
// Hanya menegakkan shape dan constraint dasar (email/password/name).
import z from 'zod';

// Schema untuk registrasi user — body wajib berisi email, password, dan name.
// Catatan: role tidak divalidasi di sini karena default role (MAHASISWA)
// biasanya diatur di service saat pendaftaran.
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Email tidak valid' }),
    password: z.string()
      .min(8, { message: 'Password minimal 8 karakter' })
      .regex(/^(?=.*[A-Z])(?=.*\d)/, { message: 'Password harus mengandung huruf besar dan angka' }),
    name: z.string().min(3, { message: 'Nama terlalu pendek' }),
  }),
});

// Schema untuk login — hanya periksa keberadaan dan format dasar.
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Email tidak valid' }),
    password: z.string().min(1, { message: 'Password wajib diisi' }),
  }),
});

// Schema untuk forgot password
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Email tidak valid' }),
  }),
});

// Schema untuk reset password
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, { message: 'Token reset password wajib diisi' }),
    newPassword: z.string()
      .min(8, { message: 'Password minimal 8 karakter' })
      .regex(/^(?=.*[A-Z])(?=.*\d)/, { message: 'Password harus mengandung huruf besar dan angka' }),
  }),
});

