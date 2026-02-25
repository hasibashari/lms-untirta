import z from 'zod';

// --- Schema: Create Class (Kelas Offering) ---
const createClassSchema = z.object({
  body: z.object({
    courseId: z.string().uuid('Course ID tidak valid'),
    lecturerId: z.string().uuid('Lecturer ID tidak valid'),
    academicSemesterId: z.string().uuid('Academic Semester ID tidak valid'),
    section: z
      .string()
      .min(1, 'Section minimal 1 karakter')
      .max(5, 'Section maksimal 5 karakter'), // "A", "B", "C", "A1"
    schedule: z.string().max(200).optional(),
    room: z.string().max(50).optional(),
    capacity: z.number().int().min(1, 'Kapasitas minimal 1').max(500, 'Kapasitas maksimal 500').optional(),
    isEnrollmentOpen: z.boolean().optional(),
  }),
});

// --- Schema: Update Class ---
const updateClassSchema = z.object({
  body: z.object({
    lecturerId: z.string().uuid('Lecturer ID tidak valid').optional(),
    academicSemesterId: z.string().uuid('Academic Semester ID tidak valid').optional(),
    section: z
      .string()
      .min(1, 'Section minimal 1 karakter')
      .max(5, 'Section maksimal 5 karakter')
      .optional(),
    schedule: z.string().max(200).optional().nullable(),
    room: z.string().max(50).optional().nullable(),
    capacity: z.number().int().min(1).max(500).optional(),
    isEnrollmentOpen: z.boolean().optional(),
  }),
});

// --- Schema: Toggle Enrollment Status ---
const toggleEnrollmentSchema = z.object({
  body: z.object({
    isEnrollmentOpen: z.boolean({ required_error: 'Status enrollment wajib diisi (true/false)' }),
  }),
});

// --- Schema: Query filter ---
const queryFilterSchema = z.object({
  query: z.object({
    academicSemesterId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional(),
  }),
});

export {
  createClassSchema,
  updateClassSchema,
  toggleEnrollmentSchema,
  queryFilterSchema,
};
