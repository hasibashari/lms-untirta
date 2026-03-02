import * as krsService from './krs.service.js';
import { sendSuccess } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';

// ======================== NEW KRS (CLASS-BASED) ========================

/**
 * Retrieves classes available for KRS enrollment for the authenticated student.
 * Filters classes based on enrollment status, capacity, and student's current plan.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
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
    return handleError(res, error);
  }
};

/**
 * Enrolls the authenticated student into a selected class for their KRS.
 * Performs validation for SKS limits, class capacity, and duplicates.
 * @param {import('express').Request} req - Express request object. Expects `classId` in body.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Drops a class from the authenticated student's KRS.
 * Only possible for classes that are not yet approved.
 * @param {import('express').Request} req - Express request object. Expects `classId` in params.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves the current KRS (study plan) for the authenticated student.
 * Can be filtered by academic semester.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Updates the status of a single KRS enrollment (e.g., to APPROVED or REJECTED).
 * This action is restricted to the student's academic advisor (Dospem) or an Admin.
 * @param {import('express').Request} req - Express request object. Expects enrollment `id` in params and status data in body.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Updates the status of multiple KRS enrollments in a single batch.
 * Restricted to the academic advisor or an Admin.
 * @param {import('express').Request} req - Express request object. Expects an array of `enrollmentIds` and status data in body.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves a list of KRS enrollments that are awaiting approval.
 * For advisors, it shows only their advisees. For Admins, it shows all.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves the list of students assigned to the authenticated academic advisor.
 * Includes a summary of each student's KRS status for the selected semester.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves a comprehensive list of all KRS enrollments for monitoring purposes.
 * This endpoint is restricted to Admins.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Allows a student to resubmit a rejected KRS enrollment.
 * This action changes the status from REJECTED back to PENDING.
 * @param {import('express').Request} req - Express request object. Expects enrollment `id` in params.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves the approval history (audit log) for a specific KRS enrollment.
 * Accessible by the student, their advisor, or an Admin.
 * @param {import('express').Request} req - Express request object. Expects enrollment `id` in params.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves the SKS (credit) eligibility for the authenticated student.
 * Shows the maximum allowed SKS and the current total taken.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
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
