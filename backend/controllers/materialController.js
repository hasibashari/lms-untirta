import * as materialService from '../services/materialService.js';

const createMaterial = async (req, res) => {
  try {
    const { courseId } = req.params; // ID Course dari URL
    const { title, content, fileUrl, videoUrl } = req.body; // Data materi dari body request

    const result = await materialService.createMaterial(
      courseId,
      req.user.id, // ID Dosen
      { title, content, fileUrl, videoUrl }
    );

    res.status(201).json({
      message: 'Materi berhasil dibuat',
      data: result,
    });
  } catch (error) {
    if (error.message.includes('Akses ditolak')) {
      return res.status(403).json({ message: error.message });
    }

    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const getMaterials = async (req, res) => {
  try {
    const { courseId } = req.params; // ID Course dari URL
    const result = await materialService.getMaterials(courseId, req.user.id, req.user.role);

    res.status(200).json({
      message: 'Daftar materi berhasil diambil',
      data: result,
    });
  } catch (error) {
    if (error.message.includes('Anda belum terdaftar')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const getMaterialById = async (req, res) => {
  try {
    const { materialId } = req.params; // ID Material dari URL
    const result = await materialService.getMaterialById(materialId, req.user.id, req.user.role);

    res.status(200).json({
      message: 'Detail materi berhasil diambil',
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Anda belum terdaftar') || error.message.includes('Akses ditolak')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

/**
 * Update Material - Controller untuk mengupdate materi
 */
const updateMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { title, content, fileUrl, videoUrl, order } = req.body;

    const result = await materialService.updateMaterial(
      materialId,
      req.user.id,
      req.user.role,
      { title, content, fileUrl, videoUrl, order }
    );

    res.status(200).json({
      message: 'Materi berhasil diperbarui',
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Akses ditolak')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

/**
 * Delete Material - Controller untuk menghapus materi
 */
const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    const result = await materialService.deleteMaterial(
      materialId,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Akses ditolak')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

export { createMaterial, getMaterials, getMaterialById, updateMaterial, deleteMaterial };
