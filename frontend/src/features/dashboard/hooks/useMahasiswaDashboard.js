import { useQuery } from '@tanstack/react-query';
import { getMyKRS } from '../../krs/api/krs.api';
import { getMyDashboardStats } from '../../class/api/class.api';

export const useMahasiswaDashboardData = () => {
  const academicSemesterId = localStorage.getItem('selectedAcademicSemesterId');

  return useQuery({
    queryKey: ['mahasiswa-dashboard', academicSemesterId],
    queryFn: async () => {
      const params = academicSemesterId ? { academicSemesterId } : {};

      const [krsRes, statsRes] = await Promise.all([
        getMyKRS(params),
        getMyDashboardStats(params)
      ]);
      
      const enrollments = krsRes?.data?.enrollments || [];
      const approvedEnrollments = enrollments.filter((e) => e.status === 'APPROVED');
      
      return {
        approvedEnrollments,
        stats: statsRes?.data || null
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
};
