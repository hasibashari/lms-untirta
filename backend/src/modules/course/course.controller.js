import courseClient from '../../grpc/clients/course.client.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { handleError } from '../../utils/errorHandler.js';
import { mapGrpcErrorToHttp } from '../../utils/mapGrpcErrorToHttp.js';
import { createGrpcMetadata } from '../../grpc/helpers/metadata.helper.js';
import util from 'util';

const grpcAddStudentToCourseById = util.promisify(courseClient.AddStudentToCourseById).bind(courseClient);
const grpcAddStudentToCourse = util.promisify(courseClient.AddStudentToCourse).bind(courseClient);
const grpcGetEnrolledCourses = util.promisify(courseClient.GetEnrolledCourses).bind(courseClient);
const grpcGetTeachingCourses = util.promisify(courseClient.GetTeachingCourses).bind(courseClient);
const grpcAdminGetAllCourses = util.promisify(courseClient.AdminGetAllCourses).bind(courseClient);
const grpcGetStudentsByCourse = util.promisify(courseClient.GetStudentsByCourse).bind(courseClient);
const grpcGetAvailableStudentsForCourse = util.promisify(courseClient.GetAvailableStudentsForCourse).bind(courseClient);
const grpcAdminCreateCourse = util.promisify(courseClient.AdminCreateCourse).bind(courseClient);
const grpcAdminUpdateCourse = util.promisify(courseClient.AdminUpdateCourse).bind(courseClient);
const grpcAdminDeleteCourse = util.promisify(courseClient.AdminDeleteCourse).bind(courseClient);
const grpcAdminAssignTeacher = util.promisify(courseClient.AdminAssignTeacher).bind(courseClient);

export const enrollStudent = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { email, studentId } = req.body;
    const meta = createGrpcMetadata(req);

    let result;

    if (studentId) {
      result = await grpcAddStudentToCourseById({
        courseId,
        studentId,
        teacherId: req.user.id,
        teacherRole: req.user.role
      }, meta);
    } else if (email) {
      result = await grpcAddStudentToCourse({
        courseId,
        studentEmail: email,
        teacherId: req.user.id,
        teacherRole: req.user.role
      }, meta);
    } else {
      return sendError(res, { statusCode: 400, message: 'studentId atau email wajib diisi' });
    }

    sendSuccess(res, { statusCode: 201, message: 'Mahasiswa berhasil ditambahkan ke kelas', data: result });
  } catch (error) {
    if (error.code) {
      const httpCode = mapGrpcErrorToHttp(error.code);
      return sendError(res, { statusCode: httpCode, message: error.details });
    }
    return handleError(res, error);
  }
};

export const getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const includeStats = req.query.includeStats === 'true';
    const meta = createGrpcMetadata(req);

    let courses;
    let message;
    let pagination;

    if (userRole === 'MAHASISWA') {
      const result = await grpcGetEnrolledCourses({ studentId: userId }, meta);
      courses = result.courses;
      message = 'Berhasil mengambil daftar kelas yang diikuti';
    } else if (userRole === 'DOSEN') {
      const result = await grpcGetTeachingCourses({ teacherId: userId }, meta);
      courses = result.courses;
      message = 'Berhasil mengambil daftar kelas yang diajar';
    } else if (userRole === 'ADMIN') {
      const result = await grpcAdminGetAllCourses({
        page: req.query.page ? parseInt(req.query.page, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined
      }, meta);
      courses = result.data;
      pagination = result.pagination;
      message = 'Berhasil mengambil semua kelas';
    } else {
      return sendError(res, { statusCode: 403, message: 'Role tidak dikenali' });
    }

    sendSuccess(res, { statusCode: 200, message, data: courses, pagination });
  } catch (error) {
    if (error.code) {
      const httpCode = mapGrpcErrorToHttp(error.code);
      return sendError(res, { statusCode: httpCode, message: error.details });
    }
    return handleError(res, error);
  }
};

export const getStudentsByCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const meta = createGrpcMetadata(req);
    const result = await grpcGetStudentsByCourse({
      courseId,
      userId: req.user.id,
      userRole: req.user.role
    }, meta);
    sendSuccess(res, { statusCode: 200, message: 'Daftar mahasiswa berhasil diambil', data: result.enrollments });
  } catch (error) {
    if (error.code) {
      const httpCode = mapGrpcErrorToHttp(error.code);
      return sendError(res, { statusCode: httpCode, message: error.details });
    }
    return handleError(res, error);
  }
};

export const getAvailableStudents = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const meta = createGrpcMetadata(req);
    const result = await grpcGetAvailableStudentsForCourse({
      courseId,
      userId: req.user.id,
      userRole: req.user.role
    }, meta);
    sendSuccess(res, { statusCode: 200, message: 'Daftar mahasiswa tersedia berhasil diambil', data: result.students });
  } catch (error) {
    if (error.code) {
      const httpCode = mapGrpcErrorToHttp(error.code);
      return sendError(res, { statusCode: httpCode, message: error.details });
    }
    return handleError(res, error);
  }
};

export const adminGetAllCourses = async (req, res) => {
  try {
    const meta = createGrpcMetadata(req);
    const result = await grpcAdminGetAllCourses({
      page: req.query.page ? parseInt(req.query.page, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
      search: req.query.search || undefined,
      semester: req.query.semester ? parseInt(req.query.semester, 10) : undefined
    }, meta);
    sendSuccess(res, { statusCode: 200, message: 'Daftar semua kelas berhasil diambil', data: result.data, pagination: result.pagination });
  } catch (error) {
    if (error.code) {
      const httpCode = mapGrpcErrorToHttp(error.code);
      return sendError(res, { statusCode: httpCode, message: error.details });
    }
    return handleError(res, error);
  }
};

export const adminCreateCourse = async (req, res) => {
  try {
    const data = req.body;
    const meta = createGrpcMetadata(req);
    const newCourse = await grpcAdminCreateCourse(data, meta);
    sendSuccess(res, { statusCode: 201, message: 'Kelas berhasil dibuat', data: newCourse });
  } catch (error) {
    if (error.code) {
      const httpCode = mapGrpcErrorToHttp(error.code);
      return sendError(res, { statusCode: httpCode, message: error.details });
    }
    return handleError(res, error);
  }
};

export const adminUpdateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { courseId: id, ...req.body };
    const meta = createGrpcMetadata(req);
    const updatedCourse = await grpcAdminUpdateCourse(data, meta);
    sendSuccess(res, { statusCode: 200, message: 'Kelas berhasil diperbarui', data: updatedCourse });
  } catch (error) {
    if (error.code) {
      const httpCode = mapGrpcErrorToHttp(error.code);
      return sendError(res, { statusCode: httpCode, message: error.details });
    }
    return handleError(res, error);
  }
};

export const adminDeleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const meta = createGrpcMetadata(req);
    const result = await grpcAdminDeleteCourse({ courseId: id }, meta);
    sendSuccess(res, { statusCode: 200, message: result.message, data: result });
  } catch (error) {
    if (error.code) {
      const httpCode = mapGrpcErrorToHttp(error.code);
      return sendError(res, { statusCode: httpCode, message: error.details });
    }
    return handleError(res, error);
  }
};

export const adminAssignTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;
    const meta = createGrpcMetadata(req);
    const updatedCourse = await grpcAdminAssignTeacher({ courseId: id, teacherId }, meta);
    sendSuccess(res, { statusCode: 200, message: 'Dosen berhasil ditetapkan ke kelas', data: updatedCourse });
  } catch (error) {
    if (error.code) {
      const httpCode = mapGrpcErrorToHttp(error.code);
      return sendError(res, { statusCode: httpCode, message: error.details });
    }
    return handleError(res, error);
  }
};