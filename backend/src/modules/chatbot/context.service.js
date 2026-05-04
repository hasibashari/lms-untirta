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
   const isAskingAboutAdvisor = msg.includes("dospem") || msg.includes("pembimbing") || msg.includes("bimbingan");
   const isAskingAboutGrades = msg.includes("nilai") || msg.includes("ipk") || msg.includes("ip ") || msg.includes("transkrip") || msg.includes("hasil");
    const isAskingAboutStudents = msg.includes("mahasiswa") || msg.includes("peserta") || msg.includes("siapa saja") || msg.includes("daftar nama") || msg.includes("berapa") || msg.includes("jumlah");

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

    // 2b. Daftar Mahasiswa Bimbingan (Untuk Dosen)
    if (isAskingAboutAdvisor && user.role === "DOSEN") {
      const lecturerWithAdvisees = await prisma.user.findUnique({
        where: { id: user.id },
        select: { advisedStudents: { select: { name: true, nim: true, email: true } } }
      });
      context.DaftarMahasiswaBimbinganAnda = lecturerWithAdvisees?.advisedStudents || [];
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

      // 3. Info Nilai Akhir (Hanya jika ditanya)
      if (isAskingAboutGrades) {
        const grades = await prisma.finalGrade.findMany({
          where: { studentId: user.id },
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
          },
          krsEnrollments: isAskingAboutStudents ? {
            where: { status: "APPROVED" },
            select: { student: { select: { name: true } } }
          } : false
        }
      });

      context.KelasYangDiajar = teaching.map(c => {
        const data = { MataKuliah: c.course.title, Kelas: c.section };
        if (isAskingAboutSchedules) data.Jadwal = c.schedule;
        if (isAskingAboutMaterials) data.DaftarMateri = c.course.materials.map(m => m.title);
        if (isAskingAboutAssignments) data.InfoTugas = c.course.assignments.map(a => `${a.title} (${a._count.submissions} kumpul)`);
        
        // Ambil daftar mahasiswa jika ditanya
        if (isAskingAboutStudents) {
          data.DaftarMahasiswa = c.krsEnrollments
            .filter(e => e.status === "APPROVED")
            .map(e => e.student.name);
        }

        return data;
      });
    } else if (user.role === "ADMIN") {
      const isAskingAboutStats = msg.includes("statistik") || msg.includes("berapa") || msg.includes("jumlah") || msg.includes("total");

      if (isAskingAboutStats) {
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

      // Tambahan: Info Kelas untuk Admin (jika bertanya jadwal/jumlah mahasiswa)
      if (isAskingAboutStudents || isAskingAboutSchedules) {
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
    }
  } catch (error) {
    console.error("Error in getContextForUser:", error);
    context.info = "Beberapa data tidak dapat dimuat.";
  }

  return context;
};
