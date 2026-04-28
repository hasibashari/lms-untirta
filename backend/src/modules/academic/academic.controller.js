import academicClient from '../../grpc/clients/academic.client.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';
import { mapGrpcErrorToHttp } from '../../utils/mapGrpcErrorToHttp.js';
import { createGrpcMetadata } from '../../grpc/helpers/metadata.helper.js';
import util from 'util';

const grpcGetAllSemesters = util.promisify(academicClient.GetAllSemesters).bind(academicClient);
const grpcGetActiveSemester = util.promisify(academicClient.GetActiveSemester).bind(academicClient);
const grpcGetSemesterById = util.promisify(academicClient.GetSemesterById).bind(academicClient);
const grpcCreateSemester = util.promisify(academicClient.CreateSemester).bind(academicClient);
const grpcUpdateSemester = util.promisify(academicClient.UpdateSemester).bind(academicClient);
const grpcUpdateStatus = util.promisify(academicClient.UpdateStatus).bind(academicClient);
const grpcGetClosingReadiness = util.promisify(academicClient.GetClosingReadiness).bind(academicClient);
const grpcDeleteSemester = util.promisify(academicClient.DeleteSemester).bind(academicClient);
const grpcGetStudentSemesters = util.promisify(academicClient.GetStudentSemesters).bind(academicClient);

export const getAll = async (req, res) => {
  try {
    const meta = createGrpcMetadata(req);
    const result = await grpcGetAllSemesters({}, meta);
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
    const meta = createGrpcMetadata(req);
    const result = await grpcGetActiveSemester({}, meta);
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
    const meta = createGrpcMetadata(req);
    const result = await grpcGetSemesterById({ id: req.params.id }, meta);
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
    const meta = createGrpcMetadata(req);
    const result = await grpcCreateSemester(req.body, meta);
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
    const meta = createGrpcMetadata(req);
    const result = await grpcUpdateSemester({ id: req.params.id, ...req.body }, meta);
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
    const meta = createGrpcMetadata(req);
    const result = await grpcUpdateStatus({ id: req.params.id, newStatus: req.body.status }, meta);
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
    const meta = createGrpcMetadata(req);
    const result = await grpcGetClosingReadiness({ id: req.params.id }, meta);
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
    const meta = createGrpcMetadata(req);
    const result = await grpcDeleteSemester({ id: req.params.id }, meta);
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
    const meta = createGrpcMetadata(req);
    const result = await grpcGetStudentSemesters({ studentId: req.user.id }, meta);
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
