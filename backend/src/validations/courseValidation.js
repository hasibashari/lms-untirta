import z from 'zod';

const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul kelas minimal 3 karakter'),
    description: z.string().optional(), // Boleh kosong
    code: z.string().min(3, 'Kode mata kuliah minimal 3 karakter'), // Misal: IF-101
    semester: z.number().int().min(1).max(8).optional(), // Semester 1-8
    sks: z.number().int().min(1).max(6).optional(), // SKS 1-6
    teacherId: z.string().uuid('Teacher ID tidak valid').optional(), // For Admin create
  }),
});

// Schema untuk Update Course (Admin)
const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul kelas minimal 3 karakter').optional(),
    description: z.string().optional(),
    code: z.string().min(3, 'Kode mata kuliah minimal 3 karakter').optional(),
    semester: z.number().int().min(1).max(8).optional(),
    sks: z.number().int().min(1).max(6).optional(),
    teacherId: z.string().uuid('Teacher ID tidak valid').optional().nullable(),
  }),
});

// Schema untuk Assign Teacher (Admin)
const assignTeacherSchema = z.object({
  body: z.object({
    teacherId: z.string().uuid('Teacher ID tidak valid'),
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

export { createCourseSchema, updateCourseSchema, assignTeacherSchema, enrollStudentSchema };
