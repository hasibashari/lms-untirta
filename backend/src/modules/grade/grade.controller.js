import * as gradeService from './grade.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// ======================== DOSEN: Get students for grading ========================
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
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('tidak berhak')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// ======================== DOSEN: Input single grade ========================
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
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('tidak berhak')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    if (
      error.message.includes('Tidak dapat') ||
      error.message.includes('sudah difinalisasi') ||
      error.message.includes('tidak terdaftar')
    ) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// ======================== DOSEN: Bulk input grades ========================
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
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('tidak berhak')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    if (
      error.message.includes('Tidak dapat') ||
      error.message.includes('sudah difinalisasi') ||
      error.message.includes('tidak terdaftar')
    ) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// ======================== DOSEN: Finalize grades ========================
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
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('tidak berhak')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    if (error.message.includes('Tidak ada')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// ======================== STUDENT: Get my grades ========================
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
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};
