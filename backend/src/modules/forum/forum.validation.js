import z from 'zod';

/**
 * Zod validation schema for creating a new forum thread.
 * Title must be at least 3 characters, content at least 10 characters.
 */
export const createThreadSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul diskusi minimal 3 karakter'),
    content: z.string().min(10, 'Isi diskusi minimal 10 karakter'),
  }),
});

/**
 * Zod validation schema for updating an existing forum thread.
 * All fields are optional.
 */
export const updateThreadSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul diskusi minimal 3 karakter').optional(),
    content: z.string().min(10, 'Isi diskusi minimal 10 karakter').optional(),
  }),
});

/**
 * Zod validation schema for creating a reply to a thread.
 * Content must be at least 1 character (no empty replies).
 */
export const createReplySchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Isi balasan tidak boleh kosong'),
    parentId: z.string().uuid('ID parent tidak valid').optional().nullable(),
  }),
});

/**
 * Zod validation schema for updating an existing reply.
 * Content is required and must be at least 1 character.
 */
export const updateReplySchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Isi balasan tidak boleh kosong'),
  }),
});
