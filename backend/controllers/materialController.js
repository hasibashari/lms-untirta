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
    const result = await materialService.getMaterialsByCourse(courseId, req.user.id, req.user.role);

    res.status(200).json({
      message: 'Daftar materi berhasil diambil',
      data: result,
    });
  } catch (error) {
    if (error.message.includes('Anda belum terdaftar')) {
      return res.status(403).json({ message: error.message });
    }
  }
};

export { createMaterial, getMaterials };
