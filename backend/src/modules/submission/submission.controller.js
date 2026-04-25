import submissionClient from '../../grpc/clients/submission.client.js';
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

// ======= SUBMIT ASSIGNMENT =======
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    const result = await promisifyGrpc(submissionClient, 'SubmitAssignment', {
      assignmentId,
      studentId,
      ...req.body,
    });

    sendSuccess(res, {
      statusCode: 201,
      message: result.message,
      data: result.submission,
    });
  } catch (error) {
    if (error.code) {
      return sendError(res, { statusCode: mapGrpcErrorToHttp(error.code), message: error.details });
    }
    return handleError(res, error);
  }
};

// ======= GET ASSIGNMENT WITH STUDENT SUBMISSION =======
const getAssignmentWithMySubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    const result = await promisifyGrpc(submissionClient, 'GetAssignmentWithMySubmission', {
      assignmentId,
      studentId,
    });

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
const getSubmissionsByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user.id;

    const result = await promisifyGrpc(submissionClient, 'GetSubmissionsByAssignment', {
      assignmentId,
      teacherId,
    });

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
const getAllMyGrades = async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await promisifyGrpc(submissionClient, 'GetAllMyGrades', {
      studentId,
    });

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

// ======= GET STUDENT DASHBOARD STATS =======
const getMyDashboardStats = async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await promisifyGrpc(submissionClient, 'GetMyDashboardStats', {
      studentId,
    });

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
const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const teacherId = req.user.id;

    const result = await promisifyGrpc(submissionClient, 'GradeSubmission', {
      submissionId,
      teacherId,
      ...req.body,
    });

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

// ======= GET TEACHER DASHBOARD STATS =======
const getTeacherDashboardStats = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const result = await promisifyGrpc(submissionClient, 'GetTeacherDashboardStats', {
      teacherId,
    });

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
const getRecentSubmissionsForTeacher = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const result = await promisifyGrpc(submissionClient, 'GetRecentSubmissionsForTeacher', {
      teacherId,
      limit,
    });

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

export {
  submitAssignment,
  getAssignmentWithMySubmission,
  getSubmissionsByAssignment,
  getAllMyGrades,
  getMyDashboardStats,
  gradeSubmission,
  getTeacherDashboardStats,
  getRecentSubmissionsForTeacher,
};
