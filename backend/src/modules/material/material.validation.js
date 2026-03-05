import z from 'zod';

/**
 * Zod validation schema for creating a new course material.
 * When a file is uploaded via multipart/form-data, the server generates the fileUrl
 * automatically — so it is NOT expected in the body. Only text fields are validated here.
 * videoUrl remains optional for external links (e.g. YouTube).
 */
export const createMaterialSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul materi minimal 3 karakter'),
    content: z.string().optional(),

    videoUrl: z.preprocess(
      v => (v === '' ? undefined : v),
      z.url('Format link video tidak valid').optional()
    ),

    fileUrl: z.preprocess(
      v => (v === '' ? undefined : v),
      z.url('Format link file tidak valid').optional()
    ),
  }),
});

/**
 * Zod validation schema for updating an existing course material.
 * All fields are optional. fileUrl is not validated here because it comes from
 * the upload middleware (req.file) when a new file is attached.
 */
export const updateMaterialSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul materi minimal 3 karakter').optional(),
    content: z.string().optional(),

    videoUrl: z.preprocess(
      v => (v === '' ? undefined : v),
      z.url('Format link video tidak valid').optional()
    ),

    fileUrl: z.preprocess(
      v => (v === '' ? undefined : v),
      z.url('Format link file tidak valid').optional()
    ),

    order: z.preprocess(
      v => (v === '' || v === null ? undefined : v),
      z.number().int().positive('Urutan harus bilangan positif').optional()
    ),
  }),
});
