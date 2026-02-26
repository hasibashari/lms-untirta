import * as courseService from './course.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Creates a new course.
 * Typically used by Teachers or Admins to initialize a new subject.
 * @param {import('express').Request} req - Express request object. Expects course details in body.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves all courses available in the system.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export const getCourses = async (req, res) => {
  try {
    const courses = await courseService.getAllCourses();
    sendSuccess(res, { statusCode: 200, message: 'Daftar kelas berhasil diambil', data: courses });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Enrolls a student into a specific course.
 * Supports enrollment by `studentId` or `email`.
 * @param {import('express').Request} req - Express request object. Expects `id` in params and student identifier in body.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves courses relevant to the authenticated user based on their role.
 * - Students: Courses they are enrolled in.
 * - Teachers: Courses they are teaching (optionally with stats).
 * - Admins: All courses.
 */
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

/**
 * Retrieves the list of students enrolled in a specific course.
 * @param {import('express').Request} req - Express request object. Expects `id` in params.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves a list of students who are NOT yet enrolled in a specific course.
 * Useful for populating an "Add Student" dropdown.
 * @param {import('express').Request} req - Express request object. Expects `id` in params.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Retrieves all courses with detailed administrative information.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export const adminGetAllCourses = async (req, res) => {
  try {
    const courses = await courseService.adminGetAllCourses();
    sendSuccess(res, { statusCode: 200, message: 'Daftar semua kelas berhasil diambil', data: courses });
  } catch (error) {
    sendError(res, { statusCode: 500, message: 'Internal Server Error' });
  }
};

/**
 * Creates a new course with administrative privileges.
 * Allows setting the teacher explicitly during creation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Updates an existing course with administrative privileges.
 * @param {import('express').Request} req - Express request object. Expects `id` in params.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Deletes a course and all associated data (enrollments, materials, assignments).
 * @param {import('express').Request} req - Express request object. Expects `id` in params.
 * @param {import('express').Response} res - Express response object.
 */
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

/**
 * Assigns a specific teacher to a course.
 * @param {import('express').Request} req - Express request object. Expects `id` in params and `teacherId` in body.
 * @param {import('express').Response} res - Express response object.
 */
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