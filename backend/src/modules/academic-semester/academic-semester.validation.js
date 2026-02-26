import z from 'zod';

const createSemesterSchema = z.object({
  body: z.object({
    academicYear: z
      .string()
      .regex(/^\d{4}\/\d{4}$/, 'Format tahun akademik harus YYYY/YYYY (misal: 2025/2026)'),
    semesterType: z.enum(['GANJIL', 'GENAP'], {
      errorMap: () => ({ message: 'Semester harus GANJIL atau GENAP' }),
    }),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    maxSks: z.number().int().min(1, 'Minimal 1 SKS').max(36, 'Maksimal 36 SKS').optional().default(24),
  }),
});

const updateSemesterSchema = z.object({
  params: z.object({
    id: z.string().uuid('Semester ID tidak valid'),
  }),
  body: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    maxSks: z.number().int().min(1, 'Minimal 1 SKS').max(36, 'Maksimal 36 SKS').optional(),
  }),
});

const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Semester ID tidak valid'),
  }),
  body: z.object({
    status: z.enum(['DRAFT', 'OPEN', 'CLOSED'], {
      errorMap: () => ({
        message: 'Status harus DRAFT, OPEN, atau CLOSED',
      }),
    }),
  }),
});

export { createSemesterSchema, updateSemesterSchema, updateStatusSchema };
