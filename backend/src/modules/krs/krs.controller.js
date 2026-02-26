import * as krsService from './krs.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// ======================== NEW KRS (CLASS-BASED) ========================

// --- Get Available Classes for KRS ---
export const getAvailableClasses = async (req, res) => {
  try {
    const filters = {
      academicSemesterId: req.query.academicSemesterId,
      semester: req.query.semester,
    };
    const result = await krsService.getAvailableClasses(req.user.id, filters);
    sendSuccess(res, {
      statusCode: 200,
      message: result.classes.length > 0
        ? 'Daftar kelas tersedia berhasil diambil'
        : 'Tidak ada kelas tersedia saat ini',
      data: result.classes,
      _meta: result._meta,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Enroll to Class (KRS) ---
export const enrollClass = async (req, res) => {
  try {
    const result = await krsService.enrollClass(req.user.id, req.body.classId);
    sendSuccess(res, {
      statusCode: 201,
      message: 'Berhasil menambahkan kelas ke KRS',
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('sudah terdaftar') || error.message.includes('sudah mengambil')) {
      return sendError(res, { statusCode: 409, message: error.message });
    }
    if (error.code === 'SKS_LIMIT_EXCEEDED') {
      return res.status(409).json({
        success: false,
        message: error.message,
        code: 'SKS_LIMIT_EXCEEDED',
        details: error.details,
      });
    }
    if (
      error.message.includes('belum dibuka') ||
      error.message.includes('penuh')
    ) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    if (error.message.includes('sudah ditutup') || error.message.includes('belum dimulai') || error.message.includes('sudah berakhir')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Drop Class from KRS ---
export const dropClass = async (req, res) => {
  try {
    const result = await krsService.dropClass(req.user.id, req.params.classId);
    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak terdaftar')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('Tidak dapat')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Get My KRS ---
export const getMyKRS = async (req, res) => {
  try {
    const filters = {
      academicSemesterId: req.query.academicSemesterId,
    };
    const krs = await krsService.getMyKRS(req.user.id, filters);
    sendSuccess(res, {
      statusCode: 200,
      message: 'KRS berhasil diambil',
      data: krs,
    });
  } catch (error) {
    console.error('getMyKRS error:', error);
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Update Enrollment Status (Dospem only) ---
export const updateEnrollmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const result = await krsService.updateEnrollmentStatus(id, status, note, req.user);

    const statusLabel = status === 'APPROVED' ? 'disetujui' : 'ditolak';
    sendSuccess(res, {
      statusCode: 200,
      message: `KRS berhasil ${statusLabel}`,
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('Tidak dapat mengubah') || error.message.includes('Kapasitas')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    if (
      error.message.includes('bukan Dosen') ||
      error.message.includes('tidak terdaftar') ||
      error.message.includes('tidak dapat') ||
      error.message.includes('wajib memberikan') ||
      error.message.includes('Wajib memberikan') ||
      error.message.includes('Hanya Dosen Pembimbing')
    ) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    if (error.message.includes('belum dibuka') || error.message.includes('sudah ditutup') || error.message.includes('sudah berakhir')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Bulk Update Enrollment Status (Dospem only) ---
export const bulkUpdateEnrollmentStatus = async (req, res) => {
  try {
    const { enrollmentIds, status, note } = req.body;
    const result = await krsService.bulkUpdateEnrollmentStatus(enrollmentIds, status, note, req.user);

    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan') || error.message.includes('bukan mahasiswa')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('tidak dapat') || error.message.includes('Tidak ada') || error.message.includes('Maksimal')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    if (
      error.message.includes('bukan') ||
      error.message.includes('tidak terdaftar') ||
      error.message.includes('Wajib memberikan') ||
      error.message.includes('Hanya Dosen Pembimbing')
    ) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    if (error.message.includes('belum dibuka') || error.message.includes('sudah ditutup') || error.message.includes('sudah berakhir')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Get Pending KRS (Dospem/Admin) ---
export const getPendingKRS = async (req, res) => {
  try {
    const filters = {
      academicSemesterId: req.query.academicSemesterId,
    };
    const result = await krsService.getPendingKRS(filters, req.user);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar KRS menunggu persetujuan berhasil diambil',
      data: result,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Get Advisory Students (Dospem) ---
export const getAdvisoryStudents = async (req, res) => {
  try {
    const filters = {
      academicSemesterId: req.query.academicSemesterId,
    };
    const result = await krsService.getAdvisoryStudents(req.user.id, filters);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar mahasiswa bimbingan berhasil diambil',
      data: result,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- KRS Monitoring (Admin) ---
export const getKrsMonitoring = async (req, res) => {
  try {
    const filters = {
      academicSemesterId: req.query.academicSemesterId,
    };
    const result = await krsService.getKrsMonitoring(filters);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Data monitoring KRS berhasil diambil',
      data: result,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// ======================== REVISE & HISTORY ========================

// --- Revise Rejected KRS ---
export const reviseEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await krsService.reviseRejectedEnrollment(req.user.id, id);
    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('Hanya KRS yang ditolak')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    if (error.message.includes('belum dibuka') || error.message.includes('sudah ditutup') || error.message.includes('belum dimulai') || error.message.includes('sudah berakhir')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Get Approval History ---
export const getApprovalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await krsService.getApprovalHistory(id, req.user);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Riwayat approval KRS berhasil diambil',
      data: logs,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('tidak memiliki akses') || error.message.includes('bukan Dosen')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Get SKS Eligibility Info ---
export const getSksEligibility = async (req, res) => {
  try {
    const result = await krsService.getSksEligibility(
      req.user.id,
      req.query.academicSemesterId
    );
    sendSuccess(res, {
      statusCode: 200,
      message: 'Info kelayakan SKS berhasil diambil',
      data: result,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};
