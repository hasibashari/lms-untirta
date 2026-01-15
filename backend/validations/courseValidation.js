import z from 'zod';

const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul kelas minimal 3 karakter'),
    description: z.string().optional(), // Boleh kosong
    code: z.string().min(3, 'Kode mata kuliah minimal 3 karakter'), // Misal: IF-101
  }),
});

// Schema untuk Enrollment - support studentId (baru) dan email (legacy)
const enrollStudentSchema = z.object({
  body: z.object({
    studentId: z.string().uuid('Student ID tidak valid').optional(),
    email: z.string().email('Format email tidak valid').optional(),
  }).refine(data => data.studentId || data.email, {
    message: 'studentId atau email wajib diisi',
  }),
});

export { createCourseSchema, enrollStudentSchema };
