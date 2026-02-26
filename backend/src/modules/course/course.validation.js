import z from 'zod';

/**
 * Zod validation schema for creating a new course.
 * Enforces title length and unique code format requirements.
 */
export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul kelas minimal 3 karakter'),
    description: z.string().optional(), // Boleh kosong
    code: z.string().min(3, 'Kode mata kuliah minimal 3 karakter'), // Misal: IF-101
    semester: z.number().int().min(1).max(8).optional(), // Semester 1-8
    sks: z.number().int().min(1).max(6).optional(), // SKS 1-6
    teacherId: z.string().uuid('Teacher ID tidak valid').optional(), // For Admin create
  }),
});

/**
 * Zod validation schema for updating an existing course.
 */
export const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul kelas minimal 3 karakter').optional(),
    description: z.string().optional(),
    code: z.string().min(3, 'Kode mata kuliah minimal 3 karakter').optional(),
    semester: z.number().int().min(1).max(8).optional(),
    sks: z.number().int().min(1).max(6).optional(),
    teacherId: z.string().uuid('Teacher ID tidak valid').optional().nullable(),
  }),
});

/**
 * Zod validation schema for assigning a teacher to a course.
 */
export const assignTeacherSchema = z.object({
  body: z.object({
    teacherId: z.string().uuid('Teacher ID tidak valid'),
  }),
});

/**
 * Zod validation schema for enrolling a student.
 * Supports either `studentId` or `email` (legacy).
 */
export const enrollStudentSchema = z.object({
  body: z.object({
    studentId: z.string().uuid('Student ID tidak valid').optional(),
    email: z.string().email('Format email tidak valid').optional(),
  }).refine(data => data.studentId || data.email, {
    message: 'studentId atau email wajib diisi',
  }),
});
