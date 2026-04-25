import * as materialService from './material.service.js';
import { sendSuccess } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';
import { persistUploadMeta, cleanupFile } from '../../services/upload.service.js';
import { buildFileUrl } from '../../middlewares/upload.middleware.js';


/**
 * Creates a new course material.
 * Supports optional file upload via multipart/form-data (field name: "file").
 * @param {import('express').Request} req - Express request object. Expects `courseId` in params and material data in body.
 * @param {import('express').Response} res - Express response object.
 */

const createMaterial = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content, videoUrl } = req.body;

    // If a file was uploaded, persist metadata to Redis and generate the URL
    let fileUrl;
    if (req.file) {
      await persistUploadMeta({ userId: req.user.id, file: req.file });
      fileUrl = buildFileUrl(req, req.file.filename);
    }

    const result = await materialService.createMaterial(
      courseId,
      req.user.id,
      { title, content, fileUrl, videoUrl }
    );

    sendSuccess(res, { statusCode: 201, message: 'Materi berhasil dibuat', data: result });
  } catch (error) {
    if (req.file) await cleanupFile(req.file.path);
    return handleError(res, error);
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
    return handleError(res, error);
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
    return handleError(res, error);
  }
};

/**
 * Updates an existing course material.
 * If a new file is uploaded, it replaces the previous fileUrl.
 * @param {import('express').Request} req - Express request object. Expects `materialId` in params and update data in body.
 * @param {import('express').Response} res - Express response object.
 */
const updateMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { title, content, videoUrl, order } = req.body;

    // Build update payload — only override fileUrl when a new file is provided
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
    if (req.file) await cleanupFile(req.file.path);
    return handleError(res, error);
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
    return handleError(res, error);
  }
};

export { createMaterial, getMaterials, getMaterialById, updateMaterial, deleteMaterial };
