import prisma from '../../config/prisma.js';

/**
 * Creates a new assignment for a specific course.
 * This function validates that the course exists and the user creating the assignment is the course's designated teacher.
 * @param {string} courseId - The ID of the course to add the assignment to.
 * @param {string} teacherId - The ID of the user (teacher) creating the assignment.
 * @param {object} data - The assignment data.
 * @param {string} data.title - The title of the assignment.
 * @param {string} [data.description] - The description or instructions for the assignment.
 * @param {string|Date} data.dueDate - The due date for the assignment.
 * @returns {Promise<object>} The newly created assignment object.
 * @throws {Error} If the course is not found or if the user is not the teacher of the course.
 */
const createAssignment = async (courseId, teacherId, data) => {
  // Cek kepemilikan kelas
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    throw new Error('Kelas tidak ditemukan');
  }

  if (course.teacherId !== teacherId) {
    throw new Error('Akses ditolak');
  }

  return prisma.assignment.create({
    data: {
      title: data.title,
      description: data.description,
      dueDate: new Date(data.dueDate), // Konversi String ke Date Object
      courseId,
    },
    // SAFE PROJECTION ✅
    select: {
      id: true,
      title: true,
      dueDate: true,
      courseId: true,
    },
  });
};

/**
 * Submits a student's work for a specific assignment.
 * It checks for assignment validity, duplicate submissions, and whether the submission is late.
 * @param {string} assignmentId - The ID of the assignment being submitted.
 * @param {string} studentId - The ID of the student submitting the work.
 * @param {object} data - The submission data.
 * @param {string} data.fileUrl - The URL to the submitted file.
 * @param {string} [data.note] - An optional note from the student.
 * @returns {Promise<object>} The submission result, including status and lateness information.
 * @throws {Error} If the assignment is not found.
 * @throws {Error} If the student has already submitted for this assignment.
 * @note This function currently does not verify if the student is enrolled in the course.
 */
const submitAssignment = async (assignmentId, studentId, data) => {
  // Cek validitas Tugas
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });

  if (!assignment) {
    throw new Error('Tugas tidak ditemukan');
  }

  // TODO Cek apakah mahasiswa terdaftar di kelas tsb? (Skip dulu biar ringkas, tapi idealnya dicek)

  // * Cek Deadline - Tetap izinkan submit tapi tandai sebagai terlambat
  const isLate = new Date() > assignment.dueDate;

  // Cek apakah sudah pernah submit?
  const existingSubmission = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId,
      },
    },
  });

  if (existingSubmission) {
    throw new Error('Anda sudah mengumpulkan tugas ini');
  }

  const submission = await prisma.submission.create({
    data: {
      assignmentId,
      studentId,
      fileUrl: data.fileUrl,
      note: data.note,
    },
    select: {
      id: true,
      assignmentId: true,
      submittedAt: true,
      fileUrl: true,
    },
  });

  return {
    id: submission.id,
    assignmentId: submission.assignmentId,
    submittedAt: submission.submittedAt,
    fileUrl: submission.fileUrl,
    status: 'Submitted',
    isLate, // Informasi apakah terlambat
  };
};

/**
 * Retrieves the basic details of a single assignment.
 * This is a lightweight query intended for fetching core assignment information without related data like submissions.
 * @param {string} assignmentId - The ID of the assignment to retrieve.
 * @returns {Promise<object|null>} The assignment object if found, otherwise null.
 */
const getAssignmentDetail = async assignmentId => {
  return await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      // Kita tidak load submissions di sini agar ringan
    },
  });
};

/**
 * Fetches all assignments for a specific course, tailored to the user's role.
 * It validates course existence and student enrollment. For students, it includes a submission status
 * (`submitted`, `overdue`, `pending`) for each assignment based on their submission history.
 * @param {string} courseId - The ID of the course.
 * @param {string} userId - The ID of the user requesting the assignments.
 * @param {string} userRole - The role of the user ('MAHASISWA' or 'DOSEN').
 * @returns {Promise<Array<object>>} A list of assignments with their status.
 * @throws {Error} If the course is not found or if a student is not enrolled in the course.
 */
const getAssignmentsByCourse = async (courseId, userId, userRole) => {
  // 1. Validasi: Pastikan Course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Kelas tidak ditemukan');
  }

  // 2. Authorization: Mahasiswa harus terdaftar di kelas
  if (userRole === 'MAHASISWA') {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        },
      },
    });

    if (!enrollment) {
      throw new Error('Anda belum terdaftar di kelas ini');
    }
  }

  // 3. Ambil daftar assignments
  const assignments = await prisma.assignment.findMany({
    where: { courseId },
    select: {
      id: true,
      title: true,
      dueDate: true,
      submissions: {
        where: {
          studentId: userId, // Cek submission milik mahasiswa ini
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      dueDate: 'asc', // Urutkan dari deadline paling dekat
    },
  });

  // 4. Transform data untuk menambahkan status deadline
  const now = new Date();

  return assignments.map(assignment => {
    const mySubmission = assignment.submissions[0] || null;

    return {
      id: assignment.id,
      title: assignment.title,
      dueDate: assignment.dueDate,
      status: mySubmission ? 'submitted' : now > assignment.dueDate ? 'overdue' : 'pending',
    };
  });
};

/**
 * Gets detailed information for one assignment, including the current student's submission status.
 * It combines assignment details with the specific submission data for the requesting student,
 * calculating the overall status (`graded`, `submitted`, `overdue`, `pending`).
 * @param {string} assignmentId - The ID of the assignment.
 * @param {string} studentId - The ID of the student viewing the assignment.
 * @returns {Promise<object>} A comprehensive object with assignment and submission details.
 * @throws {Error} If the assignment is not found or the student is not enrolled in the course.
 */
const getAssignmentWithMySubmission = async (assignmentId, studentId) => {
  // 1. Ambil detail assignment
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      courseId: true,
      course: {
        select: {
          id: true,
          title: true,
          code: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new Error('Tugas tidak ditemukan');
  }

  // 2. Cek apakah mahasiswa terdaftar di kelas
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: studentId,
        courseId: assignment.courseId,
      },
    },
  });

  if (!enrollment) {
    throw new Error('Anda belum terdaftar di kelas ini');
  }

  // 3. Cari submission mahasiswa ini (jika ada)
  const mySubmission = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId,
      },
    },
    select: {
      id: true,
      fileUrl: true,
      note: true,
      submittedAt: true,
      grade: true,
      feedback: true,
    },
  });

  // 4. Return data lengkap
  const now = new Date();

  return {
    id: assignment.id,
    title: assignment.title,
    dueDate: assignment.dueDate,
    isOverdue: now > assignment.dueDate,
    status: mySubmission
      ? mySubmission.grade !== null
        ? 'graded'
        : 'submitted'
      : now > assignment.dueDate
        ? 'overdue'
        : 'pending',
    grade: mySubmission ? mySubmission.grade : null,
    feedback: mySubmission ? mySubmission.feedback : null,
  };
};

/**
 * Retrieves all student submissions for a given assignment.
 * This function is intended for teachers and includes authorization to ensure the requester
 * is the teacher of the course associated with the assignment.
 * @param {string} assignmentId - The ID of the assignment.
 * @param {string} teacherId - The ID of the teacher requesting the submissions.
 * @returns {Promise<Array<object>>} A list of submission objects, each including student information.
 * @throws {Error} If the assignment is not found or if the teacher does not have access.
 */
const getSubmissionsByAssignment = async (assignmentId, teacherId) => {
  // Validasi: Pastikan tugas ini milik dosen tersebut
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      course: {
        select: {
          teacherId: true,
        },
      },
    },
  });
  if (!assignment) {
    throw new Error('Tugas tidak ditemukan');
  }
  if (assignment.course.teacherId !== teacherId) {
    throw new Error('Akses ditolak');
  }
  // Ambil submission beserta nama mahasiswany
  return await prisma.submission.findMany({
    where: { assignmentId },
    select: {
      id: true,
      submittedAt: true,
      fileUrl: true,
      note: true,
      grade: true, // Biar dosen tau mana yang belum dinilai
      student: {
        // JOIN ke tabel User
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });
};

/**
 * Fetches a consolidated list of all grades for a student across all their enrolled courses.
 * It iterates through all of a student's enrollments and their associated assignments
 * to build a flat list of all tasks, their status, and grades.
 * @param {string} studentId - The ID of the student whose grades are being requested.
 * @returns {Promise<Array<object>>} An array of objects, each representing a graded assignment from a course.
 */
const getAllMyGrades = async (studentId) => {
  // Ambil semua enrollment mahasiswa
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: studentId },
    select: {
      course: {
        select: {
          id: true,
          title: true,
          code: true,
          teacher: {
            select: {
              name: true,
            },
          },
          assignments: {
            select: {
              id: true,
              title: true,
              dueDate: true,
              submissions: {
                where: { studentId },
                select: {
                  id: true,
                  grade: true,
                  feedback: true,
                  submittedAt: true,
                },
              },
            },
            orderBy: { dueDate: 'desc' },
          },
        },
      },
    },
  });

  // Transform data
  const result = [];

  for (const enrollment of enrollments) {
    const course = enrollment.course;

    for (const assignment of course.assignments) {
      const submission = assignment.submissions[0] || null;
      const now = new Date();

      result.push({
        courseId: course.id,
        courseName: course.title,
        courseCode: course.code,
        teacherName: course.teacher?.name || 'Unknown',
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        dueDate: assignment.dueDate,
        status: submission
          ? submission.grade !== null
            ? 'graded'
            : 'submitted'
          : now > assignment.dueDate
            ? 'overdue'
            : 'pending',
        grade: submission?.grade || null,
        feedback: submission?.feedback || null,
        submittedAt: submission?.submittedAt || null,
      });
    }
  }

  return result;
};

/**
 * Calculates and returns key statistics for a student's dashboard.
 * Uses optimized, parallel database queries to count total courses, total assignments,
 * pending tasks, and graded assignments for the student.
 * @param {string} studentId - The ID of the student.
 * @returns {Promise<object>} An object containing dashboard statistics.
 */

const getMyDashboardStats = async (studentId) => {
  // 1. Get enrolled course IDs with a lightweight query
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: studentId },
    select: { courseId: true },
  });

  const courseIds = enrollments.map(e => e.courseId);

  // 2. Use parallel count queries instead of loading full nested data
  const now = new Date();

  const [totalAssignments, pendingAssignments, gradedAssignments] = await Promise.all([
    // Total assignments across enrolled courses
    prisma.assignment.count({
      where: { courseId: { in: courseIds } },
    }),
    // Pending: not submitted + not overdue
    prisma.assignment.count({
      where: {
        courseId: { in: courseIds },
        dueDate: { gte: now },
        submissions: { none: { studentId } },
      },
    }),
    // Graded submissions
    prisma.submission.count({
      where: {
        studentId,
        assignment: { courseId: { in: courseIds } },
        grade: { not: null },
      },
    }),
  ]);

  return {
    totalCourses: enrollments.length,
    totalAssignments,
    pendingAssignments,
    gradedAssignments,
  };
};

/**
 * Applies a grade and feedback to a student's submission.
 * It performs a multi-level authorization check to ensure the user is the teacher
 * of the course to which the submission belongs before updating the record.
 * @param {string} submissionId - The ID of the submission to be graded.
 * @param {string} teacherId - The ID of the teacher performing the grading.
 * @param {object} data - The grading data.
 * @param {number} data.grade - The numerical grade (e.g., 0-100).
 * @param {string} [data.feedback] - Optional textual feedback for the student.
 * @returns {Promise<object>} The updated submission object with the new grade and feedback.
 * @throws {Error} If the submission is not found or if the user is not the authorized teacher.
 */
const gradeSubmission = async (submissionId, teacherId, data) => {
  // Validasi Kepemilikan (Sedikit kompleks karena harus naik 2 level: Submission -> Assignment -> Course -> Teacher)
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      assignment: {
        select: {
          course: {
            select: {
              teacherId: true,
            },
          },
        },
      },
    },
  });

  if (!submission) {
    throw new Error('Submission tidak ditemukan');
  }
  // Cek apakah user yang request adalah Dosen pemilik kelas
  if (submission.assignment.course.teacherId !== teacherId) {
    throw new Error('Akses ditolak: Ini bukan kelas Anda');
  }

  // Update Nilai
  return await prisma.submission.update({
    where: { id: submissionId },
    data: {
      grade: data.grade,
      feedback: data.feedback,
    },
    select: {
      id: true,
      grade: true,
      feedback: true,
      studentId: true,
    },
  });
};

/**
 * Calculates and returns key statistics for a teacher's dashboard.
 * Uses optimized `_count` and parallel queries to aggregate data across all of the teacher's courses,
 * such as total students, materials, assignments, and submissions needing grading.
 * @param {string} teacherId - The ID of the teacher.
 * @returns {Promise<object>} An object containing dashboard statistics for the teacher.
 */
const getTeacherDashboardStats = async (teacherId) => {
  // 1. Get course IDs and basic counts with _count (single query, no full data load)
  const courses = await prisma.course.findMany({
    where: { teacherId },
    select: {
      id: true,
      _count: {
        select: {
          students: true,
          materials: true,
          assignments: true,
        },
      },
    },
  });

  const courseIds = courses.map(c => c.id);

  let totalStudents = 0;
  let totalMaterials = 0;
  let totalAssignments = 0;

  for (const course of courses) {
    totalStudents += course._count.students;
    totalMaterials += course._count.materials;
    totalAssignments += course._count.assignments;
  }

  // 2. Use parallel count queries for submission stats instead of nested loops
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [pendingGrading, recentSubmissions] = await Promise.all([
    prisma.submission.count({
      where: {
        assignment: { courseId: { in: courseIds } },
        grade: null,
      },
    }),
    prisma.submission.count({
      where: {
        assignment: { courseId: { in: courseIds } },
        submittedAt: { gte: sevenDaysAgo },
      },
    }),
  ]);

  return {
    totalCourses: courses.length,
    totalStudents,
    totalMaterials,
    totalAssignments,
    pendingGrading,
    recentSubmissions,
  };
};

/**
 * Fetches a list of the most recent submissions across all of a teacher's courses.
 * This is useful for a "Recent Activity" or notification feed on the teacher's dashboard.
 * The data is transformed to provide a clean, flat structure for the frontend.
 * @param {string} teacherId - The ID of the teacher.
 * @param {number} [limit=10] - The maximum number of recent submissions to return.
 * @returns {Promise<Array<object>>} An array of recent submission objects with student and course context.
 */
const getRecentSubmissionsForTeacher = async (teacherId, limit = 10) => {
  // Ambil submissions terbaru dari semua kelas dosen
  const submissions = await prisma.submission.findMany({
    where: {
      assignment: {
        course: {
          teacherId,
        },
      },
    },
    select: {
      id: true,
      submittedAt: true,
      grade: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignment: {
        select: {
          id: true,
          title: true,
          course: {
            select: {
              id: true,
              title: true,
              code: true,
            },
          },
        },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
    take: limit,
  });

  return submissions.map(sub => ({
    id: sub.id,
    studentName: sub.student.name,
    studentEmail: sub.student.email,
    assignmentId: sub.assignment.id,
    assignmentTitle: sub.assignment.title,
    courseId: sub.assignment.course.id,
    courseName: sub.assignment.course.title,
    courseCode: sub.assignment.course.code,
    submittedAt: sub.submittedAt,
    isGraded: sub.grade !== null,
    grade: sub.grade,
  }));
};

/**
 * Updates the details of an existing assignment.
 * It verifies that the user is either the teacher who created the assignment or an admin before applying the updates.
 * @param {string} assignmentId - The ID of the assignment to update.
 * @param {string} userId - The ID of the user performing the update.
 * @param {string} userRole - The role of the user ('DOSEN' or 'ADMIN').
 * @param {object} data - The data to update.
 * @param {string} [data.title] - The new title.
 * @param {string} [data.description] - The new description.
 * @param {string|Date} [data.dueDate] - The new due date.
 * @returns {Promise<object>} The updated assignment object.
 * @throws {Error} If the assignment is not found or if the user lacks permission.
 */
const updateAssignment = async (assignmentId, userId, userRole, data) => {
  // 1. Cari assignment beserta informasi course-nya
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      course: {
        select: {
          id: true,
          teacherId: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new Error('Tugas tidak ditemukan');
  }

  // 2. Authorization: Hanya Dosen pemilik atau Admin
  if (userRole === 'DOSEN' && assignment.course.teacherId !== userId) {
    throw new Error('Akses ditolak: Ini bukan tugas dari kelas Anda');
  }

  if (userRole === 'MAHASISWA') {
    throw new Error('Akses ditolak: Mahasiswa tidak dapat mengedit tugas');
  }

  // 3. Update Assignment
  return await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      courseId: true,
      updatedAt: true,
    },
  });
};

/**
 * Deletes an assignment and its associated submissions.
 * This is a destructive action that verifies the user is the course teacher or an admin.
 * The database schema is expected to handle cascading deletes for related submissions.
 * @param {string} assignmentId - The ID of the assignment to delete.
 * @param {string} userId - The ID of the user performing the deletion.
 * @param {string} userRole - The role of the user ('DOSEN' or 'ADMIN').
 * @returns {Promise<object>} An object with a success message and the count of deleted submissions.
 * @throws {Error} If the assignment is not found or if the user lacks permission.
 */
const deleteAssignment = async (assignmentId, userId, userRole) => {
  // 1. Cari assignment beserta informasi course-nya
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      course: {
        select: {
          id: true,
          teacherId: true,
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new Error('Tugas tidak ditemukan');
  }

  // 2. Authorization: Hanya Dosen pemilik atau Admin
  if (userRole === 'DOSEN' && assignment.course.teacherId !== userId) {
    throw new Error('Akses ditolak: Ini bukan tugas dari kelas Anda');
  }

  if (userRole === 'MAHASISWA') {
    throw new Error('Akses ditolak: Mahasiswa tidak dapat menghapus tugas');
  }

  // 3. Delete Assignment (submissions akan cascade delete)
  await prisma.assignment.delete({
    where: { id: assignmentId },
  });

  return {
    message: 'Tugas berhasil dihapus',
    deletedSubmissions: assignment._count.submissions,
  };
};

export {
  createAssignment,
  submitAssignment,
  getAssignmentDetail,
  getAssignmentsByCourse,
  getAssignmentWithMySubmission,
  getSubmissionsByAssignment,
  getAllMyGrades,
  getMyDashboardStats,
  getTeacherDashboardStats,
  getRecentSubmissionsForTeacher,
  gradeSubmission,
  updateAssignment,
  deleteAssignment,
};
