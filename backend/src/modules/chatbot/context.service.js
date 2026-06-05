import prisma from "../../config/prisma.js";

const detectIntents = (msg) => {
  return {
    isAskingAboutMaterials: msg.includes("materi") || msg.includes("bahas") || msg.includes("isi") || msg.includes("tentang"),
    isAskingAboutAssignments: msg.includes("tugas") || msg.includes("deadline") || msg.includes("kumpul") || msg.includes("nilai"),
    isAskingAboutSchedules: msg.includes("jadwal") || msg.includes("kapan") || msg.includes("jam") || msg.includes("hari") || msg.includes("ruang"),
    isAskingAboutCatalog: msg.includes("mata kuliah") || msg.includes("daftar") || msg.includes("apa saja") || msg.includes("katalog"),
    isAskingAboutAdvisor: msg.includes("dospem") || msg.includes("pembimbing") || msg.includes("bimbingan"),
    isAskingAboutGrades: msg.includes("nilai") || msg.includes("ipk") || msg.includes("ip ") || msg.includes("transkrip") || msg.includes("hasil"),
    isAskingAboutStudents: msg.includes("mahasiswa") || msg.includes("peserta") || msg.includes("siapa saja") || msg.includes("daftar nama") || msg.includes("berapa") || msg.includes("jumlah"),
    isAskingAboutStats: msg.includes("statistik") || msg.includes("berapa") || msg.includes("jumlah") || msg.includes("total"),
  };
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

const getStudentContext = async (userId, intents) => {
  const context = {};

  if (intents.isAskingAboutAdvisor) {
    context.DosenPembimbingAkademik = await getStudentAdvisorContext(userId);
  }

  const enrollments = await prisma.krsEnrollment.findMany({
    where: { studentId: userId, status: "APPROVED" },
    select: {
      class: {
        select: {
          section: true,
          schedule: intents.isAskingAboutSchedules,
          room: intents.isAskingAboutSchedules,
          course: {
            select: {
              title: true,
              code: true,
              materials: intents.isAskingAboutMaterials ? {
                select: { title: true, content: true },
                where: { isPublished: true },
                take: 5
              } : false,
              assignments: intents.isAskingAboutAssignments ? {
                select: { 
                  title: true, 
                  dueDate: true,
                  submissions: { where: { studentId: userId }, select: { grade: true, submittedAt: true } }
                },
                take: 3
              } : false
            }
          }
        }
      }
    }
  });

  context.DataKelasAnda = enrollments.map(e => {
    const cls = e.class;
    const course = cls.course;
    const data = { MataKuliah: course.title, Kode: course.code };
    
    if (intents.isAskingAboutSchedules) {
      data.Jadwal = cls.schedule;
      data.Ruangan = cls.room;
    }
    
    if (intents.isAskingAboutMaterials && course.materials) {
      data.Materi = course.materials.map(m => ({
        Judul: m.title,
        Konten: m.content ? (m.content.length > 1500 ? m.content.substring(0, 1500) + "..." : m.content) : ""
      }));
    }

    if (intents.isAskingAboutAssignments && course.assignments) {
      data.Tugas = course.assignments.map(a => ({
        Judul: a.title,
        Deadline: a.dueDate,
        Status: a.submissions.length > 0 ? "Sudah" : "Belum"
      }));
    }

    return data;
  });

  if (intents.isAskingAboutGrades) {
    const grades = await prisma.finalGrade.findMany({
      where: { studentId: userId },
      select: {
        letterGrade: true,
        gradePoint: true,
        class: {
          select: {
            course: { select: { title: true } }
          }
        },
        academicSemester: { select: { academicYear: true, semesterType: true } }
      }
    });
    context.NilaiAkhirAnda = grades.map(g => ({
      MataKuliah: g.class.course.title,
      Nilai: g.letterGrade,
      Bobot: g.gradePoint,
      Semester: `${g.academicSemester.academicYear} ${g.academicSemester.semesterType}`
    }));
  }

  return context;
};

const getLecturerContext = async (userId, intents) => {
  const context = {};

  if (intents.isAskingAboutAdvisor) {
    context.DaftarMahasiswaBimbinganAnda = await getLecturerAdviseesContext(userId);
  }

  const teaching = await prisma.class.findMany({
    where: { lecturerId: userId },
    select: {
      section: true,
      schedule: intents.isAskingAboutSchedules,
      course: { 
        select: { 
          title: true,
          materials: intents.isAskingAboutMaterials ? { select: { title: true }, take: 5 } : false,
          assignments: intents.isAskingAboutAssignments ? {
            select: { title: true, _count: { select: { submissions: true } } }
          } : false
        } 
      },
      krsEnrollments: intents.isAskingAboutStudents ? {
        where: { status: "APPROVED" },
        select: { student: { select: { name: true } } }
      } : false
    }
  });

  context.KelasYangDiajar = teaching.map(c => {
    const data = { MataKuliah: c.course.title, Kelas: c.section };
    if (intents.isAskingAboutSchedules) data.Jadwal = c.schedule;
    if (intents.isAskingAboutMaterials) data.DaftarMateri = c.course.materials.map(m => m.title);
    if (intents.isAskingAboutAssignments) data.InfoTugas = c.course.assignments.map(a => `${a.title} (${a._count.submissions} kumpul)`);
    
    if (intents.isAskingAboutStudents) {
      data.DaftarMahasiswa = c.krsEnrollments
        .filter(e => e.status === "APPROVED")
        .map(e => e.student.name);
    }

    return data;
  });

  return context;
};

const getAdminContext = async (intents) => {
  const context = {};

  if (intents.isAskingAboutStats) {
    const studentCount = await prisma.user.count({ where: { role: "MAHASISWA" } });
    const lecturerCount = await prisma.user.count({ where: { role: "DOSEN" } });
    const courseCount = await prisma.course.count();
    const activeSemester = await prisma.academicSemester.findFirst({ where: { isActive: true } });

    context.StatistikSistem = {
      TotalMahasiswa: studentCount,
      TotalDosen: lecturerCount,
      TotalMataKuliah: courseCount,
      SemesterAktif: activeSemester ? `${activeSemester.academicYear} (${activeSemester.semesterType})` : "Tidak ada semester aktif"
    };
  }

  if (intents.isAskingAboutStudents || intents.isAskingAboutSchedules) {
    const classes = await prisma.class.findMany({
      take: 10,
      select: {
        section: true,
        course: { select: { title: true } },
        _count: { select: { krsEnrollments: { where: { status: "APPROVED" } } } }
      }
    });
    context.MonitorKelasLMS = classes.map(c => ({
      MataKuliah: c.course.title,
      Kelas: c.section,
      JumlahMahasiswa: c._count.krsEnrollments
    }));
  }

  return context;
};

// Mengambil konteks yang relevan untuk chatbot berdasarkan peran pengguna dan data LMS yang tersedia, seperti kelas aktif untuk mahasiswa atau kelas yang diajar untuk dosen.
export const getContextForUser = async (user, userMessage) => {
  let context = {};
  const msg = userMessage.toLowerCase();
  const intents = detectIntents(msg);

  try {
    if (intents.isAskingAboutCatalog) {
      context.KatalogLMS = await getCatalogContext();
    }

    if (user.role === "MAHASISWA") {
      Object.assign(context, await getStudentContext(user.id, intents));
    } else if (user.role === "DOSEN") {
      Object.assign(context, await getLecturerContext(user.id, intents));
    } else if (user.role === "ADMIN") {
      Object.assign(context, await getAdminContext(intents));
    }
  } catch (error) {
    console.error("Error in getContextForUser:", error);
    context.info = "Beberapa data tidak dapat dimuat.";
  }

  return context;
};
