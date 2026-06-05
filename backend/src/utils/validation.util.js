import prisma from '../config/prisma.js';
import { AppError } from '../config/errors.js';

/**
 * Validasi apakah semester valid dan tidak tertutup.
 * Mengembalikan data semester atau error/melempar error jika throwError = true.
 * @param {string} semesterId
 * @param {boolean} throwError - Jika true, akan melempar AppError bila gagal
 * @param {Object} client - Instance prisma (berguna bila di dalam transaction)
 */
export const validateSemesterOpen = async (semesterId, throwError = false, client = prisma) => {
  const semester = await client.academicSemester.findUnique({
    where: { id: semesterId },
    select: { id: true, academicYear: true, semesterType: true, status: true },
  });

  if (!semester) {
    const msg = 'Semester akademik tidak ditemukan';
    if (throwError) throw new AppError(404, msg);
    return { error: msg };
  }

  if (semester.status !== 'OPEN') {
    const msg = `Masa pengisian KRS untuk semester ${semester.academicYear} ${semester.semesterType} belum dibuka atau sudah ditutup (status: ${semester.status})`;
    if (throwError) throw new AppError(400, msg);
    return { error: 'Tidak dapat mengubah data pada semester yang sudah CLOSED atau tidak OPEN' };
  }

  return { semester };
};

/**
 * Validasi apakah dosen valid dan memiliki peran yang benar
 * @param {string} lecturerId
 * @param {boolean} throwError
 * @param {Object} client
 */
export const validateLecturer = async (lecturerId, throwError = false, client = prisma) => {
  const lecturer = await client.user.findUnique({
    where: { id: lecturerId },
    select: { id: true, role: true },
  });

  if (!lecturer) {
    if (throwError) throw new AppError(404, 'Dosen tidak ditemukan');
    return { error: 'Dosen tidak ditemukan' };
  }

  if (lecturer.role !== 'DOSEN') {
    if (throwError) throw new AppError(400, 'User yang dipilih bukan dosen');
    return { error: 'User yang dipilih bukan dosen' };
  }

  return { lecturer };
};
