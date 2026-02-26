// utils/academic.util.js — Shared academic business rules
// Digunakan oleh module KRS dan lainnya.
// TIDAK boleh mengimpor service dari module manapun.

/**
 * Daftar status KRS yang valid dan transisi yang diizinkan.
 */
export const KRS_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

/**
 * Validasi apakah transisi status KRS diizinkan.
 *
 * Allowed transitions:
 *   PENDING   → APPROVED        (by DOSPEM)
 *   PENDING   → REJECTED        (by DOSPEM)
 *   APPROVED  → REJECTED        (by DOSPEM, revoke — only when semester OPEN)
 *   REJECTED  → PENDING         (by MAHASISWA, resubmit)
 *
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {boolean}
 */
export const isValidStatusTransition = (currentStatus, newStatus) => {
  const transitions = {
    PENDING: ['APPROVED', 'REJECTED'],
    REJECTED: ['PENDING'],
    APPROVED: ['REJECTED'], // Revoke approval (by DOSPEM, semester must be OPEN)
  };

  return transitions[currentStatus]?.includes(newStatus) ?? false;
};
