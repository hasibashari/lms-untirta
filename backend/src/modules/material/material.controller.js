import * as materialService from './material.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const createMaterial = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content, fileUrl, videoUrl } = req.body;

    const result = await materialService.createMaterial(
      courseId,
      req.user.id,
      { title, content, fileUrl, videoUrl }
    );

    sendSuccess(res, { statusCode: 201, message: 'Materi berhasil dibuat', data: result });
  } catch (error) {
    if (error.message.includes('Akses ditolak')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

const getMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await materialService.getMaterials(courseId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: 'Daftar materi berhasil diambil', data: result });
  } catch (error) {
    if (error.message.includes('Anda belum terdaftar')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

const getMaterialById = async (req, res) => {
  try {
    const { materialId } = req.params;
    const result = await materialService.getMaterialById(materialId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: 'Detail materi berhasil diambil', data: result });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('Anda belum terdaftar') || error.message.includes('Akses ditolak')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Update Material
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

    sendSuccess(res, { statusCode: 200, message: 'Materi berhasil diperbarui', data: result });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('Akses ditolak')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Delete Material
 */
const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    const result = await materialService.deleteMaterial(
      materialId,
      req.user.id,
      req.user.role
    );

    sendSuccess(res, { statusCode: 200, message: result.message });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('Akses ditolak')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

export { createMaterial, getMaterials, getMaterialById, updateMaterial, deleteMaterial };
