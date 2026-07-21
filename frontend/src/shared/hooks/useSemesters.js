import { useQuery } from '@tanstack/react-query';

/**
 * A shared hook to fetch and manage the list of academic semesters.
 * Uses TanStack React Query for shared caching across all pages.
 * 
 * @param {Function} fetcher - The API function to call (e.g. getAllSemesters or getStudentSemesters)
 * @returns {Object} { semesters, loading, error }
 */
export const useSemesters = (fetcher) => {
  const fetcherKey = fetcher?.name || 'default';

  const {
    data: semesters = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['academic-semesters', fetcherKey],
    queryFn: async () => {
      if (!fetcher) return [];
      const res = await fetcher();
      const data = res?.data?.data || res?.data || res || [];
      return Array.isArray(data) ? data : [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    enabled: typeof fetcher === 'function',
  });

  const error = queryError?.message || (typeof queryError === 'string' ? queryError : null);

  return { semesters, loading, error };
};

