import { useQuery } from '@tanstack/react-query';
import { getMyKRS } from '../krsService';

export const useMyClasses = () => {
  return useQuery({
    queryKey: ['my-classes'],
    queryFn: async () => {
      const res = await getMyKRS();
      const enrollments = res?.data?.enrollments || [];
      return enrollments.filter((e) => e.status === 'APPROVED');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
