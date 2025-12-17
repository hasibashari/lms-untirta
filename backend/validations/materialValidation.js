import z from 'zod';

const createMaterialSchema = z.object({
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

export { createMaterialSchema };
