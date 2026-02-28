import * as semesterService from './academic.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Retrieves all academic semesters ordered by academic year.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export const getAll = async (req, res) => {
  try {
    const semesters = await semesterService.getAllSemesters();
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar semester akademik berhasil diambil',
      data: semesters,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Retrieves the currently active academic semester (status: OPEN).
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export const getActive = async (req, res) => {
  try {
    const semester = await semesterService.getActiveSemester();
    sendSuccess(res, {
      statusCode: 200,
      message: semester
        ? 'Semester aktif berhasil diambil'
        : 'Tidak ada semester aktif',
      data: semester,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Retrieves details of a specific academic semester by ID.
 * @param {import('express').Request} req - Express request object. Expects `id` in params.
 * @param {import('express').Response} res - Express response object.
 */
export const getById = async (req, res) => {
  try {
    const semester = await semesterService.getSemesterById(req.params.id);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Detail semester berhasil diambil',
      data: semester,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Creates a new academic semester.
 * @param {import('express').Request} req - Express request object. Expects semester details in body.
 * @param {import('express').Response} res - Express response object.
 */
export const create = async (req, res) => {
  try {
    const semester = await semesterService.createSemester(req.body);
    sendSuccess(res, {
      statusCode: 201,
      message: `Semester ${semester.semesterType} ${semester.academicYear} berhasil dibuat`,
      data: semester,
    });
  } catch (error) {
    if (error.message.includes('sudah ada')) {
      return sendError(res, { statusCode: 409, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Updates an existing academic semester.
 * @param {import('express').Request} req - Express request object. Expects `id` in params and update data in body.
 * @param {import('express').Response} res - Express response object.
 */
export const update = async (req, res) => {
  try {
    const semester = await semesterService.updateSemester(req.params.id, req.body);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Semester berhasil diperbarui',
      data: semester,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Updates the status of an academic semester (e.g., DRAFT -> OPEN -> CLOSED).
 * @param {import('express').Request} req - Express request object. Expects `id` in params and `status` in body.
 * @param {import('express').Response} res - Express response object.
 */
export const updateStatus = async (req, res) => {
  try {
    const semester = await semesterService.updateStatus(
      req.params.id,
      req.body.status,
    );
    sendSuccess(res, {
      statusCode: 200,
      message: `Status semester berhasil diubah ke ${req.body.status}`,
      data: semester,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    // Structured pre-flight validation failure (e.g., incomplete grades)
    if (error.code === 'PRECONDITION_FAILED') {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: 'GRADE_COMPLETION_REQUIRED',
        details: error.details || null,
      });
    }
    if (error.message.includes('Tidak dapat') || error.message.includes('Sudah ada semester OPEN')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Checks if a semester is ready to be closed.
 * Returns a summary of grading progress and any blocking issues.
 * @param {import('express').Request} req - Express request object. Expects `id` in params.
 * @param {import('express').Response} res - Express response object.
 */
export const getClosingReadiness = async (req, res) => {
  try {
    const readiness = await semesterService.getClosingReadiness(req.params.id);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Status kesiapan penutupan semester berhasil diambil',
      data: readiness,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Deletes a DRAFT academic semester.
 * @param {import('express').Request} req - Express request object. Expects `id` in params.
 * @param {import('express').Response} res - Express response object.
 */
export const remove = async (req, res) => {
  try {
    await semesterService.deleteSemester(req.params.id);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Semester berhasil dihapus',
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('Tidak dapat')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Retrieves the list of semesters relevant to the authenticated student.
 * Includes semesters where the student has enrolled, plus the currently active semester.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export const getStudentSemesters = async (req, res) => {
  try {
    const semesters = await semesterService.getStudentSemesters(req.user.id);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar semester mahasiswa berhasil diambil',
      data: semesters,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};
