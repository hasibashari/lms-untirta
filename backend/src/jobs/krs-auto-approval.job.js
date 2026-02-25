import prisma from '../config/prisma.js';
import { KRS_STATUS } from '../utils/academic.util.js';

// ========================================================================
// KRS AUTO-APPROVAL JOB — PRODUCTION-GRADE WITH FULL OBSERVABILITY
// ========================================================================
//
// Proses:
// 1. Ambil semester aktif yang mengaktifkan auto-approval.
// 2. Cari semua KRS enrollment SUBMITTED yang sudah melewati batas waktu.
// 3. Deteksi anomali (volume tidak normal).
// 4. Auto-approve dan buat bridge Enrollment records.
// 5. Buat audit log per enrollment.
// 6. Tulis CronJobLog (SUCCESS/FAILED/SKIPPED/PARTIAL).
//
// Dijalankan oleh cron scheduler (setiap hari jam 00:05).
// ========================================================================

/**
 * Ambil rata-rata jumlah auto-approval dari 10 eksekusi terakhir.
 * Digunakan untuk anomaly detection.
 */
async function getHistoricalAverage() {
  const recentLogs = await prisma.cronJobLog.findMany({
    where: {
      jobName: 'KRS_AUTO_APPROVAL',
      status: 'SUCCESS',
      processedCount: { gt: 0 },
    },
    orderBy: { startedAt: 'desc' },
    take: 10,
    select: { processedCount: true },
  });

  if (recentLogs.length === 0) return null;
  const total = recentLogs.reduce((sum, l) => sum + l.processedCount, 0);
  return total / recentLogs.length;
}

/**
 * Deteksi apakah volume auto-approval tidak normal.
 * Anomali: > 3x rata-rata historis (atau > 50 jika belum ada histori).
 */
function detectAnomaly(count, historicalAvg) {
  if (historicalAvg === null) {
    // Belum ada histori — flag jika > 50 sebagai safeguard awal
    return count > 50;
  }
  // Flag jika > 3x rata-rata historis (minimum threshold 10)
  const threshold = Math.max(historicalAvg * 3, 10);
  return count > threshold;
}

/**
 * Tulis log cron job ke database.
 */
async function writeCronLog({
  status,
  semesterId = null,
  processedCount = 0,
  errorCount = 0,
  totalEligible = 0,
  durationMs = 0,
  details = null,
  errorLog = null,
  isAnomalous = false,
  startedAt,
}) {
  try {
    return await prisma.cronJobLog.create({
      data: {
        jobName: 'KRS_AUTO_APPROVAL',
        status,
        academicSemesterId: semesterId,
        processedCount,
        errorCount,
        totalEligible,
        durationMs,
        details,
        errorLog,
        isAnomalous,
        startedAt,
      },
    });
  } catch (logError) {
    // Last-resort: jangan sampai error logging menghancurkan proses utama
    console.error('[AUTO-APPROVAL] CRITICAL: Gagal menulis CronJobLog:', logError.message);
    return null;
  }
}

/**
 * Main auto-approval processor.
 * Returns a structured result for the cron scheduler.
 */
export async function processAutoApprovals() {
  const startedAt = new Date();
  const startMs = Date.now();

  try {
    // 1. Ambil semester aktif dengan auto-approval enabled
    const semester = await prisma.academicSemester.findFirst({
      where: { isActive: true, krsAutoApprovalEnabled: true },
    });

    if (!semester) {
      console.log('[AUTO-APPROVAL] Tidak ada semester aktif dengan auto-approval enabled');
      const duration = Date.now() - startMs;
      await writeCronLog({
        status: 'SKIPPED',
        durationMs: duration,
        errorLog: 'Tidak ada semester aktif dengan auto-approval enabled',
        startedAt,
      });
      return { processed: 0, skipped: true, logged: true };
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
      const duration = Date.now() - startMs;
      await writeCronLog({
        status: 'SKIPPED',
        semesterId: semester.id,
        totalEligible: 0,
        durationMs: duration,
        errorLog: 'Tidak ada KRS SUBMITTED yang melewati batas waktu',
        startedAt,
      });
      return { processed: 0, logged: true };
    }

    // 4. Anomaly detection
    const historicalAvg = await getHistoricalAverage();
    const isAnomalous = detectAnomaly(expiredEnrollments.length, historicalAvg);

    if (isAnomalous) {
      console.warn(
        `[AUTO-APPROVAL] ⚠ ANOMALY DETECTED: ${expiredEnrollments.length} enrollment ` +
        `(rata-rata historis: ${historicalAvg !== null ? historicalAvg.toFixed(1) : 'N/A'})`
      );
    }

    console.log(`[AUTO-APPROVAL] Memproses ${expiredEnrollments.length} KRS enrollment...`);

    // 5. Auto-approve dalam transaction
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

    const duration = Date.now() - startMs;

    // 6. Build detail log
    const details = expiredEnrollments.map(e => ({
      studentId: e.studentId,
      studentName: e.student.name,
      studentEmail: e.student.email,
      courseCode: e.class.course.code,
      courseTitle: e.class.course.title,
    }));

    console.log(`[AUTO-APPROVAL] ✓ Berhasil auto-approve ${result} KRS enrollment (${duration}ms)`);

    // 7. Tulis success log
    await writeCronLog({
      status: 'SUCCESS',
      semesterId: semester.id,
      processedCount: result,
      totalEligible: expiredEnrollments.length,
      durationMs: duration,
      details,
      isAnomalous,
      startedAt,
    });

    return {
      processed: result,
      isAnomalous,
      durationMs: duration,
      details,
      logged: true,
    };
  } catch (error) {
    const duration = Date.now() - startMs;

    console.error('[AUTO-APPROVAL] ✗ FAILED:', error.message);
    console.error('[AUTO-APPROVAL] Stack:', error.stack);

    // Tulis failure log
    await writeCronLog({
      status: 'FAILED',
      durationMs: duration,
      errorLog: `${error.message}\n\n${error.stack}`,
      startedAt,
    });

    return { processed: 0, error: error.message, logged: true };
  }
}

/**
 * Get auto-approval statistics for admin dashboard.
 * Returns summary of recent auto-approval activity for a semester.
 */
export async function getAutoApprovalStats(academicSemesterId = null) {
  const where = { jobName: 'KRS_AUTO_APPROVAL' };
  if (academicSemesterId) where.academicSemesterId = academicSemesterId;

  // Get recent execution logs
  const recentLogs = await prisma.cronJobLog.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take: 20,
    select: {
      id: true,
      status: true,
      processedCount: true,
      errorCount: true,
      totalEligible: true,
      durationMs: true,
      isAnomalous: true,
      errorLog: true,
      startedAt: true,
      createdAt: true,
      academicSemester: {
        select: {
          id: true,
          academicYear: true,
          semesterType: true,
        },
      },
    },
  });

  // Aggregate stats for the semester
  const aggregateWhere = { ...where };
  if (academicSemesterId) aggregateWhere.academicSemesterId = academicSemesterId;

  const successLogs = recentLogs.filter(l => l.status === 'SUCCESS');
  const failedLogs = recentLogs.filter(l => l.status === 'FAILED');
  const anomalousLogs = recentLogs.filter(l => l.isAnomalous);

  const totalAutoApproved = successLogs.reduce((sum, l) => sum + l.processedCount, 0);

  // Count current pending KRS eligible for auto-approval
  let pendingAutoApproval = 0;
  let nextAutoApprovalDate = null;

  if (academicSemesterId) {
    const semester = await prisma.academicSemester.findUnique({
      where: { id: academicSemesterId },
      select: { krsApprovalDeadlineDays: true, krsAutoApprovalEnabled: true },
    });

    if (semester?.krsAutoApprovalEnabled) {
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() - semester.krsApprovalDeadlineDays);

      pendingAutoApproval = await prisma.krsEnrollment.count({
        where: {
          status: KRS_STATUS.SUBMITTED,
          submittedAt: { lte: deadlineDate },
          class: { academicSemesterId },
        },
      });

      // Find the next enrollment that will become eligible
      const nextEligible = await prisma.krsEnrollment.findFirst({
        where: {
          status: KRS_STATUS.SUBMITTED,
          submittedAt: { gt: deadlineDate },
          class: { academicSemesterId },
        },
        orderBy: { submittedAt: 'asc' },
        select: { submittedAt: true },
      });

      if (nextEligible) {
        nextAutoApprovalDate = new Date(nextEligible.submittedAt);
        nextAutoApprovalDate.setDate(
          nextAutoApprovalDate.getDate() + semester.krsApprovalDeadlineDays
        );
      }
    }
  }

  return {
    summary: {
      totalAutoApproved,
      totalExecutions: recentLogs.length,
      successCount: successLogs.length,
      failedCount: failedLogs.length,
      anomalyCount: anomalousLogs.length,
      pendingAutoApproval,
      nextAutoApprovalDate,
      lastExecution: recentLogs[0] || null,
    },
    recentLogs,
  };
}

/**
 * Get detailed auto-approval log (with affected students).
 */
export async function getAutoApprovalLogDetail(logId) {
  const log = await prisma.cronJobLog.findUnique({
    where: { id: logId },
    include: {
      academicSemester: {
        select: {
          id: true,
          academicYear: true,
          semesterType: true,
        },
      },
    },
  });

  if (!log) throw new Error('Log tidak ditemukan');
  return log;
}
