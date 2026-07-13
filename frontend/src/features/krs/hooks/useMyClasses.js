import { useQuery } from '@tanstack/react-query';
import { getMyKRS } from '../api/krs.api';

export const useMyClasses = () => {
  const academicSemesterId = localStorage.getItem('selectedAcademicSemesterId');

  return useQuery({
    queryKey: ['my-classes', academicSemesterId],
    queryFn: async () => {
      const params = academicSemesterId ? { academicSemesterId } : {};
      const res = await getMyKRS(params);
      const enrollments = res?.data?.enrollments || [];
      return enrollments.filter((e) => e.status === 'APPROVED');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
