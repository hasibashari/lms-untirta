import z from 'zod';

/**
 * Zod validation schema for creating a new course material.
 * Validates title and optional content/URLs. Empty strings for URLs are treated as undefined.
 */
export const createMaterialSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul materi minimal 3 karakter'),
    content: z.string().optional(),

    fileUrl: z.preprocess(
      v => (v === '' ? undefined : v),
      z.url('Format link file tidak valid').optional()
    ),

    videoUrl: z.preprocess(
      v => (v === '' ? undefined : v),
      z.url('Format link video tidak valid').optional()
    ),
  }),
});

/**
 * Zod validation schema for updating an existing course material.
 * All fields are optional. Handles empty strings and nulls for URLs and order.
 */
export const updateMaterialSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul materi minimal 3 karakter').optional(),
    content: z.string().optional(),

    fileUrl: z.preprocess(
      v => (v === '' ? undefined : v),
      z.url('Format link file tidak valid').optional()
    ),

    videoUrl: z.preprocess(
      v => (v === '' ? undefined : v),
      z.url('Format link video tidak valid').optional()
    ),

    order: z.preprocess(
      v => (v === '' || v === null ? undefined : v),
      z.number().int().positive('Urutan harus bilangan positif').optional()
    ),
  }),
});
