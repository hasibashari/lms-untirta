import * as courseService from '../services/courseService.js';

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
    const { email } = req.body; // Ambil email dari body request

    // req.user didapat dari Token (Auth Middleware)
    const result = await courseService.addStudentToCourse(
      courseId,
      email,
      req.user.id,
      req.user.role
    );

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
    const studentId = req.user.id;
    const courses = await courseService.getEnrolledCourses(studentId);

    res.status(200).json({
      message: 'Berhasil mengambil daftar kelas saya',
      data: courses,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

export { createCourse, getCourses, enrollStudent, getMyCourses };
