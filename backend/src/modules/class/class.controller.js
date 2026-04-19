import classClient from '../../grpc/clients/class.client.js';
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

// ======================== CREATE ========================

export const create = async (req, res) => {
  try {
    const result = await promisifyGrpc(classClient, 'CreateClass', req.body);
    sendSuccess(res, {
      statusCode: 201,
      message: 'Kelas offering berhasil dibuat',
      data: result.class,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

// ======================== READ ========================

export const getAll = async (req, res) => {
  try {
    const result = await promisifyGrpc(classClient, 'GetAllClasses', {
      page: req.query.page || '1',
      limit: req.query.limit || '10',
      academicSemesterId: req.query.academicSemesterId || '',
      courseId: req.query.courseId || '',
    });
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar kelas offering berhasil diambil',
      data: result.classes,
      pagination: result.pagination,
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
    const result = await promisifyGrpc(classClient, 'GetClassById', { id: req.params.id });
    sendSuccess(res, {
      statusCode: 200,
      message: 'Detail kelas offering berhasil diambil',
      data: result.class,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

export const getMyClasses = async (req, res) => {
  try {
    const result = await promisifyGrpc(classClient, 'GetClassesByLecturer', {
      lecturerId: req.user.id,
      academicSemesterId: req.query.academicSemesterId || '',
    });
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar kelas yang diajar berhasil diambil',
      data: result.classes,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

export const getByCourse = async (req, res) => {
  try {
    const result = await promisifyGrpc(classClient, 'GetClassesByCourse', {
      courseId: req.params.courseId,
      academicSemesterId: req.query.academicSemesterId || '',
    });
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar kelas offering untuk mata kuliah berhasil diambil',
      data: result.classes,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

export const getOpen = async (req, res) => {
  try {
    const result = await promisifyGrpc(classClient, 'GetOpenClasses', {
      academicSemesterId: req.query.academicSemesterId || '',
      courseId: req.query.courseId || '',
    });
    sendSuccess(res, {
      statusCode: 200,
      message: 'Daftar kelas offering yang buka pendaftaran berhasil diambil',
      data: result.classes,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

// ======================== UPDATE ========================

export const update = async (req, res) => {
  try {
    const result = await promisifyGrpc(classClient, 'UpdateClass', {
      id: req.params.id,
      ...req.body,
    });
    sendSuccess(res, {
      statusCode: 200,
      message: 'Kelas offering berhasil diperbarui',
      data: result.class,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

export const toggleEnrollment = async (req, res) => {
  try {
    const { isEnrollmentOpen } = req.body;
    const result = await promisifyGrpc(classClient, 'ToggleEnrollment', {
      id: req.params.id,
      isEnrollmentOpen,
    });
    const status = isEnrollmentOpen ? 'dibuka' : 'ditutup';
    sendSuccess(res, {
      statusCode: 200,
      message: `Pendaftaran kelas berhasil ${status}`,
      data: result.class,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

// ======================== DELETE ========================

export const remove = async (req, res) => {
  try {
    const result = await promisifyGrpc(classClient, 'DeleteClass', { id: req.params.id });
    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: { deletedId: result.deletedId },
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};
