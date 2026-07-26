import { useState, useMemo, useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyClasses } from '../api/class.api';
import { getAllSemesters } from '@/features/academic/api/academic.api';
import { useSemesters } from '@/shared/hooks/useSemesters';

export const useDosenClasses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const [academicSemesterId, setAcademicSemesterId] = useState(
    () => localStorage.getItem('selectedDosenAcademicSemesterId') || 'all'
  );

  const { semesters, loading: semestersLoading } = useSemesters(getAllSemesters);

  const handleSemesterChange = (newSemesterId) => {
    setAcademicSemesterId(newSemesterId);
    if (newSemesterId === 'all') {
      localStorage.removeItem('selectedDosenAcademicSemesterId');
    } else {
      localStorage.setItem('selectedDosenAcademicSemesterId', newSemesterId);
    }
  };

  const {
    data: classes = [],
    isLoading: loadingClasses,
    error: queryError,
    refetch: fetchClasses,
  } = useQuery({
    queryKey: ['dosen-classes', academicSemesterId],
    queryFn: async () => {
      const params = academicSemesterId && academicSemesterId !== 'all' ? { academicSemesterId } : {};
      const res = await getMyClasses(params);
      return res?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const loading = loadingClasses || semestersLoading;
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
    semesters,
    academicSemesterId,
    setAcademicSemesterId: handleSemesterChange,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    fetchClasses,
  };
};

