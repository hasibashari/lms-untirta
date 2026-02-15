import * as transcriptService from './transcript.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// --- Get Study Results (Legacy — Course-based) ---
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
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Get Transcript by Class (New — KrsEnrollment-based) ---
export const getTranscriptByClass = async (req, res) => {
  try {
    const filters = {
      academicYear: req.query.academicYear,
      semesterType: req.query.semesterType,
    };
    const result = await transcriptService.getTranscriptByClass(req.user.id, filters);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Transkrip berhasil diambil',
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Get Academic Summary ---
export const getAcademicSummary = async (req, res) => {
  try {
    const result = await transcriptService.getAcademicSummary(req.user.id);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Ringkasan akademik berhasil diambil',
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Get Student Transcript (Dosen/Admin view) ---
export const getStudentTranscript = async (req, res) => {
  try {
    const { studentId } = req.params;
    const filters = {
      semester: req.query.semester,
    };
    const result = await transcriptService.getStudyResults(studentId, filters);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Transkrip mahasiswa berhasil diambil',
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};
