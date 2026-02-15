import * as courseService from './course.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

// --- Create a new course ---
export const createCourse = async (req, res) => {
  try {
    const newCourse = await courseService.createCourse(req.body, req.user.id);
    sendSuccess(res, { statusCode: 201, message: 'Kelas berhasil dibuat', data: newCourse });
  } catch (error) {
    if (error.message === 'Kode kelas sudah digunakan') {
      return sendError(res, { statusCode: 409, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Get all courses ---
export const getCourses = async (req, res) => {
  try {
    const courses = await courseService.getAllCourses();
    sendSuccess(res, { statusCode: 200, message: 'Daftar kelas berhasil diambil', data: courses });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Enroll Student to Course ---
export const enrollStudent = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { email, studentId } = req.body;

    let result;

    if (studentId) {
      result = await courseService.addStudentToCourseById(
        courseId,
        studentId,
        req.user.id,
        req.user.role
      );
    } else if (email) {
      result = await courseService.addStudentToCourse(
        courseId,
        email,
        req.user.id,
        req.user.role
      );
    } else {
      return sendError(res, { statusCode: 400, message: 'studentId atau email wajib diisi' });
    }

    sendSuccess(res, { statusCode: 201, message: 'Mahasiswa berhasil ditambahkan ke kelas', data: result });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('Akses ditolak')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    if (error.message.includes('sudah terdaftar') || error.message.includes('bukan mahasiswa')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

export const getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const includeStats = req.query.includeStats === 'true';

    let courses;
    let message;

    if (userRole === 'MAHASISWA') {
      courses = await courseService.getEnrolledCourses(userId);
      message = 'Berhasil mengambil daftar kelas yang diikuti';
    } else if (userRole === 'DOSEN') {
      if (includeStats) {
        courses = await courseService.getTeachingCoursesWithStats(userId);
      } else {
        courses = await courseService.getTeachingCourses(userId);
      }
      message = 'Berhasil mengambil daftar kelas yang diajar';
    } else if (userRole === 'ADMIN') {
      courses = await courseService.getAllCourses();
      message = 'Berhasil mengambil semua daftar kelas';
    } else {
      return sendError(res, { statusCode: 403, message: 'Role tidak dikenali' });
    }

    sendSuccess(res, { statusCode: 200, message, data: courses });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Get Students by Course ---
export const getStudentsByCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const students = await courseService.getStudentsByCourse(courseId, req.user.id, req.user.role);
    sendSuccess(res, { statusCode: 200, message: 'Daftar mahasiswa berhasil diambil', data: students });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('Akses ditolak')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Get Available Students for Enrollment ---
export const getAvailableStudents = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const students = await courseService.getAvailableStudentsForCourse(
      courseId,
      req.user.id,
      req.user.role
    );
    sendSuccess(res, { statusCode: 200, message: 'Daftar mahasiswa tersedia berhasil diambil', data: students });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('Akses ditolak')) {
      return sendError(res, { statusCode: 403, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// ========== ADMIN COURSE MANAGEMENT ==========

// --- Admin: Get All Courses ---
export const adminGetAllCourses = async (req, res) => {
  try {
    const courses = await courseService.adminGetAllCourses();
    sendSuccess(res, { statusCode: 200, message: 'Daftar semua kelas berhasil diambil', data: courses });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Admin: Create Course ---
export const adminCreateCourse = async (req, res) => {
  try {
    const newCourse = await courseService.adminCreateCourse(req.body);
    sendSuccess(res, { statusCode: 201, message: 'Kelas berhasil dibuat', data: newCourse });
  } catch (error) {
    if (error.message === 'Kode kelas sudah digunakan') {
      return sendError(res, { statusCode: 409, message: error.message });
    }
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Admin: Update Course ---
export const adminUpdateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCourse = await courseService.adminUpdateCourse(id, req.body);
    sendSuccess(res, { statusCode: 200, message: 'Kelas berhasil diperbarui', data: updatedCourse });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message === 'Kode kelas sudah digunakan') {
      return sendError(res, { statusCode: 409, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Admin: Delete Course ---
export const adminDeleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await courseService.adminDeleteCourse(id);
    sendSuccess(res, { statusCode: 200, message: result.message, data: result });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

// --- Admin: Assign Teacher to Course ---
export const adminAssignTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;
    const updatedCourse = await courseService.adminAssignTeacher(id, teacherId);
    sendSuccess(res, { statusCode: 200, message: 'Dosen berhasil ditetapkan ke kelas', data: updatedCourse });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return sendError(res, { statusCode: 404, message: error.message });
    }
    if (error.message.includes('bukan dosen')) {
      return sendError(res, { statusCode: 400, message: error.message });
    }
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};