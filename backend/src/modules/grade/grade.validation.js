import z from 'zod';

const VALID_LETTER_GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'E'];

const inputGradeSchema = z.object({
  params: z.object({
    classId: z.string().uuid('Class ID tidak valid'),
  }),
  body: z.object({
    studentId: z.string().uuid('Student ID tidak valid'),
    letterGrade: z.enum(VALID_LETTER_GRADES, {
      errorMap: () => ({
        message: `Letter grade harus salah satu dari: ${VALID_LETTER_GRADES.join(', ')}`,
      }),
    }),
    numericScore: z.number().min(0).max(100).optional(),
    note: z.string().max(500).optional(),
  }),
});

const bulkInputGradeSchema = z.object({
  params: z.object({
    classId: z.string().uuid('Class ID tidak valid'),
  }),
  body: z.object({
    grades: z
      .array(
        z.object({
          studentId: z.string().uuid('Student ID tidak valid'),
          letterGrade: z.enum(VALID_LETTER_GRADES, {
            errorMap: () => ({
              message: `Letter grade harus salah satu dari: ${VALID_LETTER_GRADES.join(', ')}`,
            }),
          }),
          numericScore: z.number().min(0).max(100).optional(),
          note: z.string().max(500).optional(),
        })
      )
      .min(1, 'Minimal 1 nilai')
      .max(100, 'Maksimal 100 nilai per batch'),
  }),
});

const finalizeGradesSchema = z.object({
  params: z.object({
    classId: z.string().uuid('Class ID tidak valid'),
  }),
});

export { inputGradeSchema, bulkInputGradeSchema, finalizeGradesSchema };
