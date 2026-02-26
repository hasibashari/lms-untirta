import * as classService from './class.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// ======================== CREATE ========================

/**
 * Creates a new class offering (Kelas Offering).
 * @param {import('express').Request} req - Express request object. Expects class details in body.
 * @param {import('express').Response} res - Express response object.
 */
export const create = async (req, res) => {
  try {
    const newClass = await classService.createClass(req.body);
    sendSuccess(res, {
      statusCode: 201,
      message: 'Kelas offering berhasil dibuat',
      data: newClass,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('bukan dosen')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    if (error.message.includes('sudah ada')) {
      return sendError(res, { statusCode: 409, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// ======================== READ ========================

/**
 * Retrieves all class offerings, optionally filtered by semester or course.
 * @param {import('express').Request} req - Express request object. Supports query params `academicSemesterId` and `courseId`.
 * @param {import('express').Response} res - Express response object.
 */
export const getAll = async (req, res) => {
  try {
    const filters = {
      academicSemesterId: req.query.academicSemesterId,
      courseId: req.query.courseId,
    };
    const classes = await classService.getAllClasses(filters);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar kelas offering berhasil diambil',
      data: classes,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Retrieves details of a specific class offering by ID.
 * @param {import('express').Request} req - Express request object. Expects `id` in params.
 * @param {import('express').Response} res - Express response object.
 */
export const getById = async (req, res) => {
  try {
    const classData = await classService.getClassById(req.params.id);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Detail kelas offering berhasil diambil',
      data: classData,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Retrieves classes taught by the currently authenticated lecturer.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export const getMyClasses = async (req, res) => {
  try {
    const filters = {
      academicSemesterId: req.query.academicSemesterId,
    };
    const classes = await classService.getClassesByLecturer(req.user.id, filters);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar kelas yang diajar berhasil diambil',
      data: classes,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Retrieves all class offerings for a specific course.
 * @param {import('express').Request} req - Express request object. Expects `courseId` in params.
 * @param {import('express').Response} res - Express response object.
 */
export const getByCourse = async (req, res) => {
  try {
    const filters = {
      academicSemesterId: req.query.academicSemesterId,
    };
    const classes = await classService.getClassesByCourse(req.params.courseId, filters);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar kelas offering untuk mata kuliah berhasil diambil',
      data: classes,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Retrieves class offerings that are currently open for enrollment.
 * Used by students during KRS period.
 * @param {import('express').Request} req - Express request object. Supports query params `academicSemesterId` and `courseId`.
 * @param {import('express').Response} res - Express response object.
 */
export const getOpen = async (req, res) => {
  try {
    const filters = {
      academicSemesterId: req.query.academicSemesterId,
      courseId: req.query.courseId,
    };
    const classes = await classService.getOpenClasses(filters);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar kelas offering yang buka pendaftaran berhasil diambil',
      data: classes,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// ======================== UPDATE ========================

/**
 * Updates an existing class offering.
 * @param {import('express').Request} req - Express request object. Expects `id` in params and update data in body.
 * @param {import('express').Response} res - Express response object.
 */
export const update = async (req, res) => {
  try {
    const updatedClass = await classService.updateClass(req.params.id, req.body);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Kelas offering berhasil diperbarui',
      data: updatedClass,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('bukan dosen')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    if (error.message.includes('sudah ada')) {
      return sendError(res, { statusCode: 409, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Toggles the enrollment status (open/closed) of a class.
 * @param {import('express').Request} req - Express request object. Expects `id` in params and `isEnrollmentOpen` in body.
 * @param {import('express').Response} res - Express response object.
 */
export const toggleEnrollment = async (req, res) => {
  try {
    const { isEnrollmentOpen } = req.body;
    const updatedClass = await classService.toggleEnrollment(req.params.id, isEnrollmentOpen);

    const status = isEnrollmentOpen ? 'dibuka' : 'ditutup';
    sendSuccess(res, {
      statusCode: 200,
      message: `Pendaftaran kelas berhasil ${status}`,
      data: updatedClass,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// ======================== DELETE ========================

/**
 * Deletes a class offering.
 * @param {import('express').Request} req - Express request object. Expects `id` in params.
 * @param {import('express').Response} res - Express response object.
 */
export const remove = async (req, res) => {
  try {
    const result = await classService.deleteClass(req.params.id);
    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};
