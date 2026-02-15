import * as krsService from './krs.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// ======================== NEW KRS (CLASS-BASED) ========================

// --- Get Available Classes for KRS ---
export const getAvailableClasses = async (req, res) => {
  try {
    const filters = {
      academicYear: req.query.academicYear,
      semesterType: req.query.semesterType,
      semester: req.query.semester,
    };
    const classes = await krsService.getAvailableClasses(req.user.id, filters);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar kelas tersedia berhasil diambil',
      data: classes,
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
    if (
      error.message.includes('belum dibuka') ||
      error.message.includes('penuh') ||
      error.message.includes('melebihi batas')
    ) {
      return sendError(res, { statusCode: 400, message: error.message });
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
      academicYear: req.query.academicYear,
      semesterType: req.query.semesterType,
    };
    const krs = await krsService.getMyKRS(req.user.id, filters);
    sendSuccess(res, {
      statusCode: 200,
      message: 'KRS berhasil diambil',
      data: krs,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Submit KRS ---
export const submitKRS = async (req, res) => {
  try {
    const { academicYear, semesterType } = req.body;
    const result = await krsService.submitKRS(req.user.id, academicYear, semesterType);
    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result,
    });
  } catch (error) {
    if (error.message.includes('Tidak ada')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Update Enrollment Status (Dosen/Admin) ---
export const updateEnrollmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const result = await krsService.updateEnrollmentStatus(id, status, note);

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
    if (error.message.includes('Tidak dapat mengubah')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Get Pending KRS (Dosen/Admin) ---
export const getPendingKRS = async (req, res) => {
  try {
    const filters = {
      academicYear: req.query.academicYear,
      semesterType: req.query.semesterType,
    };
    const result = await krsService.getPendingKRS(filters);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar KRS menunggu persetujuan berhasil diambil',
      data: result,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// ======================== LEGACY COMPAT ========================
// Endpoint lama agar frontend yang masih pakai /courses/* tetap berjalan.

// --- Get Available Courses (Legacy) ---
export const getAvailableCoursesForKRS = async (req, res) => {
  try {
    const semester = req.query.semester;
    const courses = await krsService.getAvailableCoursesLegacy(req.user.id, semester);
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar mata kuliah tersedia berhasil diambil',
      data: courses,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Self Enroll (Legacy) ---
export const selfEnrollCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const result = await krsService.selfEnrollCourseLegacy(courseId, req.user.id);
    sendSuccess(res, {
      statusCode: 201,
      message: 'Berhasil mengambil mata kuliah',
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('sudah terdaftar')) {
      return sendError(res, { statusCode: 409, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Self Unenroll (Legacy) ---
export const selfUnenrollCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const result = await krsService.selfUnenrollCourseLegacy(courseId, req.user.id);
    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak terdaftar')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Get My KRS (Legacy) ---
export const getMyKRSLegacy = async (req, res) => {
  try {
    const semester = req.query.semester;
    const krs = await krsService.getMyKRSLegacy(req.user.id, semester);
    sendSuccess(res, {
      statusCode: 200,
      message: 'KRS berhasil diambil',
      data: krs,
    });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};
