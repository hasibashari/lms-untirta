import * as transcriptService from './transcript.service.js';
import { sendSuccess } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';
import logger from '../../config/logger.js';

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


export const getStudentTranscript = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === 'MAHASISWA' && req.user.id !== studentId) {
      const error = new Error('Akses Ditolak: Anda hanya dapat melihat transkrip Anda sendiri.');
      error.statusCode = 403;
      throw error;
    }

    const isStudentView = req.user.role === 'MAHASISWA';
    const result = await transcriptService.getFullStudentTranscript(studentId, { isStudentView });

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
