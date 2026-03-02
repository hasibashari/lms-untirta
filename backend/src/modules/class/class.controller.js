import * as classService from './class.service.js';
import { sendSuccess } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';

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
    return handleError(res, error);
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
    const { data, pagination } = await classService.getAllClasses(filters, req.query);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar kelas offering berhasil diambil',
      data,
      pagination,
    });
  } catch (error) {
    return handleError(res, error);
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
    return handleError(res, error);
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
    return handleError(res, error);
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
    return handleError(res, error);
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
    return handleError(res, error);
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
    return handleError(res, error);
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
    return handleError(res, error);
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
    return handleError(res, error);
  }
};
