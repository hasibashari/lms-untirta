import prisma from "../../config/prisma.js";

// Mengambil konteks yang relevan untuk chatbot berdasarkan peran pengguna dan data LMS yang tersedia, seperti kelas aktif untuk mahasiswa atau kelas yang diajar untuk dosen.
export const getContextForUser = async (user, userMessage) => {
  let context = {};

  if (user.role === "MAHASISWA") {
    // Cari kelas yang KRS-nya disetujui untuk dapat detail pelajaran
    const enrollments = await prisma.krsEnrollment.findMany({
      where: {
        studentId: user.id,
        status: "APPROVED"
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
                materials: {
                  select: { title: true },
                  orderBy: { createdAt: 'desc' },
                  take: 3
                },
                assignments: {
                  select: { title: true, dueDate: true },
                  orderBy: { dueDate: 'asc' },
                  take: 3
                }
              }
            }
          }
        }
      }
    });

    // Format data kelas aktif untuk konteks chatbot
    const activeClasses = enrollments.map(e => ({
      MataKuliah: e.class.course.title,
      Kode: e.class.course.code,
      Jadwal: e.class.schedule,
      Ruangan: e.class.room,
      MateriTerakhir: e.class.course.materials.map(m => m.title).join(", "),
      TugasMendatang: e.class.course.assignments.map(a => `${a.title} (Deadline: ${a.dueDate})`).join(" | ")
    }));

    context.KelasAktif = activeClasses;
  } else if (user.role === "DOSEN") {
    const teaching = await prisma.class.findMany({
      where: { lecturerId: user.id },
      select: {
        section: true,
        schedule: true,
        room: true,
        course: { select: { title: true, code: true } }
      }
    });

    context.KelasDiajar = teaching.map(c => ({
      MataKuliah: c.course.title,
      Kode: c.course.code,
      Kelas: c.section,
      Jadwal: c.schedule,
      Ruangan: c.room
    }));
  }

  return context;
};
