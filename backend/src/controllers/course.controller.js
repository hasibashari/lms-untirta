import * as courseService from '../services/course.service.js';

// --- Create a new course ---
const createCourse = async (req, res) => {
  try {
    // req.user.id didapat dari middleware authenticateToken
    // req.body didapat dari input user (sudah divalidasi Zod)
    const newCourse = await courseService.createCourse(req.body, req.user.id);

    res.status(201).json({
      message: 'Kelas berhasil dibuat',
      data: newCourse,
    });
  } catch (error) {
    if (error.message === 'Kode kelas sudah digunakan') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// --- Get all courses ---
const getCourses = async (req, res) => {
  try {
    const courses = await courseService.getAllCourses();
    res.status(200).json({
      message: 'Daftar kelas berhasil diambil',
      data: courses,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// --- Enroll Student to Course ---
const enrollStudent = async (req, res) => {
  try {
    const { id: courseId } = req.params; // Ambil ID dari URL (/api/courses/:id/enroll)
    const { email, studentId } = req.body; // Support both email and studentId

    let result;

    // Cek apakah menggunakan studentId (cara baru) atau email (cara lama)
    if (studentId) {
      // Enroll berdasarkan studentId (lebih aman, dari dropdown)
      result = await courseService.addStudentToCourseById(
        courseId,
        studentId,
        req.user.id,
        req.user.role
      );
    } else if (email) {
      // Enroll berdasarkan email (cara lama, backward compatible)
      result = await courseService.addStudentToCourse(
        courseId,
        email,
        req.user.id,
        req.user.role
      );
    } else {
      return res.status(400).json({ message: 'studentId atau email wajib diisi' });
    }

    res.status(201).json({
      message: 'Mahasiswa berhasil ditambahkan ke kelas',
      data: result,
    });
  } catch (error) {
    // Error Handling
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Akses ditolak')) {
      return res.status(403).json({ message: error.message });
    }
    if (error.message.includes('sudah terdaftar') || error.message.includes('bukan mahasiswa')) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const includeStats = req.query.includeStats === 'true';

    let courses;
    let message;

    // Role-aware: Berbeda logic berdasarkan role user
    if (userRole === 'MAHASISWA') {
      // Mahasiswa: Ambil kelas yang diikuti (enrolled)
      courses = await courseService.getEnrolledCourses(userId);
      message = 'Berhasil mengambil daftar kelas yang diikuti';
    } else if (userRole === 'DOSEN') {
      // Dosen: Ambil kelas yang diajar (teaching)
      // Optimasi: gunakan WithStats jika diminta untuk menghindari N+1 query
      if (includeStats) {
        courses = await courseService.getTeachingCoursesWithStats(userId);
      } else {
        courses = await courseService.getTeachingCourses(userId);
      }
      message = 'Berhasil mengambil daftar kelas yang diajar';
    } else if (userRole === 'ADMIN') {
      // Admin: Ambil semua kelas
      courses = await courseService.getAllCourses();
      message = 'Berhasil mengambil semua daftar kelas';
    } else {
      return res.status(403).json({ message: 'Role tidak dikenali' });
    }

    res.status(200).json({
      message,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// --- Get Students by Course ---
const getStudentsByCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const students = await courseService.getStudentsByCourse(courseId, req.user.id, req.user.role);

    res.status(200).json({
      message: 'Daftar mahasiswa berhasil diambil',
      data: students,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Akses ditolak')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// --- Get Available Students for Enrollment ---
// Mengambil daftar mahasiswa yang belum terdaftar di kelas tertentu
const getAvailableStudents = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const students = await courseService.getAvailableStudentsForCourse(
      courseId,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      message: 'Daftar mahasiswa tersedia berhasil diambil',
      data: students,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Akses ditolak')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// ========== ADMIN COURSE MANAGEMENT ==========

// --- Admin: Get All Courses ---
const adminGetAllCourses = async (req, res) => {
  try {
    const courses = await courseService.adminGetAllCourses();
    res.status(200).json({
      message: 'Daftar semua kelas berhasil diambil',
      data: courses,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// --- Admin: Create Course ---
const adminCreateCourse = async (req, res) => {
  try {
    const newCourse = await courseService.adminCreateCourse(req.body);
    res.status(201).json({
      message: 'Kelas berhasil dibuat',
      data: newCourse,
    });
  } catch (error) {
    if (error.message === 'Kode kelas sudah digunakan') {
      return res.status(409).json({ message: error.message });
    }
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// --- Admin: Update Course ---
const adminUpdateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCourse = await courseService.adminUpdateCourse(id, req.body);
    res.status(200).json({
      message: 'Kelas berhasil diperbarui',
      data: updatedCourse,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Kode kelas sudah digunakan') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// --- Admin: Delete Course ---
const adminDeleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await courseService.adminDeleteCourse(id);
    res.status(200).json({
      message: result.message,
      deletedEnrollments: result.deletedEnrollments,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// --- Admin: Assign Teacher to Course ---
const adminAssignTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;
    const updatedCourse = await courseService.adminAssignTeacher(id, teacherId);
    res.status(200).json({
      message: 'Dosen berhasil ditetapkan ke kelas',
      data: updatedCourse,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('bukan dosen')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// ========== KRS (KARTU RENCANA STUDI) ==========

// --- Get Available Courses for KRS ---
const getAvailableCoursesForKRS = async (req, res) => {
  try {
    const semester = req.query.semester;
    const courses = await courseService.getAvailableCoursesForKRS(req.user.id, semester);
    res.status(200).json({
      message: 'Daftar mata kuliah tersedia berhasil diambil',
      data: courses,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// --- Self Enroll to Course (KRS) ---
const selfEnrollCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const result = await courseService.selfEnrollCourse(courseId, req.user.id);
    res.status(201).json({
      message: 'Berhasil mengambil mata kuliah',
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('sudah terdaftar')) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// --- Get My KRS ---
const getMyKRS = async (req, res) => {
  try {
    const semester = req.query.semester;
    const krs = await courseService.getMyKRS(req.user.id, semester);
    res.status(200).json({
      message: 'KRS berhasil diambil',
      data: krs,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// --- Get Study Results (Hasil Studi) ---
const getStudyResults = async (req, res) => {
  try {
    const result = await courseService.getStudyResults(req.user.id);
    res.status(200).json({
      message: 'Hasil studi berhasil diambil',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

export {
  createCourse,
  getCourses,
  enrollStudent,
  getMyCourses,
  getStudentsByCourse,
  getAvailableStudents,
  // Admin Course Management
  adminGetAllCourses,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  adminAssignTeacher,
  // KRS
  getAvailableCoursesForKRS,
  selfEnrollCourse,
  getMyKRS,
  getStudyResults,
};
