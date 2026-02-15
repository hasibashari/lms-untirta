// utils/academic.util.js — Shared academic business rules
// Digunakan oleh module KRS dan lainnya.
// TIDAK boleh mengimpor service dari module manapun.

/**
 * Tentukan batas maksimum SKS berdasarkan IPK semester sebelumnya.
 *
 * Aturan umum universitas:
 *   IPK >= 3.00  → Maks 24 SKS
 *   IPK >= 2.50  → Maks 22 SKS
 *   IPK >= 2.00  → Maks 20 SKS
 *   IPK <  2.00  → Maks 18 SKS
 *   Semester 1   → Maks 20 SKS (default, belum ada IPK)
 *
 * @param {number|null} ipk — IPK semester sebelumnya (null jika mahasiswa baru)
 * @returns {number} Batas maksimum SKS
 */
export const getMaxSKS = (ipk = null) => {
  if (ipk === null || ipk === undefined) return 20; // Default mahasiswa baru

  if (ipk >= 3.0) return 24;
  if (ipk >= 2.5) return 22;
  if (ipk >= 2.0) return 20;
  return 18;
};

/**
 * Daftar status KRS yang valid dan transisi yang diizinkan.
 */
export const KRS_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

/**
 * Validasi apakah transisi status KRS diizinkan.
 *
 * Allowed transitions:
 *   DRAFT      → SUBMITTED
 *   SUBMITTED  → APPROVED | REJECTED
 *   REJECTED   → DRAFT (revisi)
 *
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {boolean}
 */
export const isValidStatusTransition = (currentStatus, newStatus) => {
  const transitions = {
    DRAFT: ['SUBMITTED'],
    SUBMITTED: ['APPROVED', 'REJECTED'],
    REJECTED: ['DRAFT'],
    APPROVED: [], // Final state — tidak bisa diubah
  };

  return transitions[currentStatus]?.includes(newStatus) ?? false;
};
