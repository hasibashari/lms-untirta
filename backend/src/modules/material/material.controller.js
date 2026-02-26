import * as materialService from './material.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Creates a new course material.
 * Only the teacher of the course or an admin can create material.
 * @param {import('express').Request} req - Express request object. Expects `courseId` in params and material data in body.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves a list of all materials for a specific course.
 * Students must be enrolled to view materials.
 * @param {import('express').Request} req - Express request object. Expects `courseId` in params.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves the detailed content of a single material.
 * Authorization checks ensure the user is enrolled or is the teacher/admin.
 * @param {import('express').Request} req - Express request object. Expects `materialId` in params.
 * @param {import('express').Response} res - Express response object.
 */
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
 * Updates an existing course material.
 * Only the teacher of the course or an admin can perform this action.
 * @param {import('express').Request} req - Express request object. Expects `materialId` in params and update data in body.
 * @param {import('express').Response} res - Express response object.
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
 * Deletes a course material.
 * This is a destructive action restricted to the course teacher or an admin.
 * @param {import('express').Request} req - Express request object. Expects `materialId` in params.
 * @param {import('express').Response} res - Express response object.
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
