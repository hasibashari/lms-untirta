import * as materialService from './material.service.js';
import { sendSuccess } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';
import { persistUploadMeta, cleanupFile } from '../../services/upload.service.js';
import { buildFileUrl } from '../../middlewares/upload.middleware.js';

// Controller untuk endpoint materi. Bertugas menerima request, memanggil
// service layer, dan mengelola side-effect (mis. penyimpanan metadata upload).

export const createMaterial = async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, content, videoUrl } = req.body;

    // Jika ada file yang di-upload, simpan metadata sementara ke Redis
    // dan bangun URL file yang dapat diakses client.
    let fileUrl;
    if (req.file) {
      await persistUploadMeta({ userId: req.user.id, file: req.file });
      fileUrl = buildFileUrl(req, req.file.filename);
    }

    // Panggil service untuk membuat materi. `req.user` diasumsikan berasal
    // dari middleware autentikasi yang menyisipkan info user ke request.
    const result = await materialService.createMaterial(
      classId,
      req.user.id,
      { title, content, fileUrl, videoUrl }
    );

    sendSuccess(res, { statusCode: 201, message: 'Materi berhasil dibuat', data: result });
  } catch (error) {
    // Jika terjadi error setelah upload file, hapus file sementara untuk cleanup
    if (req.file) await cleanupFile(req.file.path);
    return handleError(res, error);
  }
};

export const getMaterials = async (req, res) => {
  try {
    const { classId } = req.params;
    // Ambil daftar materi; service akan menangani hak akses berdasar role/userId
    const result = await materialService.getMaterials(classId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: 'Daftar materi berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMaterialById = async (req, res) => {
  try {
    const { materialId } = req.params;
    const result = await materialService.getMaterialById(materialId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: 'Detail materi berhasil diambil', data: result });
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { title, content, videoUrl, order } = req.body;

    // Susun payload update; hanya ganti `fileUrl` jika ada file baru
    const updateData = { title, content, videoUrl, order };

    if (req.file) {
      await persistUploadMeta({ userId: req.user.id, file: req.file });
      updateData.fileUrl = buildFileUrl(req, req.file.filename);
    }

    const result = await materialService.updateMaterial(
      materialId,
      req.user.id,
      req.user.role,
      updateData
    );

    sendSuccess(res, { statusCode: 200, message: 'Materi berhasil diperbarui', data: result });
  } catch (error) {
    // Jika error setelah upload, lakukan cleanup file sementara
    if (req.file) await cleanupFile(req.file.path);
    return handleError(res, error);
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    // Service akan melakukan validasi hak akses dan penghapusan data
    const result = await materialService.deleteMaterial(
      materialId,
      req.user.id,
      req.user.role
    );

    sendSuccess(res, { statusCode: 200, message: result.message });
  } catch (error) {
    return handleError(res, error);
  }
};


