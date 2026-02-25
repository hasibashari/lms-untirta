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
    academicSemesterId: z.string().uuid('Academic Semester ID tidak valid'),
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

// --- Schema: Bulk Update Status KRS (Admin) ---
const bulkUpdateStatusSchema = z.object({
  body: z.object({
    enrollmentIds: z.array(z.string().uuid('Enrollment ID tidak valid')).min(1).max(50),
    status: z.enum(['APPROVED', 'REJECTED'], {
      errorMap: () => ({ message: 'Status harus APPROVED atau REJECTED' }),
    }),
    note: z.string().max(500).optional(),
  }),
});

// --- Schema: Query filter ---
const krsQuerySchema = z.object({
  query: z.object({
    academicSemesterId: z.string().uuid().optional(),
    semester: z.string().optional(),
  }),
});

// --- Schema: Revise Rejected KRS ---
const reviseEnrollmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Enrollment ID tidak valid'),
  }),
});

export {
  enrollClassSchema,
  dropClassSchema,
  submitKrsSchema,
  updateStatusSchema,
  bulkUpdateStatusSchema,
  krsQuerySchema,
  reviseEnrollmentSchema,
};
