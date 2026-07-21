import { useState, useMemo, useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyClasses } from '../api/class.api';

export const useDosenClasses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const academicSemesterId = localStorage.getItem('selectedDosenAcademicSemesterId');

  const {
    data: classes = [],
    isLoading: loading,
    error: queryError,
    refetch: fetchClasses,
  } = useQuery({
    queryKey: ['dosen-classes', academicSemesterId],
    queryFn: async () => {
      const params = academicSemesterId ? { academicSemesterId } : {};
      const res = await getMyClasses(params);
      return res?.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const error = queryError?.message || (typeof queryError === 'string' ? queryError : null);

  const filteredClasses = useMemo(() => {
    const q = deferredSearchQuery.toLowerCase().trim();
    if (!q) return classes;

    return classes.filter((classObj) =>
      classObj.course?.title?.toLowerCase().includes(q) ||
      classObj.course?.code?.toLowerCase().includes(q) ||
      classObj.section?.toLowerCase().includes(q)
    );
  }, [classes, deferredSearchQuery]);

  return {
    classes,
    filteredClasses,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    fetchClasses,
  };
};

