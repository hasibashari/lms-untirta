import academicClient from '../../grpc/clients/academic.client.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';
import { mapGrpcErrorToHttp } from '../../utils/mapGrpcErrorToHttp.js';

const promisifyGrpc = (client, method, arg) => {
  return new Promise((resolve, reject) => {
    client[method](arg, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
};

export const getAll = async (req, res) => {
  try {
    const result = await promisifyGrpc(academicClient, 'GetAllSemesters', {});
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar semester akademik berhasil diambil',
      data: result.semesters,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

export const getActive = async (req, res) => {
  try {
    const result = await promisifyGrpc(academicClient, 'GetActiveSemester', {});
    sendSuccess(res, {
      statusCode: 200,
      message: result.semester ? 'Semester aktif berhasil diambil' : 'Tidak ada semester aktif',
      data: result.semester,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

export const getById = async (req, res) => {
  try {
    const result = await promisifyGrpc(academicClient, 'GetSemesterById', { id: req.params.id });
    sendSuccess(res, {
      statusCode: 200,
      message: 'Detail semester berhasil diambil',
      data: result.semester,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

export const create = async (req, res) => {
  try {
    const result = await promisifyGrpc(academicClient, 'CreateSemester', req.body);
    sendSuccess(res, {
      statusCode: 201,
      message: `Semester ${result.semester.semesterType} ${result.semester.academicYear} berhasil dibuat`,
      data: result.semester,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

export const update = async (req, res) => {
  try {
    const result = await promisifyGrpc(academicClient, 'UpdateSemester', { id: req.params.id, ...req.body });
    sendSuccess(res, {
      statusCode: 200,
      message: 'Semester berhasil diperbarui',
      data: result.semester,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

export const updateStatus = async (req, res) => {
  try {
    const result = await promisifyGrpc(academicClient, 'UpdateStatus', { id: req.params.id, newStatus: req.body.status });
    sendSuccess(res, {
      statusCode: 200,
      message: `Status semester berhasil diubah ke ${req.body.status}`,
      data: result.semester,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

export const getClosingReadiness = async (req, res) => {
  try {
    const result = await promisifyGrpc(academicClient, 'GetClosingReadiness', { id: req.params.id });
    sendSuccess(res, {
      statusCode: 200,
      message: 'Status kesiapan penutupan semester berhasil diambil',
      data: result,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

export const remove = async (req, res) => {
  try {
    const result = await promisifyGrpc(academicClient, 'DeleteSemester', { id: req.params.id });
    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

export const getStudentSemesters = async (req, res) => {
  try {
    const result = await promisifyGrpc(academicClient, 'GetStudentSemesters', { studentId: req.user.id });
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar semester mahasiswa berhasil diambil',
      data: result.semesters,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};
