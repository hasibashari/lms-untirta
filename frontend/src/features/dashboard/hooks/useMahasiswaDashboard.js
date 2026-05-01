import { useQuery } from '@tanstack/react-query';
import { getMyKRS } from '../../krs/krsService';
import { getMyDashboardStats } from '../../submission/submissionService';

export const useMahasiswaDashboardData = () => {
  return useQuery({
    queryKey: ['mahasiswa-dashboard'],
    queryFn: async () => {
      const [krsRes, statsRes] = await Promise.all([
        getMyKRS(),
        getMyDashboardStats()
      ]);
      
      const enrollments = krsRes?.data?.enrollments || [];
      const approvedEnrollments = enrollments.filter((e) => e.status === 'APPROVED');
      
      return {
        approvedEnrollments,
        stats: statsRes?.data || null
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
