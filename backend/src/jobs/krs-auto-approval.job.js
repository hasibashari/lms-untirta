import prisma from '../config/prisma.js';
import { KRS_STATUS } from '../utils/academic.util.js';

/**
 * KRS Auto-Approval Job
 *
 * Proses:
 * 1. Ambil semester aktif yang mengaktifkan auto-approval.
 * 2. Cari semua KRS enrollment dengan status SUBMITTED yang sudah melewati batas waktu.
 * 3. Auto-approve dan buat bridge Enrollment records.
 * 4. Buat audit log untuk setiap auto-approval.
 *
 * Dijalankan oleh cron scheduler (setiap hari).
 */
export async function processAutoApprovals() {
  try {
    // 1. Ambil semester aktif dengan auto-approval enabled
    const semester = await prisma.academicSemester.findFirst({
      where: { isActive: true, krsAutoApprovalEnabled: true },
    });

    if (!semester) {
      console.log('[AUTO-APPROVAL] Tidak ada semester aktif dengan auto-approval enabled');
      return { processed: 0, skipped: true };
    }

    // 2. Hitung deadline date
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() - semester.krsApprovalDeadlineDays);

    // 3. Cari enrollment yang expired (SUBMITTED lebih lama dari deadline)
    const expiredEnrollments = await prisma.krsEnrollment.findMany({
      where: {
        status: KRS_STATUS.SUBMITTED,
        submittedAt: { lte: deadlineDate },
        class: { academicSemesterId: semester.id },
      },
      select: {
        id: true,
        studentId: true,
        status: true,
        class: {
          select: {
            courseId: true,
            course: { select: { title: true, code: true } },
          },
        },
        student: {
          select: { name: true, email: true },
        },
      },
    });

    if (expiredEnrollments.length === 0) {
      console.log('[AUTO-APPROVAL] Tidak ada KRS yang perlu di-auto-approve');
      return { processed: 0 };
    }

    console.log(`[AUTO-APPROVAL] Memproses ${expiredEnrollments.length} KRS enrollment...`);

    // 4. Auto-approve dalam transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update semua menjadi AUTO_APPROVED
      await tx.krsEnrollment.updateMany({
        where: { id: { in: expiredEnrollments.map(e => e.id) } },
        data: {
          status: KRS_STATUS.AUTO_APPROVED,
          note: `Otomatis disetujui setelah ${semester.krsApprovalDeadlineDays} hari tanpa tanggapan dari Dosen Pembimbing.`,
          approvedAt: new Date(),
          approvedBy: null, // null = system
        },
      });

      // Buat bridge Enrollment records
      for (const enrollment of expiredEnrollments) {
        await tx.enrollment.upsert({
          where: {
            userId_courseId: {
              userId: enrollment.studentId,
              courseId: enrollment.class.courseId,
            },
          },
          create: {
            userId: enrollment.studentId,
            courseId: enrollment.class.courseId,
          },
          update: {},
        });
      }

      // Buat audit logs
      await tx.krsApprovalLog.createMany({
        data: expiredEnrollments.map(e => ({
          enrollmentId: e.id,
          fromStatus: KRS_STATUS.SUBMITTED,
          toStatus: KRS_STATUS.AUTO_APPROVED,
          actorId: null, // SYSTEM
          actorType: 'SYSTEM',
          note: `Otomatis disetujui setelah ${semester.krsApprovalDeadlineDays} hari.`,
        })),
      });

      return expiredEnrollments.length;
    });

    console.log(`[AUTO-APPROVAL] Berhasil auto-approve ${result} KRS enrollment`);

    return {
      processed: result,
      details: expiredEnrollments.map(e => ({
        studentName: e.student.name,
        course: `${e.class.course.code} - ${e.class.course.title}`,
      })),
    };
  } catch (error) {
    console.error('[AUTO-APPROVAL] Error:', error.message);
    return { processed: 0, error: error.message };
  }
}
