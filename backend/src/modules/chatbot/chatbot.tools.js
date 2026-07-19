import prisma from "../../config/prisma.js";
import { SchemaType } from "@google/generative-ai";

// ==========================================
// 1. Tool Implementations (Prisma Queries)
// ==========================================

const getActiveSemesterId = async () => {
  const activeSemester = await prisma.academicSemester.findFirst({
    where: { isActive: true },
    select: { id: true, academicYear: true, semesterType: true }
  });
  return activeSemester;
};

const getCatalogContext = async () => {
  const allCourses = await prisma.course.findMany({
    select: { title: true, code: true },
    take: 10
  });
  return allCourses.map(c => `${c.title} (${c.code})`);
};

const getStudentAdvisorContext = async (userId) => {
  const studentWithAdvisor = await prisma.user.findUnique({
    where: { id: userId },
    select: { advisor: { select: { name: true, email: true } } }
  });
  return studentWithAdvisor?.advisor || "Belum ditentukan";
};

const getLecturerAdviseesContext = async (userId) => {
  const lecturerWithAdvisees = await prisma.user.findUnique({
    where: { id: userId },
    select: { advisedStudents: { select: { name: true, nim: true, email: true } } }
  });
  return lecturerWithAdvisees?.advisedStudents || [];
};

const fetchStudentEnrollments = async (userId, semesterId) => {
  let semId = semesterId;
  if (!semId) {
    const active = await getActiveSemesterId();
    if (active) semId = active.id;
  }

  const enrollments = await prisma.krsEnrollment.findMany({
    where: { 
      studentId: userId, 
      status: "APPROVED",
      ...(semId ? { class: { academicSemesterId: semId } } : {})
    },
    select: {
      class: {
        select: {
          section: true,
          schedule: true,
          room: true,
          course: {
            select: {
              title: true,
              code: true,
              materials: { select: { title: true, content: true }, where: { isPublished: true }, take: 5 },
              assignments: {
                select: {
                  title: true,
                  dueDate: true,
                  submissions: { where: { studentId: userId }, select: { grade: true, submittedAt: true } }
                },
                take: 5
              }
            }
          },
          krsEnrollments: {
            where: { status: "APPROVED" },
            select: { student: { select: { name: true } } }
          }
        }
      }
    }
  });

  return enrollments.map(e => {
    const cls = e.class;
    const course = cls.course;
    return {
      MataKuliah: course.title,
      Kode: course.code,
      Jadwal: cls.schedule,
      Ruangan: cls.room,
      Materi: course.materials.map(m => ({
        Judul: m.title,
        Konten: m.content ? (m.content.length > 500 ? m.content.substring(0, 500) + "..." : m.content) : ""
      })),
      Tugas: course.assignments.map(a => ({
        Judul: a.title,
        Deadline: a.dueDate,
        Status: a.submissions.length > 0 ? "Sudah" : "Belum"
      })),
      DaftarMahasiswaLain: cls.krsEnrollments.map(e => e.student.name)
    };
  });
};

const fetchStudentGrades = async (userId, semesterId) => {
  let semId = semesterId;
  if (!semId) {
    const active = await getActiveSemesterId();
    if (active) semId = active.id;
  }

  const grades = await prisma.finalGrade.findMany({
    where: { 
      studentId: userId,
      ...(semId ? { academicSemesterId: semId } : {})
    },
    select: {
      letterGrade: true,
      gradePoint: true,
      class: { select: { course: { select: { title: true } } } },
      academicSemester: { select: { academicYear: true, semesterType: true } }
    }
  });

  return grades.map(g => ({
    MataKuliah: g.class.course.title,
    Nilai: g.letterGrade,
    Bobot: g.gradePoint,
    Semester: `${g.academicSemester.academicYear} ${g.academicSemester.semesterType}`
  }));
};

const fetchLecturerTeaching = async (userId, semesterId) => {
  let semId = semesterId;
  if (!semId) {
    const active = await getActiveSemesterId();
    if (active) semId = active.id;
  }

  const teaching = await prisma.class.findMany({
    where: { 
      lecturerId: userId,
      ...(semId ? { academicSemesterId: semId } : {})
    },
    select: {
      section: true,
      schedule: true,
      course: {
        select: {
          title: true,
          materials: { select: { title: true }, take: 5 },
          assignments: { select: { title: true, _count: { select: { submissions: true } } } }
        }
      },
      krsEnrollments: {
        where: { status: "APPROVED" },
        select: { student: { select: { name: true } } }
      }
    }
  });

  return teaching.map(c => {
    return {
      MataKuliah: c.course.title,
      Kelas: c.section,
      Jadwal: c.schedule,
      DaftarMateri: c.course.materials.map(m => m.title),
      InfoTugas: c.course.assignments.map(a => `${a.title} (${a._count.submissions} kumpul)`),
      DaftarMahasiswa: c.krsEnrollments.map(e => e.student.name)
    };
  });
};

const fetchAdminStats = async () => {
  const [studentCount, lecturerCount, courseCount, activeSemester] = await Promise.all([
    prisma.user.count({ where: { role: "MAHASISWA" } }),
    prisma.user.count({ where: { role: "DOSEN" } }),
    prisma.course.count(),
    prisma.academicSemester.findFirst({ where: { isActive: true } })
  ]);

  return {
    TotalMahasiswa: studentCount,
    TotalDosen: lecturerCount,
    TotalMataKuliah: courseCount,
    SemesterAktif: activeSemester ? `${activeSemester.academicYear} (${activeSemester.semesterType})` : "Tidak ada"
  };
};

const searchLearningMaterials = async (userId, userRole, query) => {
  if (!query) return "Query pencarian tidak boleh kosong.";
  
  const terms = query.split(' ').filter(t => t.trim().length > 0);

  const searchCondition = {
    AND: [
      ...terms.map(term => ({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { content: { contains: term, mode: 'insensitive' } },
          { course: { title: { contains: term, mode: 'insensitive' } } }
        ]
      })),
      { isPublished: true }
    ]
  };

  let materials = [];

  if (userRole === "MAHASISWA") {
    materials = await prisma.material.findMany({
      where: {
        ...searchCondition,
        OR: [
          { classId: null, course: { classes: { some: { krsEnrollments: { some: { studentId: userId, status: "APPROVED" } } } } } },
          { class: { krsEnrollments: { some: { studentId: userId, status: "APPROVED" } } } }
        ]
      },
      select: { title: true, content: true, course: { select: { title: true } } },
      take: 5
    });
  } else if (userRole === "DOSEN") {
    materials = await prisma.material.findMany({
      where: {
        ...searchCondition,
        OR: [
          { course: { teacherId: userId } },
          { course: { classes: { some: { lecturerId: userId } } } },
          { class: { lecturerId: userId } }
        ]
      },
      select: { title: true, content: true, course: { select: { title: true } } },
      take: 5
    });
  }

  if (materials.length === 0) {
    return "Tidak ada materi yang relevan ditemukan.";
  }

  return materials.map(m => ({
    MataKuliah: m.course?.title || "Tidak diketahui",
    JudulMateri: m.title,
    IsiMateri: m.content ? (m.content.length > 4000 ? m.content.substring(0, 4000) + "... (terpotong)" : m.content) : "Tidak ada konten teks"
  }));
};

// ==========================================
// 2. Gemini Function Declarations (Tools)
// ==========================================

export const getToolsForRole = (role) => {
  const tools = [];

  // Tools for everyone
  tools.push({
    name: "get_active_semester",
    description: "Ambil informasi semester yang sedang aktif saat ini.",
  });
  tools.push({
    name: "get_course_catalog",
    description: "Ambil daftar sebagian mata kuliah yang tersedia di katalog universitas.",
  });

  if (role === "MAHASISWA") {
    tools.push({
      name: "search_learning_materials",
      description: "Cari materi pembelajaran (berdasarkan judul atau isi teks) yang relevan dengan kata kunci (query). Gunakan tool ini jika pengguna meminta ringkasan materi tertentu atau mencari informasi dari dalam materi kuliah.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: { type: SchemaType.STRING, description: "Kata kunci untuk pencarian (misal: 'Pertemuan 1', 'Machine Learning', 'UML')." }
        },
        required: ["query"]
      }
    });
    tools.push({
      name: "get_student_advisor",
      description: "Ambil nama dan email Dosen Pembimbing Akademik mahasiswa yang bersangkutan.",
    });
    tools.push({
      name: "get_student_enrollments",
      description: "Ambil daftar kelas yang diambil mahasiswa (KRS), termasuk jadwal, teman sekelas, daftar tugas, dan materi. Secara otomatis memuat data semester aktif jika parameter semesterId kosong.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          semesterId: { type: SchemaType.STRING, description: "Opsional. ID Semester jika ingin melihat data masa lalu." }
        },
      }
    });
    tools.push({
      name: "get_student_grades",
      description: "Ambil daftar nilai ujian / hasil studi (IP) mahasiswa. Secara otomatis memuat data semester aktif jika parameter semesterId kosong.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          semesterId: { type: SchemaType.STRING, description: "Opsional. ID Semester jika ingin melihat data masa lalu." }
        },
      }
    });
  } else if (role === "DOSEN") {
    tools.push({
      name: "search_learning_materials",
      description: "Cari materi pembelajaran (berdasarkan judul atau isi teks) yang relevan dengan kata kunci (query). Gunakan tool ini jika pengguna meminta ringkasan materi tertentu atau mencari informasi dari dalam materi kuliah.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: { type: SchemaType.STRING, description: "Kata kunci untuk pencarian (misal: 'Pertemuan 1', 'Machine Learning', 'UML')." }
        },
        required: ["query"]
      }
    });
    tools.push({
      name: "get_lecturer_advisees",
      description: "Ambil daftar nama mahasiswa bimbingan akademik yang dibimbing oleh dosen ini.",
    });
    tools.push({
      name: "get_lecturer_teaching",
      description: "Ambil daftar kelas yang sedang diajar oleh dosen, termasuk jadwal, materi, tugas, dan daftar nama mahasiswa. Secara otomatis memuat data semester aktif jika semesterId kosong.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          semesterId: { type: SchemaType.STRING, description: "Opsional. ID Semester." }
        },
      }
    });
  } else if (role === "ADMIN") {
    tools.push({
      name: "get_admin_stats",
      description: "Ambil data statistik global sistem (total mahasiswa, dosen, mata kuliah).",
    });
  }

  return [{ functionDeclarations: tools }];
};

// ==========================================
// 3. Tool Dispatcher
// ==========================================

export const executeToolCall = async (toolCall, user) => {
  const { name, args } = toolCall;

  try {
    switch (name) {
      case "get_active_semester":
        return await getActiveSemesterId();
      case "get_course_catalog":
        return await getCatalogContext();
      
      // MAHASISWA Tools
      case "search_learning_materials":
        if (user.role !== "MAHASISWA" && user.role !== "DOSEN") throw new Error("Unauthorized");
        return await searchLearningMaterials(user.id, user.role, args?.query);
      case "get_student_advisor":
        if (user.role !== "MAHASISWA") throw new Error("Unauthorized");
        return await getStudentAdvisorContext(user.id);
      case "get_student_enrollments":
        if (user.role !== "MAHASISWA") throw new Error("Unauthorized");
        return await fetchStudentEnrollments(user.id, args?.semesterId);
      case "get_student_grades":
        if (user.role !== "MAHASISWA") throw new Error("Unauthorized");
        return await fetchStudentGrades(user.id, args?.semesterId);

      // DOSEN Tools
      case "get_lecturer_advisees":
        if (user.role !== "DOSEN") throw new Error("Unauthorized");
        return await getLecturerAdviseesContext(user.id);
      case "get_lecturer_teaching":
        if (user.role !== "DOSEN") throw new Error("Unauthorized");
        return await fetchLecturerTeaching(user.id, args?.semesterId);

      // ADMIN Tools
      case "get_admin_stats":
        if (user.role !== "ADMIN") throw new Error("Unauthorized");
        return await fetchAdminStats();

      default:
        throw new Error(`Unknown tool name: ${name}`);
    }
  } catch (error) {
    console.error(`Tool execution error [${name}]:`, error);
    return { error: error.message };
  }
};
