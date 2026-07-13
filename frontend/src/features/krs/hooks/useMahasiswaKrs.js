import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getStudentSemesters } from '@/features/academic/academicService';
import {
  getAvailableClasses,
  getMyKRS,
  enrollClass,
  dropClass,
  reviseEnrollment,
} from '../api/krs.api';

export const useMahasiswaKrs = () => {
  const queryClient = useQueryClient();

  // Semester selector state
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [semestersLoading, setSemestersLoading] = useState(true);

  // Data state
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableMeta, setAvailableMeta] = useState(null);
  const [krsData, setKrsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Action states
  const [enrolling, setEnrolling] = useState(null);
  const [dropping, setDropping] = useState(null);
  const [revising, setRevising] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Course-level filter states (tingkat MK)
  const [selectedCourseSemester, setSelectedCourseSemester] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Tab state: 'offered' | 'taken'
  const [activeTab, setActiveTab] = useState('offered');

  // Derived data
  const enrollments = useMemo(() => krsData?.enrollments || [], [krsData]);
  const summary = krsData?.summary || {};

  const currentSemester = useMemo(
    () => semesters.find((s) => s.id === selectedSemesterId) || null,
    [semesters, selectedSemesterId],
  );

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isReadOnly = currentSemester ? currentSemester.status !== 'OPEN' : true;

  // ==================== SEMESTER LOADING ====================
  useEffect(() => {
    const loadSemesters = async () => {
      setSemestersLoading(true);
      try {
        const res = await getStudentSemesters();
        const list = res?.data?.data || res?.data || [];
        setSemesters(list);

        if (list.length > 0) {
          const openSem = list.find((s) => s.status === 'OPEN');
          setSelectedSemesterId(openSem ? openSem.id : list[0].id);
        }
      } catch {
        setSemesters([]);
      } finally {
        setSemestersLoading(false);
      }
    };
    loadSemesters();
  }, []);

  // ==================== DATA LOADING ====================
  const fetchData = useCallback(async () => {
    if (!selectedSemesterId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [classesRes, krsRes] = await Promise.all([
        getAvailableClasses({
          academicSemesterId: selectedSemesterId,
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearch,
          semester: selectedCourseSemester !== 'all' ? selectedCourseSemester : undefined,
          _t: Date.now(), // Cache buster
        }),
        getMyKRS({ 
          academicSemesterId: selectedSemesterId,
          _t: Date.now(), // Cache buster
        }),
      ]);

      const fetchedClasses = classesRes?.data || [];
      setAvailableClasses(Array.isArray(fetchedClasses) ? fetchedClasses : []);
      setAvailableMeta(classesRes?._meta || null);
      setKrsData(krsRes?.data || null);
    } catch (err) {
      console.error('Error fetching KRS data:', err);
      setError(err?.message || 'Gagal memuat data KRS');
    } finally {
      setLoading(false);
    }
  }, [selectedSemesterId, currentPage, debouncedSearch, selectedCourseSemester]);

  // Auto-switch tab if read-only
  useEffect(() => {
    if (isReadOnly) {
      setActiveTab('taken');
    }
  }, [isReadOnly]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived Summary
  const totalSKS = useMemo(() => {
    return enrollments.reduce((acc, curr) => acc + (curr.class?.course?.sks || 0), 0);
  }, [enrollments]);

  const enrollmentStats = useMemo(() => {
    return {
      approved: enrollments.filter((e) => e.status === 'APPROVED').length,
      pending: enrollments.filter((e) => e.status === 'PENDING').length,
      rejected: enrollments.filter((e) => e.status === 'REJECTED').length,
    };
  }, [enrollments]);

  const totalItems = availableMeta?.pagination?.totalItems || 0;
  const totalPages = availableMeta?.pagination?.totalPages || 1;

  const showSuccess = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };
  const showError = (msg) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 6000);
  };

  const handlePrintKrs = () => {
    setIsPrinting(true);
    window.print();
    setIsPrinting(false);
  };

  // ===== ACTIONS =====
  const handleEnroll = useCallback(async (classId) => {
    if (isReadOnly) return;
    
    setEnrolling(classId);
    try {
      await enrollClass(classId);
      showSuccess('Berhasil mendaftar kelas');
      queryClient.invalidateQueries(['my-classes']);
      await fetchData();
    } catch (err) {
      showError(err?.message || 'Gagal mendaftar kelas. Kelas mungkin penuh atau jadwal bentrok.');
    } finally {
      setEnrolling(null);
    }
  }, [isReadOnly, fetchData, queryClient]);

  const handleDrop = useCallback(async (enrollmentId) => {
    if (isReadOnly) return;

    if (!window.confirm('Yakin ingin membatalkan pendaftaran kelas ini?')) return;
    
    setDropping(enrollmentId);
    try {
      await dropClass(enrollmentId);
      showSuccess('Pendaftaran kelas dibatalkan');
      queryClient.invalidateQueries(['my-classes']);
      await fetchData();
    } catch (err) {
      showError(err?.message || 'Gagal membatalkan pendaftaran');
    } finally {
      setDropping(null);
    }
  }, [isReadOnly, fetchData, queryClient]);

  const handleRevise = useCallback(async (enrollmentId) => {
    if (isReadOnly) return;

    setRevising(enrollmentId);
    try {
      await reviseEnrollment(enrollmentId);
      showSuccess('KRS berhasil diajukan ulang');
      await fetchData();
    } catch (err) {
      showError(err?.message || 'Gagal mengajukan ulang KRS');
    } finally {
      setRevising(null);
    }
  }, [isReadOnly, fetchData]);

  return {
    // States
    semesters,
    selectedSemesterId,
    setSelectedSemesterId,
    semestersLoading,
    availableClasses,
    availableMeta,
    krsData,
    enrollments,
    summary,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCourseSemester,
    setSelectedCourseSemester,
    currentPage,
    setCurrentPage,
    activeTab,
    setActiveTab,
    isReadOnly,
    currentSemester,
    
    // UI states
    enrolling,
    dropping,
    revising,
    isPrinting,
    actionSuccess,
    setActionSuccess,
    actionError,
    setActionError,
    
    // Pagination derived
    itemsPerPage,
    totalItems,
    totalPages,
    
    // Stats derived
    totalSKS,
    enrollmentStats,
    
    // Actions
    handleEnroll,
    handleDrop,
    handleRevise,
    handlePrintKrs,
    fetchData,
  };
};
