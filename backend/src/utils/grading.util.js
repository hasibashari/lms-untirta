// utils/grading.util.js — Shared grading logic
// Digunakan oleh module transcript (dan potensial module lain).
// TIDAK boleh mengimpor service dari module manapun.

/**
 * Konversi nilai rata-rata numerik ke huruf mutu dan bobot.
 *
 * Skala Universitas:
 *   >= 85  → A  (4.0)
 *   >= 80  → A- (3.7)
 *   >= 75  → B+ (3.3)
 *   >= 70  → B  (3.0)
 *   >= 65  → B- (2.7)
 *   >= 60  → C+ (2.3)
 *   >= 55  → C  (2.0)
 *   >= 50  → D  (1.0)
 *   <  50  → E  (0.0)
 *
 * @param {number|null} score — Nilai rata-rata (0–100)
 * @returns {{ letterGrade: string, gradePoint: number }}
 */
export const convertToLetterGrade = (score) => {
  if (score === null || score === undefined) {
    return { letterGrade: '-', gradePoint: 0 };
  }

  if (score >= 85) return { letterGrade: 'A', gradePoint: 4.0 };
  if (score >= 80) return { letterGrade: 'A-', gradePoint: 3.7 };
  if (score >= 75) return { letterGrade: 'B+', gradePoint: 3.3 };
  if (score >= 70) return { letterGrade: 'B', gradePoint: 3.0 };
  if (score >= 65) return { letterGrade: 'B-', gradePoint: 2.7 };
  if (score >= 60) return { letterGrade: 'C+', gradePoint: 2.3 };
  if (score >= 55) return { letterGrade: 'C', gradePoint: 2.0 };
  if (score >= 50) return { letterGrade: 'D', gradePoint: 1.0 };
  return { letterGrade: 'E', gradePoint: 0 };
};

/**
 * Hitung rata-rata nilai dari daftar submissions.
 * Hanya menghitung submission yang sudah di-grade (grade !== null).
 *
 * @param {Array<{ grade: number|null }>} submissions
 * @returns {{ averageScore: number|null, gradedCount: number, totalCount: number }}
 */
export const calculateAverageGrade = (submissions) => {
  let totalGrade = 0;
  let gradedCount = 0;

  for (const submission of submissions) {
    if (submission.grade !== null && submission.grade !== undefined) {
      totalGrade += submission.grade;
      gradedCount++;
    }
  }

  const averageScore = gradedCount > 0
    ? Math.round((totalGrade / gradedCount) * 100) / 100
    : null;

  return {
    averageScore,
    gradedCount,
    totalCount: submissions.length,
  };
};

/**
 * Hitung IPK (Indeks Prestasi Kumulatif) dari daftar course results.
 *
 * @param {Array<{ sks: number, gradePoint: number, averageScore: number|null }>} courseResults
 * @returns {{ totalSKS: number, totalPoints: number, ipk: number, completedCourses: number }}
 */
export const calculateGPA = (courseResults) => {
  let totalSKS = 0;
  let totalPoints = 0;
  let completedCourses = 0;

  for (const course of courseResults) {
    if (course.averageScore !== null) {
      totalSKS += course.sks;
      totalPoints += course.gradePoint * course.sks;
      completedCourses++;
    }
  }

  const ipk = totalSKS > 0
    ? Math.round((totalPoints / totalSKS) * 100) / 100
    : 0;

  return { totalSKS, totalPoints, ipk, completedCourses };
};
