import z from 'zod';

const registerSchema = z.object({
  body: z.object({
    email: z.email({ message: 'Email tidak valid' }),
    password: z.string().min(8, { message: 'Password minimal 8 karakter' }),
    name: z.string().min(3, { message: 'Nama terlalu pendek' }),
    // Role tidak divalidasi disini karena user register defaultnya Mahasiswa (diatur di service)
  }),
});

export default registerSchema;
