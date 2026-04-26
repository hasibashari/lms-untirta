import classClient from '../../grpc/clients/class.client.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';
import { mapGrpcErrorToHttp } from '../../utils/mapGrpcErrorToHttp.js';
import util from 'util';

const grpcCreateClass = util.promisify(classClient.CreateClass).bind(classClient);
const grpcGetAllClasses = util.promisify(classClient.GetAllClasses).bind(classClient);
const grpcGetClassById = util.promisify(classClient.GetClassById).bind(classClient);
const grpcGetClassesByLecturer = util.promisify(classClient.GetClassesByLecturer).bind(classClient);
const grpcGetClassesByCourse = util.promisify(classClient.GetClassesByCourse).bind(classClient);
const grpcGetOpenClasses = util.promisify(classClient.GetOpenClasses).bind(classClient);
const grpcUpdateClass = util.promisify(classClient.UpdateClass).bind(classClient);
const grpcToggleEnrollment = util.promisify(classClient.ToggleEnrollment).bind(classClient);
const grpcDeleteClass = util.promisify(classClient.DeleteClass).bind(classClient);

// ======================== CREATE ========================

export const create = async (req, res) => {
  try {
    const result = await grpcCreateClass(req.body);
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
    const result = await grpcGetAllClasses({
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
    const result = await grpcGetClassById({ id: req.params.id });
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
    const result = await grpcGetClassesByLecturer({
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
    const result = await grpcGetClassesByCourse({
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
    const result = await grpcGetOpenClasses({
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
    const result = await grpcUpdateClass({
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
    const result = await grpcToggleEnrollment({
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
    const result = await grpcDeleteClass({ id: req.params.id });
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
