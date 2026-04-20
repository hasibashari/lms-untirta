import z from 'zod';

/**
 * Zod validation schema for creating a new assignment.
 * Enforces title length and valid ISO 8601 date format for the due date.
 */
export const createAssignmentSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul tugas minimal 3 karakter'),
    description: z.string().optional(),
    // Validasi format ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
    dueDate: z.coerce.date({
      message: 'Format tanggal tidak valid (Gunakan ISO 8601)',
    }),
  }),
});

/**
 * Zod validation schema for updating an existing assignment.
 * All fields are optional, allowing partial updates.
 */
export const updateAssignmentSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul tugas minimal 3 karakter').optional(),
    description: z.string().optional(),
    dueDate: z.coerce.date({
      message: 'Format tanggal tidak valid (Gunakan ISO 8601)',
    }).optional(),
  }),
});

