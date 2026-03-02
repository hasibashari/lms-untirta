import * as gradeService from './grade.service.js';
import { sendSuccess } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';

/**
 * Retrieves the list of students in a class for grading purposes.
 * Intended for lecturers to view their class roster and current grade status.
 * @param {import('express').Request} req - Express request object. Expects `classId` in params.
 * @param {import('express').Response} res - Express response object.
 */
export const getClassStudents = async (req, res) => {
  try {
    const result = await gradeService.getClassStudentsForGrading(
      req.params.classId,
      req.user.id
    );
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar mahasiswa untuk penilaian berhasil diambil',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Inputs or updates a grade for a single student in a class.
 * @param {import('express').Request} req - Express request object. Expects `classId` in params and grade data in body.
 * @param {import('express').Response} res - Express response object.
 */
export const inputGrade = async (req, res) => {
  try {
    const result = await gradeService.inputGrade(
      req.params.classId,
      req.user.id,
      req.body
    );
    sendSuccess(res, {
      statusCode: 200,
      message: `Nilai ${result.letterGrade} berhasil disimpan untuk ${result.student.name}`,
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Inputs or updates grades for multiple students in a batch.
 * @param {import('express').Request} req - Express request object. Expects `classId` in params and `grades` array in body.
 * @param {import('express').Response} res - Express response object.
 */
export const bulkInputGrades = async (req, res) => {
  try {
    const result = await gradeService.bulkInputGrades(
      req.params.classId,
      req.user.id,
      req.body.grades
    );
    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Finalizes the grades for a class, making them visible to students.
 * This action is irreversible for the semester.
 * @param {import('express').Request} req - Express request object. Expects `classId` in params.
 * @param {import('express').Response} res - Express response object.
 */
export const finalizeGrades = async (req, res) => {
  try {
    const result = await gradeService.finalizeGrades(
      req.params.classId,
      req.user.id
    );
    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Retrieves the authenticated student's own grades.
 * Only shows finalized grades or grades from closed semesters.
 * @param {import('express').Request} req - Express request object. Supports optional `semesterId` query param.
 * @param {import('express').Response} res - Express response object.
 */
export const getMyGrades = async (req, res) => {
  try {
    const filters = {
      academicSemesterId: req.query.semesterId,
    };
    const result = await gradeService.getMyGrades(req.user.id, filters);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Nilai akhir berhasil diambil',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
