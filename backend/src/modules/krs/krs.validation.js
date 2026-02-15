import z from 'zod';

// --- Schema: Enroll ke Kelas (KRS) ---
const enrollClassSchema = z.object({
  body: z.object({
    classId: z.string().uuid('Class ID tidak valid'),
  }),
});

// --- Schema: Drop / Unenroll dari Kelas ---
const dropClassSchema = z.object({
  params: z.object({
    classId: z.string().uuid('Class ID tidak valid'),
  }),
});

// --- Schema: Submit KRS (bulk status change) ---
const submitKrsSchema = z.object({
  body: z.object({
    academicYear: z.string().regex(/^\d{4}\/\d{4}$/, 'Format tahun akademik harus YYYY/YYYY'),
    semesterType: z.enum(['GANJIL', 'GENAP'], {
      errorMap: () => ({ message: 'Semester harus GANJIL atau GENAP' }),
    }),
  }),
});

// --- Schema: Update Status KRS (Dosen PA / Admin) ---
const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Enrollment ID tidak valid'),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED'], {
      errorMap: () => ({ message: 'Status harus APPROVED atau REJECTED' }),
    }),
    note: z.string().max(500).optional(),
  }),
});

// --- Schema: Query filter ---
const krsQuerySchema = z.object({
  query: z.object({
    academicYear: z.string().optional(),
    semesterType: z.enum(['GANJIL', 'GENAP']).optional(),
    semester: z.string().optional(),
  }),
});

export {
  enrollClassSchema,
  dropClassSchema,
  submitKrsSchema,
  updateStatusSchema,
  krsQuerySchema,
};
