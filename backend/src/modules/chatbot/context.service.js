import prisma from "../../config/prisma.js";

// Mengambil konteks yang relevan untuk chatbot berdasarkan peran pengguna dan data LMS yang tersedia, seperti kelas aktif untuk mahasiswa atau kelas yang diajar untuk dosen.
export const getContextForUser = async (user, userMessage) => {
  let context = {};
  const msg = userMessage.toLowerCase();

  // 1. Tambahkan Katalog Mata Kuliah jika ditanya atau sebagai referensi umum (ringkas)
  if (msg.includes("mata kuliah") || msg.includes("daftar") || msg.includes("apa saja")) {
    const allCourses = await prisma.course.findMany({
      select: { title: true, code: true },
      take: 20 // Batasi agar tidak overload, sesuaikan kebutuhan
    });
    context.KatalogLMS = allCourses.map(c => `${c.title} (${c.code})`);
  }

  if (user.role === "MAHASISWA") {
    // Cari kelas yang KRS-nya disetujui
    const enrollments = await prisma.krsEnrollment.findMany({
      where: {
        studentId: user.id,
        status: "APPROVED"
      },
      select: {
        class: {
          select: {
            id: true,
            section: true,
            schedule: true,
            room: true,
            finalGrades: {
              where: { studentId: user.id },
              select: { letterGrade: true, status: true }
            },
            course: {
              select: {
                title: true,
                code: true,
                description: true,
                materials: {
                  select: { 
                    title: true, 
                    content: true 
                  },
                  where: { isPublished: true },
                  orderBy: { order: 'asc' },
                  take: 5
                },
                assignments: {
                  select: { 
                    id: true,
                    title: true, 
                    dueDate: true,
                    submissions: {
                      where: { studentId: user.id },
                      select: { grade: true, feedback: true, submittedAt: true }
                    }
                  },
                  orderBy: { dueDate: 'asc' },
                  take: 5
                }
              }
            }
          }
        }
      }
    });

    // Format data kelas aktif untuk konteks chatbot
    const activeClasses = enrollments.map(e => {
      const cls = e.class;
      const course = cls.course;
      const finalGrade = cls.finalGrades[0];

      return {
        MataKuliah: course.title,
        Kode: course.code,
        DeskripsiMK: course.description,
        Jadwal: cls.schedule,
        Ruangan: cls.room,
        NilaiAkhir: finalGrade ? `${finalGrade.letterGrade} (${finalGrade.status})` : "Belum tersedia",
        MateriKuliah: course.materials.map(m => ({
          Judul: m.title,
          IsiSingkat: m.content ? m.content.substring(0, 200) + "..." : "Tidak ada deskripsi teks"
        })),
        DaftarTugas: course.assignments.map(a => {
          const sub = a.submissions[0];
          return {
            JudulTugas: a.title,
            Deadline: a.dueDate,
            Status: sub ? "Sudah Dikumpul" : "Belum Dikumpul",
            Nilai: sub ? (sub.grade ?? "Belum dinilai") : "-",
            FeedbackDosen: sub?.feedback ?? "-"
          };
        })
      };
    });

    context.KelasMahasiswaSaatIni = activeClasses;
  } else if (user.role === "DOSEN") {
    const teaching = await prisma.class.findMany({
      where: { lecturerId: user.id },
      select: {
        section: true,
        schedule: true,
        room: true,
        course: { 
          select: { 
            title: true, 
            code: true,
            materials: { select: { title: true }, take: 5 },
            assignments: {
              select: {
                title: true,
                _count: { select: { submissions: true } },
                submissions: {
                  where: { grade: null },
                  select: { id: true }
                }
              }
            }
          } 
        }
      }
    });

    context.KelasYangDiajarDosen = teaching.map(c => ({
      MataKuliah: c.course.title,
      Kode: c.course.code,
      Kelas: c.section,
      Jadwal: c.schedule,
      Ruangan: c.room,
      DaftarMateri: c.course.materials.map(m => m.title).join(", "),
      RingkasanTugas: c.course.assignments.map(a => ({
        JudulTugas: a.title,
        TotalKumpul: a._count.submissions,
        BelumDinilai: a.submissions.length
      }))
    }));
  }

  return context;
};
