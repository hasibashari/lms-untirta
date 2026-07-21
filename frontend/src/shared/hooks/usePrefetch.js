import { useQueryClient } from '@tanstack/react-query';

/**
 * Custom hook to prefetch React Query data and route components on hover/focus.
 */
export const usePrefetch = () => {
  const queryClient = useQueryClient();

  /**
   * Prefetches query data into TanStack Query cache.
   * @param {Array} queryKey - TanStack Query Key
   * @param {Function} queryFn - Async function returning data
   * @param {Object} options - Additional options (staleTime, etc.)
   */
  const prefetchData = (queryKey, queryFn, options = {}) => {
    if (!queryKey || !queryFn) return;
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: options.staleTime ?? 2 * 60 * 1000,
    });
  };

  /**
   * Prefetches a dynamic import route component.
   * @param {Function} importFn - e.g., () => import('./page')
   */
  const prefetchRoute = (importFn) => {
    if (typeof importFn === 'function') {
      importFn().catch(() => {
        // Silently ignore prefetch network errors; actual navigation will retry
      });
    }
  };

  return { prefetchData, prefetchRoute };
};

export default usePrefetch;
