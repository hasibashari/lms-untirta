import * as krsService from './krs.service.js';
import { sendSuccess } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';

// ======================== NEW KRS (CLASS-BASED) ========================

export const getAvailableClasses = async (req, res) => {
  try {
    const filters = {
      academicSemesterId: req.query.academicSemesterId,
      semester: req.query.semester,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
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
    return handleError(res, error);
  }
};

export const enrollClass = async (req, res) => {
  try {
    const result = await krsService.enrollClass(req.user.id, req.body.classId);
    sendSuccess(res, {
      statusCode: 201,
      message: 'Berhasil menambahkan kelas ke KRS',
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const dropClass = async (req, res) => {
  try {
    const result = await krsService.dropClass(req.user.id, req.params.classId);
    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

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
    return handleError(res, error);
  }
};

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
    return handleError(res, error);
  }
};

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
    return handleError(res, error);
  }
};

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
    return handleError(res, error);
  }
};

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
    return handleError(res, error);
  }
};

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
    return handleError(res, error);
  }
};

// ======================== REVISE & HISTORY ========================

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
    return handleError(res, error);
  }
};

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
    return handleError(res, error);
  }
};

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
    return handleError(res, error);
  }
};
