import z from 'zod';

const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul kelas minimal 3 karakter'),
    description: z.string().optional(), // Boleh kosong
    code: z.string().min(3, 'Kode mata kuliah minimal 3 karakter'), // Misal: IF-101
  }),
});

// Schema baru untuk Enrollment
const enrollStudentSchema = z.object({
  body: z.object({
    email: z.email('Format email tidak valid').min(1, 'Email wajib diisi'),
  }),
});

export { createCourseSchema, enrollStudentSchema };
