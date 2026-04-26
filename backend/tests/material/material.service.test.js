/**
 * Material Service — Unit Tests
 *
 * Tests all 5 service functions: createMaterial, getMaterials,
 * getMaterialById, updateMaterial, deleteMaterial.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createPrismaMock } from '../helpers/prisma-mock.js';

// ── Prisma mock setup (top-level, before import) ──
const prismaMock = createPrismaMock();
jest.unstable_mockModule('../../src/config/prisma.js', () => ({ default: prismaMock }));
const { createMaterial, getMaterials, getMaterialById, updateMaterial, deleteMaterial } =
  await import('../../src/modules/material/material.service.js');

beforeEach(() => {
  jest.resetAllMocks();
});

// ═══════════════════════════════════════════════════
// createMaterial
// ═══════════════════════════════════════════════════
describe('createMaterial', () => {
  const courseId = 'course-1';
  const teacherId = 'teacher-1';
  const data = { title: 'Pertemuan 1', content: 'Intro', fileUrl: null, videoUrl: null };

  it('should create material with auto-order 1 when no materials exist', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ id: courseId, teacherId });
    prismaMock.material.findFirst.mockResolvedValue(null);
    prismaMock.material.create.mockResolvedValue({ id: 'm1', ...data, order: 1, isPublished: true, courseId });

    const result = await createMaterial(courseId, teacherId, data);

    expect(prismaMock.material.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ order: 1 }) })
    );
    expect(result.order).toBe(1);
  });

  it('should auto-increment order based on last material', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ id: courseId, teacherId });
    prismaMock.material.findFirst.mockResolvedValue({ order: 5 });
    prismaMock.material.create.mockResolvedValue({ id: 'm2', ...data, order: 6, courseId });

    const result = await createMaterial(courseId, teacherId, data);

    expect(prismaMock.material.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ order: 6 }) })
    );
    expect(result.order).toBe(6);
  });

  it('should pass fileUrl and videoUrl to create', async () => {
    const d = { title: 'Materi', content: 'Isi', fileUrl: 'https://f.co/a.pdf', videoUrl: 'https://yt.be/v' };
    prismaMock.course.findUnique.mockResolvedValue({ id: courseId, teacherId });
    prismaMock.material.findFirst.mockResolvedValue(null);
    prismaMock.material.create.mockResolvedValue({ id: 'm3', ...d, order: 1, courseId });

    await createMaterial(courseId, teacherId, d);

    expect(prismaMock.material.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fileUrl: d.fileUrl, videoUrl: d.videoUrl }),
      })
    );
  });

  it('should throw when course not found', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);
    await expect(createMaterial(courseId, teacherId, data)).rejects.toThrow('Kelas tidak ditemukan');
  });

  it('should throw when teacher does not own the course', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ id: courseId, teacherId: 'other-teacher' });
    await expect(createMaterial(courseId, teacherId, data)).rejects.toThrow('Akses ditolak');
  });
});

// ═══════════════════════════════════════════════════
// getMaterials
// ═══════════════════════════════════════════════════
describe('getMaterials', () => {
  const courseId = 'course-1';
  const userId = 'user-1';

  it('should return materials ordered by order for DOSEN', async () => {
    const materials = [
      { id: 'm1', title: 'Pertemuan 1', order: 1 },
      { id: 'm2', title: 'Pertemuan 2', order: 2 },
    ];
    prismaMock.material.findMany.mockResolvedValue(materials);

    const result = await getMaterials(courseId, userId, 'DOSEN');

    expect(result).toEqual(materials);
    expect(prismaMock.material.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { courseId }, orderBy: { order: 'asc' } })
    );
  });

  it('should return materials for ADMIN without enrollment check', async () => {
    prismaMock.material.findMany.mockResolvedValue([]);

    const result = await getMaterials(courseId, userId, 'ADMIN');

    expect(result).toEqual([]);
    expect(prismaMock.enrollment.findUnique).not.toHaveBeenCalled();
  });

  it('should return materials for enrolled MAHASISWA', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue({ userId, courseId });
    prismaMock.material.findMany.mockResolvedValue([{ id: 'm1', title: 'Materi 1', order: 1 }]);

    const result = await getMaterials(courseId, userId, 'MAHASISWA');

    expect(result).toHaveLength(1);
    expect(prismaMock.enrollment.findUnique).toHaveBeenCalledWith({
      where: { userId_courseId: { userId, courseId } },
    });
  });

  it('should throw when MAHASISWA is not enrolled', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue(null);

    await expect(getMaterials(courseId, userId, 'MAHASISWA')).rejects.toThrow(
      'Anda belum terdaftar di kelas ini'
    );
  });
});

// ═══════════════════════════════════════════════════
// getMaterialById
// ═══════════════════════════════════════════════════
describe('getMaterialById', () => {
  const materialId = 'm-1';
  const teacherId = 'teacher-1';
  const studentId = 'student-1';
  const courseId = 'course-1';

  const baseMaterial = {
    id: materialId,
    title: 'Pertemuan 1',
    content: 'Konten materi',
    fileUrl: null,
    videoUrl: null,
    course: { id: courseId, title: 'Algo', teacherId },
  };

  it('should return material detail for course owner DOSEN', async () => {
    prismaMock.material.findUnique.mockResolvedValue(baseMaterial);

    const result = await getMaterialById(materialId, teacherId, 'DOSEN');

    expect(result.id).toBe(materialId);
    expect(result.title).toBe('Pertemuan 1');
    expect(result.content).toBe('Konten materi');
    expect(result.attachments).toEqual([]);
  });

  it('should include pdf attachment when fileUrl exists', async () => {
    prismaMock.material.findUnique.mockResolvedValue({
      ...baseMaterial,
      fileUrl: 'https://files.co/doc.pdf',
    });

    const result = await getMaterialById(materialId, teacherId, 'DOSEN');

    expect(result.attachments).toEqual([{ type: 'pdf', url: 'https://files.co/doc.pdf' }]);
  });

  it('should include video attachment when videoUrl exists', async () => {
    prismaMock.material.findUnique.mockResolvedValue({
      ...baseMaterial,
      videoUrl: 'https://yt.be/video',
    });

    const result = await getMaterialById(materialId, teacherId, 'DOSEN');

    expect(result.attachments).toEqual([{ type: 'video', url: 'https://yt.be/video' }]);
  });

  it('should include both attachments when both URLs exist', async () => {
    prismaMock.material.findUnique.mockResolvedValue({
      ...baseMaterial,
      fileUrl: 'https://f.co/a.pdf',
      videoUrl: 'https://yt.be/v',
    });

    const result = await getMaterialById(materialId, teacherId, 'DOSEN');

    expect(result.attachments).toHaveLength(2);
    expect(result.attachments[0]).toEqual({ type: 'pdf', url: 'https://f.co/a.pdf' });
    expect(result.attachments[1]).toEqual({ type: 'video', url: 'https://yt.be/v' });
  });

  it('should return material for ADMIN without enrollment check', async () => {
    prismaMock.material.findUnique.mockResolvedValue(baseMaterial);

    const result = await getMaterialById(materialId, 'admin-1', 'ADMIN');

    expect(result.id).toBe(materialId);
    expect(prismaMock.enrollment.findUnique).not.toHaveBeenCalled();
  });

  it('should return material for enrolled MAHASISWA', async () => {
    prismaMock.material.findUnique.mockResolvedValue(baseMaterial);
    prismaMock.enrollment.findUnique.mockResolvedValue({ userId: studentId, courseId });

    const result = await getMaterialById(materialId, studentId, 'MAHASISWA');

    expect(result.id).toBe(materialId);
    expect(prismaMock.enrollment.findUnique).toHaveBeenCalledWith({
      where: { userId_courseId: { userId: studentId, courseId } },
    });
  });

  it('should throw when material not found', async () => {
    prismaMock.material.findUnique.mockResolvedValue(null);

    await expect(getMaterialById(materialId, teacherId, 'DOSEN')).rejects.toThrow(
      'Materi tidak ditemukan'
    );
  });

  it('should throw when DOSEN does not own course', async () => {
    prismaMock.material.findUnique.mockResolvedValue(baseMaterial);

    await expect(getMaterialById(materialId, 'other-dosen', 'DOSEN')).rejects.toThrow(
      'Akses ditolak'
    );
  });

  it('should throw when MAHASISWA not enrolled', async () => {
    prismaMock.material.findUnique.mockResolvedValue(baseMaterial);
    prismaMock.enrollment.findUnique.mockResolvedValue(null);

    await expect(getMaterialById(materialId, studentId, 'MAHASISWA')).rejects.toThrow(
      'Anda belum terdaftar di kelas ini'
    );
  });
});

// ═══════════════════════════════════════════════════
// updateMaterial
// ═══════════════════════════════════════════════════
describe('updateMaterial', () => {
  const materialId = 'm-1';
  const teacherId = 'teacher-1';
  const courseId = 'course-1';
  const existingMaterial = {
    id: materialId,
    course: { id: courseId, teacherId },
  };
  const updateData = { title: 'Updated', content: 'New content' };

  it('should update material for course owner DOSEN', async () => {
    prismaMock.material.findUnique.mockResolvedValue(existingMaterial);
    prismaMock.material.update.mockResolvedValue({ id: materialId, ...updateData, order: 1 });

    const result = await updateMaterial(materialId, teacherId, 'DOSEN', updateData);

    expect(prismaMock.material.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: materialId },
        data: expect.objectContaining({ title: 'Updated', content: 'New content' }),
      })
    );
    expect(result.id).toBe(materialId);
  });

  it('should update material for ADMIN regardless of ownership', async () => {
    prismaMock.material.findUnique.mockResolvedValue(existingMaterial);
    prismaMock.material.update.mockResolvedValue({ id: materialId, ...updateData });

    const result = await updateMaterial(materialId, 'admin-1', 'ADMIN', updateData);

    expect(result.id).toBe(materialId);
  });

  it('should update order field', async () => {
    prismaMock.material.findUnique.mockResolvedValue(existingMaterial);
    prismaMock.material.update.mockResolvedValue({ id: materialId, order: 3 });

    await updateMaterial(materialId, teacherId, 'DOSEN', { order: 3 });

    expect(prismaMock.material.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ order: 3 }) })
    );
  });

  it('should throw when material not found', async () => {
    prismaMock.material.findUnique.mockResolvedValue(null);

    await expect(updateMaterial(materialId, teacherId, 'DOSEN', updateData)).rejects.toThrow(
      'Materi tidak ditemukan'
    );
  });

  it('should throw when DOSEN does not own course', async () => {
    prismaMock.material.findUnique.mockResolvedValue(existingMaterial);

    await expect(updateMaterial(materialId, 'other-dosen', 'DOSEN', updateData)).rejects.toThrow(
      'Akses ditolak'
    );
  });

  it('should throw when MAHASISWA tries to update', async () => {
    prismaMock.material.findUnique.mockResolvedValue(existingMaterial);

    await expect(updateMaterial(materialId, 'student-1', 'MAHASISWA', updateData)).rejects.toThrow(
      'Akses ditolak: Mahasiswa tidak dapat mengedit materi'
    );
  });
});

// ═══════════════════════════════════════════════════
// deleteMaterial
// ═══════════════════════════════════════════════════
describe('deleteMaterial', () => {
  const materialId = 'm-1';
  const teacherId = 'teacher-1';
  const courseId = 'course-1';
  const existingMaterial = {
    id: materialId,
    course: { id: courseId, teacherId },
  };

  it('should delete material for course owner DOSEN', async () => {
    prismaMock.material.findUnique.mockResolvedValue(existingMaterial);
    prismaMock.material.delete.mockResolvedValue({});

    const result = await deleteMaterial(materialId, teacherId, 'DOSEN');

    expect(prismaMock.material.delete).toHaveBeenCalledWith({ where: { id: materialId } });
    expect(result.message).toBe('Materi berhasil dihapus');
  });

  it('should delete material for ADMIN regardless of ownership', async () => {
    prismaMock.material.findUnique.mockResolvedValue(existingMaterial);
    prismaMock.material.delete.mockResolvedValue({});

    const result = await deleteMaterial(materialId, 'admin-1', 'ADMIN');

    expect(result.message).toBe('Materi berhasil dihapus');
  });

  it('should throw when material not found', async () => {
    prismaMock.material.findUnique.mockResolvedValue(null);

    await expect(deleteMaterial(materialId, teacherId, 'DOSEN')).rejects.toThrow(
      'Materi tidak ditemukan'
    );
  });

  it('should throw when DOSEN does not own course', async () => {
    prismaMock.material.findUnique.mockResolvedValue(existingMaterial);

    await expect(deleteMaterial(materialId, 'other-dosen', 'DOSEN')).rejects.toThrow(
      'Akses ditolak'
    );
  });

  it('should throw when MAHASISWA tries to delete', async () => {
    prismaMock.material.findUnique.mockResolvedValue(existingMaterial);

    await expect(deleteMaterial(materialId, 'student-1', 'MAHASISWA')).rejects.toThrow(
      'Akses ditolak: Mahasiswa tidak dapat menghapus materi'
    );
  });
});
