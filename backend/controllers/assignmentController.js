import * as assignmentService from '../services/assignmentService.js';

const create = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await assignmentService.createAssignment(courseId, req.user.id, req.body);
    res.status(201).json({ message: 'Tugas berhasil dibuat', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submit = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const result = await assignmentService.submitAssignment(assignmentId, req.user.id, req.body);
    res.status(200).json({
      message: 'Tugas berhasil dikumpulkan',
      data: {
        ...result,
        status: 'Submitted',
      },
    });
  } catch (error) {
    if (error.message.includes('habis')) {
      return res.status(400).json({ message: error.message });
    }

    if (error.message.includes('sudah mengumpulkan')) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const result = await assignmentService.getSubmissionsByAssignment(
      assignmentId,
      req.user.id // ID Dosen dari token
    );
    res.status(200).json({ message: 'Daftar pengumpulan berhasil diambil', data: result });
  } catch (error) {
    if (error.message.includes('Akses ditolak')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const grade = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const result = await assignmentService.gradeSubmission(
      submissionId,
      req.user.id, // ID Dosen dari token
      req.body
    );
    res.status(200).json({ message: 'Nilai berhasil disimpan', data: result });
  } catch (error) {
    if (error.message.includes('Akses ditolak')) {
      return res.status(403).json({ message: error.message });
    }
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get Assignments by Course (Mahasiswa & Dosen)
const getAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await assignmentService.getAssignmentsByCourse(
      courseId,
      req.user.id,
      req.user.role
    );
    res.status(200).json({
      message: 'Daftar tugas berhasil diambil',
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('belum terdaftar')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get Assignment Detail with My Submission (Mahasiswa)
const getMyAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const result = await assignmentService.getAssignmentWithMySubmission(assignmentId, req.user.id);
    res.status(200).json({
      message: 'Status tugas berhasil diambil',
      data: result,
    });
  } catch (error) {
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('belum terdaftar')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

export { create, submit, getSubmissions, grade, getAssignments, getMyAssignment };
