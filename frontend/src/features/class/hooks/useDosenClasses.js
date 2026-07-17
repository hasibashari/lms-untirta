import { useState, useEffect, useCallback, useRef } from 'react';
import { getMyClasses } from '../api/class.api';

export const useDosenClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isMounted = useRef(true);
  const academicSemesterId = localStorage.getItem('selectedDosenAcademicSemesterId');

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = academicSemesterId ? { academicSemesterId } : {};
      const res = await getMyClasses(params);
      if (isMounted.current) {
        setClasses(res.data || []);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err?.message || err || 'Gagal memuat data');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [academicSemesterId]);

  useEffect(() => {
    isMounted.current = true;
    fetchClasses();
    return () => {
      isMounted.current = false;
    };
  }, [fetchClasses]);

  const filteredClasses = classes.filter(classObj =>
    classObj.course?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classObj.course?.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classObj.section?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
