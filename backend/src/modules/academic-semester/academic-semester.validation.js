import z from 'zod';

const createSemesterSchema = z.object({
  body: z.object({
    academicYear: z
      .string()
      .regex(/^\d{4}\/\d{4}$/, 'Format tahun akademik harus YYYY/YYYY (misal: 2025/2026)'),
    semesterType: z.enum(['GANJIL', 'GENAP'], {
      errorMap: () => ({ message: 'Semester harus GANJIL atau GENAP' }),
    }),
    enrollmentStart: z.string().datetime().optional(),
    enrollmentEnd: z.string().datetime().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    gradingDeadline: z.string().datetime().optional(),
  }),
});

const updateSemesterSchema = z.object({
  params: z.object({
    id: z.string().uuid('Semester ID tidak valid'),
  }),
  body: z.object({
    enrollmentStart: z.string().datetime().optional(),
    enrollmentEnd: z.string().datetime().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    gradingDeadline: z.string().datetime().optional(),
  }),
});

const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Semester ID tidak valid'),
  }),
  body: z.object({
    status: z.enum(['PLANNING', 'ENROLLMENT', 'ONGOING', 'GRADING', 'COMPLETED'], {
      errorMap: () => ({
        message: 'Status harus PLANNING, ENROLLMENT, ONGOING, GRADING, atau COMPLETED',
      }),
    }),
    reason: z.string().max(500, 'Alasan maksimal 500 karakter').optional().nullable(),
  }),
});

const setActiveSchema = z.object({
  params: z.object({
    id: z.string().uuid('Semester ID tidak valid'),
  }),
});

export { createSemesterSchema, updateSemesterSchema, updateStatusSchema, setActiveSchema };
