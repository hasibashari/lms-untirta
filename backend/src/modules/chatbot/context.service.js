import prisma from "../../config/prisma.js";

// Mengambil konteks yang relevan untuk chatbot berdasarkan peran pengguna dan data LMS yang tersedia, seperti kelas aktif untuk mahasiswa atau kelas yang diajar untuk dosen.
export const getContextForUser = async (user, userMessage) => {
  let context = {};
  const msg = userMessage.toLowerCase();

  // Deteksi Niat (Intent Detection) - Hemat Token
  const isAskingAboutMaterials = msg.includes("materi") || msg.includes("bahas") || msg.includes("isi") || msg.includes("tentang");
  const isAskingAboutAssignments = msg.includes("tugas") || msg.includes("deadline") || msg.includes("kumpul") || msg.includes("nilai");
  const isAskingAboutSchedules = msg.includes("jadwal") || msg.includes("kapan") || msg.includes("jam") || msg.includes("hari") || msg.includes("ruang");
  const isAskingAboutCatalog = msg.includes("mata kuliah") || msg.includes("daftar") || msg.includes("apa saja") || msg.includes("katalog");
  const isAskingAboutAdvisor = msg.includes("dospem") || msg.includes("pembimbing");

  try {
    // 1. Katalog Mata Kuliah (Hanya jika benar-benar ditanya)
    if (isAskingAboutCatalog) {
      const allCourses = await prisma.course.findMany({
        select: { title: true, code: true },
        take: 10 // Kurangi dari 20 ke 10
      });
      context.KatalogLMS = allCourses.map(c => `${c.title} (${c.code})`);
    }

    // 2. Info Dospem (Hanya jika ditanya)
    if (isAskingAboutAdvisor && user.role === "MAHASISWA") {
      const studentWithAdvisor = await prisma.user.findUnique({
        where: { id: user.id },
        select: { advisor: { select: { name: true, email: true } } }
      });
      context.DosenPembimbingAkademik = studentWithAdvisor?.advisor || "Belum ditentukan";
    }

    if (user.role === "MAHASISWA") {
      const enrollments = await prisma.krsEnrollment.findMany({
        where: { studentId: user.id, status: "APPROVED" },
        select: {
          class: {
            select: {
              section: true,
              schedule: isAskingAboutSchedules, // Ambil jadwal hanya jika perlu
              room: isAskingAboutSchedules,
              course: {
                select: {
                  title: true,
                  code: true,
                  materials: isAskingAboutMaterials ? {
                    select: { title: true, content: true },
                    where: { isPublished: true },
                    take: 5
                  } : false,
                  assignments: isAskingAboutAssignments ? {
                    select: { 
                      title: true, 
                      dueDate: true,
                      submissions: { where: { studentId: user.id }, select: { grade: true, submittedAt: true } }
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
        
        if (isAskingAboutSchedules) {
          data.Jadwal = cls.schedule;
          data.Ruangan = cls.room;
        }
        
        if (isAskingAboutMaterials && course.materials) {
          data.Materi = course.materials.map(m => ({
            Judul: m.title,
            Konten: m.content ? (m.content.length > 1500 ? m.content.substring(0, 1500) + "..." : m.content) : ""
          }));
        }

        if (isAskingAboutAssignments && course.assignments) {
          data.Tugas = course.assignments.map(a => ({
            Judul: a.title,
            Deadline: a.dueDate,
            Status: a.submissions.length > 0 ? "Sudah" : "Belum"
          }));
        }

        return data;
      });
    } else if (user.role === "DOSEN") {
      const teaching = await prisma.class.findMany({
        where: { lecturerId: user.id },
        select: {
          section: true,
          schedule: isAskingAboutSchedules,
          course: { 
            select: { 
              title: true,
              materials: isAskingAboutMaterials ? { select: { title: true }, take: 5 } : false,
              assignments: isAskingAboutAssignments ? {
                select: { title: true, _count: { select: { submissions: true } } }
              } : false
            } 
          }
        }
      });

      context.KelasYangDiajar = teaching.map(c => {
        const data = { MataKuliah: c.course.title, Kelas: c.section };
        if (isAskingAboutSchedules) data.Jadwal = c.schedule;
        if (isAskingAboutMaterials) data.DaftarMateri = c.course.materials.map(m => m.title);
        if (isAskingAboutAssignments) data.InfoTugas = c.course.assignments.map(a => `${a.title} (${a._count.submissions} kumpul)`);
        return data;
      });
    }
  } catch (error) {
    console.error("Error in getContextForUser:", error);
    context.info = "Beberapa data tidak dapat dimuat.";
  }

  return context;
};
