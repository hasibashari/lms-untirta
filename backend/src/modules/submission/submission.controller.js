import submissionClient from '../../grpc/clients/submission.client.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';
import { mapGrpcErrorToHttp } from '../../utils/mapGrpcErrorToHttp.js';
import { persistUploadMeta, cleanupFile } from '../../services/upload.service.js';
import { buildFileUrl } from '../../middlewares/upload.middleware.js';
import { createGrpcMetadata } from '../../grpc/helpers/metadata.helper.js';
import util from 'util';

const grpcSubmitAssignment = util.promisify(submissionClient.SubmitAssignment).bind(submissionClient);
const grpcGetAssignmentWithMySubmission = util.promisify(submissionClient.GetAssignmentWithMySubmission).bind(submissionClient);
const grpcGetSubmissionsByAssignment = util.promisify(submissionClient.GetSubmissionsByAssignment).bind(submissionClient);
const grpcGetAllMyGrades = util.promisify(submissionClient.GetAllMyGrades).bind(submissionClient);
const grpcGradeSubmission = util.promisify(submissionClient.GradeSubmission).bind(submissionClient);

// ======= SUBMIT ASSIGNMENT =======
export const submit = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    // Validate that a file is uploaded
    if (!req.file) {
      return sendError(res, { statusCode: 400, message: 'File tugas wajib diunggah' });
    }

    // Persist metadata and generate the URL
    await persistUploadMeta({ userId: req.user.id, file: req.file });
    const fileUrl = buildFileUrl(req, req.file.filename, 'submission');
    const meta = createGrpcMetadata(req);

    const result = await grpcSubmitAssignment({
      assignmentId,
      studentId,
      ...req.body,
      fileUrl,
    }, meta);

    sendSuccess(res, {
      statusCode: 201,
      message: result.message,
      data: result.submission,
    });
  } catch (error) {
    console.error('SUBMISSION_CONTROLLER_ERROR:', error);
    if (req.file) await cleanupFile(req.file.path);
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

// ======= GET ASSIGNMENT WITH STUDENT SUBMISSION =======
export const getMyAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;
    const meta = createGrpcMetadata(req);

    const result = await grpcGetAssignmentWithMySubmission({
      assignmentId,
      studentId,
    }, meta);

    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

// ======= GET SUBMISSIONS BY ASSIGNMENT =======
export const getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user.id;
    const meta = createGrpcMetadata(req);

    const result = await grpcGetSubmissionsByAssignment({
      assignmentId,
      teacherId,
    }, meta);

    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

// ======= GET ALL STUDENT GRADES =======
export const getAllMyGrades = async (req, res) => {
  try {
    const studentId = req.user.id;
    const meta = createGrpcMetadata(req);

    const result = await grpcGetAllMyGrades({
      studentId,
    }, meta);

    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};


// ======= GRADE STUDENT SUBMISSION =======
export const grade = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const teacherId = req.user.id;
    const meta = createGrpcMetadata(req);

    const result = await grpcGradeSubmission({
      submissionId,
      teacherId,
      ...req.body,
    }, meta);

    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};


// ======= GET RECENT SUBMISSIONS FOR TEACHER =======
export const getRecentSubmissions = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const meta = createGrpcMetadata(req);

    const result = await grpcGetRecentSubmissionsForTeacher({
      teacherId,
      limit,
    }, meta);

    sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};


