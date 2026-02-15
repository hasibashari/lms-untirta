import z from 'zod';

// --- Schema: Query filter untuk transcript ---
const transcriptQuerySchema = z.object({
  query: z.object({
    semester: z.string().optional(), // Filter by course semester (1-8)
    academicYear: z.string().optional(),
    semesterType: z.enum(['GANJIL', 'GENAP']).optional(),
  }),
});

// --- Schema: Params untuk transcript mahasiswa tertentu (Admin/Dosen) ---
const studentTranscriptParamsSchema = z.object({
  params: z.object({
    studentId: z.string().uuid('Student ID tidak valid'),
  }),
  query: z.object({
    semester: z.string().optional(),
  }),
});

export {
  transcriptQuerySchema,
  studentTranscriptParamsSchema,
};
