import { useState, useCallback, useEffect, useRef } from 'react';
import { getKrsMonitoring } from '../api/krs.api';
import { getAllSemesters } from '@/features/academic/api/academic.api';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useSemesters } from '@/shared/hooks/useSemesters';

export const useAdminKrs = () => {
  // Filter state
  const [academicSemesterId, setAcademicSemesterId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 50; // Use larger limit for grouping since we paginate enrollments

  // Semester data for filter
  const { semesters } = useSemesters(getAllSemesters);

  // Data state
  const [monitoringData, setMonitoringData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (academicSemesterId) params.academicSemesterId = academicSemesterId;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      
      const res = await getKrsMonitoring(params);
      setMonitoringData(res.data || null);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data monitoring KRS');
    } finally {
      setLoading(false);
    }
  }, [academicSemesterId, page, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const prevSemesterRef = useRef(academicSemesterId);

  // Clear data immediately when semester changes to prevent data bleeding
  useEffect(() => {
    if (prevSemesterRef.current && prevSemesterRef.current !== academicSemesterId) {
      setMonitoringData(null);
    }
    prevSemesterRef.current = academicSemesterId;
  }, [academicSemesterId]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);



  const summary = monitoringData?.summary || {};
  const meta = monitoringData?._meta?.pagination;

  // The backend now returns paginated students directly
  const filteredGroups = monitoringData?.students || [];

  // Toggle expand a student row
  const toggleExpand = (studentId) => {
    setExpandedStudent(prev => (prev === studentId ? null : studentId));
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return '-';
    return new Date(dateValue).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return {
    academicSemesterId,
    setAcademicSemesterId,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    limit,
    semesters,
    monitoringData,
    loading,
    error,
    expandedStudent,
    searchQuery,
    setSearchQuery,
    summary,
    meta,
    filteredGroups,
    toggleExpand,
    formatDateTime,
    fetchData,
  };
};
