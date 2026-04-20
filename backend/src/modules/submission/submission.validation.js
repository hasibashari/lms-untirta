import z from 'zod';

/**
 * Zod validation schema for submitting an assignment.
 * Allows either uploaded file (handled by multer) or fileUrl in body, with optional note.
 */
export const submitAssignmentSchema = z.object({
  body: z.object({
    fileUrl: z.string().url('URL file tidak valid').optional(),
    note: z.string().optional(),
  }),
});

/**
 * Zod validation schema for grading a student submission.
 * Enforces a numeric grade between 0 and 100 and allows optional feedback.
 */
export const gradeSubmissionSchema = z.object({
  body: z.object({
    grade: z.number().min(0, 'Nilai minimal 0').max(100, 'Nilai maksimal 100'),
    feedback: z.string().optional(),
  }),
});
