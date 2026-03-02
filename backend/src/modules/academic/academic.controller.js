import * as semesterService from './academic.service.js';
import { sendSuccess } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';

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
    return handleError(res, error);
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
    return handleError(res, error);
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
    return handleError(res, error);
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
    return handleError(res, error);
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
    return handleError(res, error);
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
    return handleError(res, error);
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
    return handleError(res, error);
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
    return handleError(res, error);
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
    return handleError(res, error);
  }
};
