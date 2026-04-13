import * as transcriptService from './transcript.service.js';
import { sendSuccess } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';
import logger from '../../config/logger.js';

/**
 * Retrieves the student's study results based on legacy course enrollments.
 * @param {import('express').Request} req - Express request object. Supports `semester` query param.
 * @param {import('express').Response} res - Express response object.
 */
export const getStudyResults = async (req, res) => {
  try {
    const filters = {
      semester: req.query.semester,
    };
    const result = await transcriptService.getStudyResults(req.user.id, filters);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Hasil studi berhasil diambil',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Retrieves the student's transcript based on class enrollments (KRS).
 * This is the modern transcript view supporting the new academic system.
 * @param {import('express').Request} req - Express request object. Supports `academicSemesterId` query param.
 * @param {import('express').Response} res - Express response object.
 */
export const getTranscriptByClass = async (req, res) => {
  try {
    const filters = {
      academicSemesterId: req.query.academicSemesterId,
    };
    const result = await transcriptService.getTranscriptByClass(req.user.id, filters);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Transkrip berhasil diambil',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Retrieves a summary of the student's academic progress.
 * Combines data from both legacy and new systems for the dashboard.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export const getAcademicSummary = async (req, res) => {
  try {
    const result = await transcriptService.getAcademicSummary(req.user.id);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Ringkasan akademik berhasil diambil',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Retrieves the full transcript of a specific student for administrative viewing.
 * Accessible by Lecturers (Dosen) and Admins. Includes audit logging.
 * @param {import('express').Request} req - Express request object. Expects `studentId` in params.
 * @param {import('express').Response} res - Express response object.
 */
export const getStudentTranscript = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === 'MAHASISWA' && req.user.id !== studentId) {
      const error = new Error('Akses Ditolak: Anda hanya dapat melihat transkrip Anda sendiri.');
      error.statusCode = 403;
      throw error;
    }

    const result = await transcriptService.getFullStudentTranscript(studentId);

    // Audit log: record who accessed whose transcript
    const accessor = req.user;
    logger.info({
      event: 'TRANSCRIPT_ACCESS',
      accessorRole: accessor.role,
      accessorId: accessor.id,
      studentId,
    }, 'Transcript accessed');

    sendSuccess(res, {
      statusCode: 200,
      message: 'Transkrip mahasiswa berhasil diambil',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * Retrieves a list of all students with their academic summary.
 * Intended for the Admin dashboard to browse student records.
 * @param {import('express').Request} req - Express request object. Supports `search` query param.
 * @param {import('express').Response} res - Express response object.
 */
export const getStudentList = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
    };
    const { data, pagination } = await transcriptService.getStudentList(filters, req.query);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar mahasiswa berhasil diambil',
      data,
      pagination,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
