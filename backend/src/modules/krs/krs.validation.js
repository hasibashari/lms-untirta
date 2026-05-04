import z from 'zod';

/**
 * Zod validation schema for enrolling in a class.
 * Requires a valid UUID for the classId.
 */
export const enrollClassSchema = z.object({
  body: z.object({
    classId: z.string().uuid('Class ID tidak valid'),
  }),
});

/**
 * Zod validation schema for dropping a class from KRS.
 * Validates the classId from the URL parameters.
 */
export const dropClassSchema = z.object({
  params: z.object({
    classId: z.string().uuid('Class ID tidak valid'),
  }),
});

/**
 * Zod validation schema for submitting a KRS.
 */
export const submitKrsSchema = z.object({
  body: z.object({
    academicSemesterId: z.string().uuid('Academic Semester ID tidak valid'),
  }),
});

/**
 * Zod validation schema for updating the status of a single KRS enrollment.
 * Used by academic advisors or admins to approve or reject a class.
 */
export const updateStatusSchema = z.object({
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

/**
 * Zod validation schema for bulk-updating the status of multiple KRS enrollments.
 * Ensures an array of valid UUIDs is provided.
 */
export const bulkUpdateStatusSchema = z.object({
  body: z.object({
    enrollmentIds: z.array(z.string().uuid('Enrollment ID tidak valid')).min(1).max(50),
    status: z.enum(['APPROVED', 'REJECTED'], {
      errorMap: () => ({ message: 'Status harus APPROVED atau REJECTED' }),
    }),
    note: z.string().max(500).optional(),
  }),
});

/**
 * Zod validation schema for KRS-related query parameters.
 * Validates optional filters like academic semester and course semester.
 */
export const krsQuerySchema = z.object({
  query: z.object({
    academicSemesterId: z.string().uuid().optional(),
    semester: z.string().optional(),
  }),
});

/**
 * Zod validation schema for revising a rejected KRS enrollment.
 * Validates the enrollment ID from the URL parameters.
 */
export const reviseEnrollmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Enrollment ID tidak valid'),
  }),
});
