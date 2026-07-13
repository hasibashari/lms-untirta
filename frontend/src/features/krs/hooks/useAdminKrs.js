import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
      const res = await getKrsMonitoring(params);
      setMonitoringData(res.data || null);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data monitoring KRS');
    } finally {
      setLoading(false);
    }
  }, [academicSemesterId, page]);

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



  const enrollments = useMemo(() => monitoringData?.enrollments || [], [monitoringData]);
  const summary = monitoringData?.summary || {};
  const meta = monitoringData?._meta?.pagination;

  // Group enrollments by student
  const groupedByStudent = useMemo(() => {
    let filtered = enrollments;
    if (statusFilter !== 'all') {
      filtered = enrollments.filter(e => e.status === statusFilter);
    }

    const map = new Map();
    for (const e of filtered) {
      const sid = e.student?.id;
      if (!sid) continue;
      if (!map.has(sid)) {
        map.set(sid, {
          student: e.student,
          enrollments: [],
          totalSKS: 0,
          statuses: new Set(),
        });
      }
      const group = map.get(sid);
      group.enrollments.push(e);
      group.totalSKS += e.class?.course?.sks || 3;
      group.statuses.add(e.status);
    }
    return Array.from(map.values());
  }, [enrollments, statusFilter]);

  // Filtered by search
  const filteredGroups = useMemo(() => {
    if (!debouncedSearch.trim()) return groupedByStudent;
    const q = debouncedSearch.toLowerCase();
    return groupedByStudent.filter(
      g =>
        g.student.name?.toLowerCase().includes(q) ||
        g.student.email?.toLowerCase().includes(q)
    );
  }, [groupedByStudent, debouncedSearch]);

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
