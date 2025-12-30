import { ROLES } from './constants';

/**
 * Mendapatkan path dashboard berdasarkan role user
 * 
 * @param {string} role - Role user (admin, dosen, mahasiswa)
 * @returns {string} Path ke dashboard sesuai role
 */
export const getDashboardPath = (role) => {
  const dashboardPaths = {
    [ROLES.ADMIN]: '/admin/dashboard',
    [ROLES.DOSEN]: '/dosen/dashboard',
    [ROLES.MAHASISWA]: '/mahasiswa/dashboard',
  };

  return dashboardPaths[role] || '/login';
};

/**
 * Mendapatkan path untuk menu "Course" berdasarkan status auth dan role
 * 
 * @param {boolean} isAuthenticated - Status login user
 * @param {object|null} user - User object dengan property role
 * @returns {string} Path yang sesuai
 */
export const getCoursePath = (isAuthenticated, user) => {
  if (!isAuthenticated || !user?.role) {
    return '/login';
  }
  return getDashboardPath(user.role);
};
