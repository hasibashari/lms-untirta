import z from 'zod';

// Schema untuk Dosen membuat tugas
const createAssignmentSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    // Validasi format ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
    dueDate: z.coerce.date({
      message: 'Format tanggal tidak valid (Gunakan ISO 8601)',
    }),
  }),
});

// Schema untuk Dosen mengupdate tugas
const updateAssignmentSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul tugas minimal 3 karakter').optional(),
    description: z.string().optional(),
    dueDate: z.coerce.date({
      message: 'Format tanggal tidak valid (Gunakan ISO 8601)',
    }).optional(),
  }),
});

// Schema untuk Mahasiswa mengumpul tugas
const submitAssignmentSchema = z.object({
  body: z
    .object({
      fileUrl: z.string().url('URL tidak valid').min(1, 'URL harus diisi'),
      note: z.string().optional(),
    }),
});

// Schema untuk Dosen memberi nilai
const gradeSubmissionSchema = z.object({
  body: z.object({
    grade: z.number().min(0, 'Nilai minimal 0').max(100, 'Nilai maksimal 100'),
    feedback: z.string().optional(), // Feedback boleh kosong
  }),
});

export { createAssignmentSchema, updateAssignmentSchema, submitAssignmentSchema, gradeSubmissionSchema };
