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

export { createCourse, getCourses, enrollStudent, getMyCourses, getStudentsByCourse };
