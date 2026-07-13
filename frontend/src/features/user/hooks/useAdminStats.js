import { useQuery } from '@tanstack/react-query';
import { getAdminStats } from '../api/user.api';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    staleTime: 60 * 1000, // 1 minute
  });
};
