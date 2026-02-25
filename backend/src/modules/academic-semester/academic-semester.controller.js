import * as semesterService from './academic-semester.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

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

export const updateStatus = async (req, res) => {
  try {
    const semester = await semesterService.updateStatus(
      req.params.id,
      req.body.status,
      req.user.id,
      req.body.reason || null,
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
    if (error.message.includes('Tidak dapat') || error.message.includes('Alasan wajib')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

export const getCompletionReadiness = async (req, res) => {
  try {
    const readiness = await semesterService.getCompletionReadiness(req.params.id);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Status kesiapan semester berhasil diambil',
      data: readiness,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

export const setActive = async (req, res) => {
  try {
    const semester = await semesterService.setActive(req.params.id);
    sendSuccess(res, {
      statusCode: 200,
      message: `Semester ${semester.semesterType} ${semester.academicYear} ditetapkan sebagai semester aktif`,
      data: semester,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

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

export const getStatusLogs = async (req, res) => {
  try {
    const logs = await semesterService.getStatusLogs(req.params.id);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Riwayat perubahan status berhasil diambil',
      data: logs,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

export const getRollbackImpact = async (req, res) => {
  try {
    const { fromStatus, toStatus } = req.query;
    if (!fromStatus || !toStatus) {
      return sendError(res, {
        statusCode: 400,
        message: 'Parameter fromStatus dan toStatus wajib diisi',
      });
    }
    const impact = await semesterService.getRollbackImpact(
      req.params.id,
      fromStatus,
      toStatus
    );
    sendSuccess(res, {
      statusCode: 200,
      message: 'Rollback impact preview berhasil diambil',
      data: impact,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

