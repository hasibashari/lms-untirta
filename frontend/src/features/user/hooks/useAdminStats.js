import { useQuery } from '@tanstack/react-query';
import { getAdminStats } from '../userService';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    staleTime: 60 * 1000, // 1 minute
  });
};
