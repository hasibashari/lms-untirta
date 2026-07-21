import { getMyKRS } from '@/features/krs/api/krs.api';
import { getMyDashboardStats, getMyClasses, getTeacherDashboardStats } from '@/features/class/api/class.api';

/**
 * Route preloading map for lazy components
 */
export const routePreloadMap = {
  '/mahasiswa/classes': () => import('@/features/class/pages/MahasiswaClassPage'),
  '/mahasiswa/krs': () => import('@/features/krs/pages/MahasiswaKrsPage'),
  '/mahasiswa/grades': () => import('@/features/submission/page/MahasiswaGradesPage'),
  '/mahasiswa/study-result': () => import('@/features/transcript/pages/MahasiswaTranscriptPage'),
  '/dosen/classes': () => import('@/features/class/pages/DosenClassPage'),
  '/dosen/grades': () => import('@/features/grade/pages/DosenGradeListPage'),
  '/dosen/submissions': () => import('@/features/submission/page/SubmissionDosenAllPage'),
  '/dosen/advisory': () => import('@/features/krs/pages/DosenKrsAdvisoryPage'),
  '/admin/users': () => import('@/features/user/pages/AdminUserPage'),
  '/admin/courses': () => import('@/features/course/pages/AdminCoursePage'),
  '/admin/classes': () => import('@/features/class/pages/AdminClassOfferingPage'),
  '/admin/academic': () => import('@/features/academic/pages/AdminAcademicPage'),
};

/**
 * Trigger query & route preloading on hover
 */
export const handleNavHover = (to, prefetchData, prefetchRoute) => {
  const academicSemesterId = localStorage.getItem('selectedAcademicSemesterId');
  const params = academicSemesterId ? { academicSemesterId } : {};

  // Preload JS route chunk if available
  if (routePreloadMap[to]) {
    prefetchRoute(routePreloadMap[to]);
  }

  // Preload React Query data based on target path
  switch (to) {
    case '/mahasiswa/dashboard':
      prefetchData(['mahasiswa-dashboard', academicSemesterId], async () => {
        const [krsRes, statsRes] = await Promise.all([
          getMyKRS(params),
          getMyDashboardStats(params),
        ]);
        const enrollments = krsRes?.data?.enrollments || [];
        return {
          approvedEnrollments: enrollments.filter((e) => e.status === 'APPROVED'),
          stats: statsRes?.data || null,
        };
      });
      break;

    case '/mahasiswa/classes':
    case '/mahasiswa/krs':
      prefetchData(['mahasiswa-krs', academicSemesterId], () => getMyKRS(params));
      break;

    case '/dosen/dashboard':
      prefetchData(['dosen-dashboard', academicSemesterId], () => getTeacherDashboardStats(params));
      break;

    case '/dosen/classes':
      prefetchData(['dosen-classes', academicSemesterId], () => getMyClasses(params));
      break;

    default:
      break;
  }
};
