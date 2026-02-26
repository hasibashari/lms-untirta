import z from 'zod';

/**
 * Zod validation schema for transcript query parameters.
 * Allows filtering by semester number or academic semester ID.
 */
export const transcriptQuerySchema = z.object({
  query: z.object({
    semester: z.string().optional(), // Filter by course semester (1-8)
    academicSemesterId: z.string().uuid().optional(),
  }),
});

/**
 * Zod validation schema for accessing a specific student's transcript.
 * Validates the studentId in params.
 */
export const studentTranscriptParamsSchema = z.object({
  params: z.object({
    studentId: z.string().uuid('Student ID tidak valid'),
  }),
  query: z.object({
    semester: z.string().optional(),
  }),
});
