import { useEffect, useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle,
  X,
  Lock,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAvailableClasses,
  getMyKRS,
  enrollClass,
  dropClass,
  reviseEnrollment,
} from '../krsService';
import { getStudentSemesters } from '@/features/academic/academicService';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/ui/StatCard';
import InfoBanner from '@/components/ui/InfoBanner';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

// Sub-components
import KrsHeader from '../components/KrsHeader';
import SemesterSummarySection from '../components/SemesterSummarySection';
import AdvisorBar from '../components/AdvisorBar';
import AvailableClassesSection from '../components/AvailableClassesSection';
import EnrolledClassesSection from '../components/EnrolledClassesSection';

/**
 * KRS (Kartu Rencana Studi) — Optimized & Modularized
 */
const KartuRencanaStudi = () => {
  const { user } = useAuth();
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
  const [itemsPerPage] = useState(10);

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
        }),
        getMyKRS({ academicSemesterId: selectedSemesterId }),
      ]);

      // Backend send classes in .data and pagination in ._meta
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
  }, [selectedSemesterId, currentPage, itemsPerPage, debouncedSearch, selectedCourseSemester]);

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
    setActionError(null);
    try {
      await enrollClass(classId);
      showSuccess('Berhasil menambahkan kelas ke KRS.');
      queryClient.invalidateQueries({ queryKey: ['student-transcript'] });
      queryClient.invalidateQueries({ queryKey: ['student-semesters'] });
      await fetchData();
    } catch (err) {
      const responseData = err?.response?.data;
      if (responseData?.code === 'SKS_LIMIT_EXCEEDED') {
        const d = responseData.details;
        showError(
          `Total SKS melebihi batas! Saat ini ${d?.currentSKS || '?'} SKS, ` +
          `menambah ${d?.courseSKS || '?'} SKS melebihi batas ${d?.maxSKS || '?'} SKS.`,
        );
      } else {
        showError(responseData?.message || err?.message || 'Gagal menambahkan kelas');
      }
    } finally {
      setEnrolling(null);
    }
  }, [isReadOnly, fetchData, queryClient]);

  const handleDrop = useCallback(async (classId) => {
    if (isReadOnly) return;
    setDropping(classId);
    setActionError(null);
    try {
      await dropClass(classId);
      showSuccess('Berhasil menghapus kelas dari KRS');
      queryClient.invalidateQueries({ queryKey: ['student-transcript'] });
      queryClient.invalidateQueries({ queryKey: ['student-semesters'] });
      await fetchData();
    } catch (err) {
      showError(err?.response?.data?.message || err?.message || 'Gagal menghapus kelas');
    } finally {
      setDropping(null);
    }
  }, [isReadOnly, fetchData, queryClient]);

  const handleRevise = useCallback(async (enrollmentId) => {
    if (isReadOnly) return;
    setRevising(enrollmentId);
    setActionError(null);
    try {
      const res = await reviseEnrollment(enrollmentId);
      showSuccess(res?.data?.message || 'KRS berhasil direvisi.');
      await fetchData();
    } catch (err) {
      showError(err?.response?.data?.message || err?.message || 'Gagal merevisi KRS');
    } finally {
      setRevising(null);
    }
  }, [isReadOnly, fetchData]);

  const handleSemesterChange = (newId) => {
    setSelectedSemesterId(newId);
    setSearchQuery('');
    setSelectedCourseSemester('all');
    setCurrentPage(1);
    setActionSuccess(null);
    setActionError(null);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCourseSemester]);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push('ellipsis-start');
      for (let i = Math.max(2, currentPage - 2); i <= Math.min(totalPages - 1, currentPage + 2); i++) pages.push(i);
      if (currentPage < totalPages - 3) pages.push('ellipsis-end');
      if (totalPages > 1) pages.push(totalPages);
    }
    return pages;
  };

  const canDrop = () => !isReadOnly;
  const canRevise = (status) => !isReadOnly && status === 'REJECTED';

  const semesterLabel = (sem) =>
    `${sem.semesterType === 'GANJIL' ? 'Ganjil' : 'Genap'} ${sem.academicYear}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      <KrsHeader
        currentSemester={currentSemester}
        isReadOnly={isReadOnly}
        handlePrintKrs={handlePrintKrs}
        isPrinting={isPrinting}
        hasEnrollments={enrollments.length > 0}
      />

      {/* Unified Page Content Loading */}
      {semestersLoading || (loading && !krsData) ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 h-24 bg-slate-100 rounded-xl animate-pulse border border-slate-200/50" />
            <div className="md:col-span-3 h-24 bg-slate-100 rounded-xl animate-pulse border border-slate-200/50" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-24 bg-slate-100 rounded-xl animate-pulse border border-slate-200/50" />
            <div className="h-24 bg-slate-100 rounded-xl animate-pulse border border-slate-200/50" />
            <div className="h-24 bg-slate-100 rounded-xl animate-pulse border border-slate-200/50" />
          </div>
          <div className="h-14 bg-slate-100 rounded-xl animate-pulse border border-slate-200/50" />
          <div className="space-y-4">
            <div className="h-12 w-full bg-slate-100 rounded-xl animate-pulse border border-slate-200/50" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 w-full bg-slate-50 rounded-xl animate-pulse border border-slate-100" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <SemesterSummarySection
            user={user}
            semesters={semesters}
            selectedSemesterId={selectedSemesterId}
            semestersLoading={semestersLoading}
            handleSemesterChange={handleSemesterChange}
            currentSemester={currentSemester}
            semesterLabel={semesterLabel}
          />

          {isReadOnly && (
            <div className="bg-muted/50 border border-border rounded-xl p-4 flex items-start gap-3">
              <Lock size={20} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-sm text-foreground">
                <strong>Semester sudah ditutup.</strong> Anda hanya dapat melihat data KRS semester ini.
                Pengisian dan perubahan KRS tidak tersedia.
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            <StatCard
              className="col-span-1"
              value={summary.totalCourses || enrollments.length}
              label="Total Mata Kuliah"
              variant="primary"
            />
            <StatCard
              className="col-span-1"
              value={totalSKS}
              label="Total SKS"
              variant="primary"
            />
            <StatCard
              className="col-span-2 lg:col-span-1"
              value={summary.maxSKS || 24}
              label="Maks SKS"
              variant={totalSKS > (summary.maxSKS || 24) ? 'danger' : 'primary'}
            />
          </div>

          {summary.maxSKS && !isReadOnly && (
            <InfoBanner variant="info">
              Batas maksimum SKS semester ini: <strong>{summary.maxSKS} SKS</strong>. Anda telah
              mengambil <strong>{totalSKS} SKS</strong> ({summary.maxSKS - totalSKS} SKS tersisa).
            </InfoBanner>
          )}

          <AdvisorBar advisor={user?.advisor} />

          {!isReadOnly && currentSemester && (
            <InfoBanner variant="info">
              Masa pengambilan Rencana Studi semester {semesterLabel(currentSemester)} sedang berlangsung.
            </InfoBanner>
          )}

          {/* Action Messages */}
          {actionSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
              <CheckCircle size={20} className="text-green-600 shrink-0" />
              <p className="text-green-700 flex-1">{actionSuccess}</p>
              <Button variant="ghost" size="icon-sm" onClick={() => setActionSuccess(null)} className="text-green-600 hover:bg-green-100">
                <X size={18} />
              </Button>
            </div>
          )}
          {actionError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="text-red-600 shrink-0" />
              <p className="text-red-700 flex-1">{actionError}</p>
              <Button variant="ghost" size="icon-sm" onClick={() => setActionError(null)} className="text-red-600 hover:bg-red-100">
                <X size={18} />
              </Button>
            </div>
          )}

          {enrollmentStats.rejected > 0 && !isReadOnly && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">{enrollmentStats.rejected} mata kuliah ditolak oleh Dosen PA</p>
                <p className="text-xs text-red-600">Buka tab "KRS Saya" untuk melakukan revisi.</p>
              </div>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-1">
            <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-xl border border-slate-200 w-full sm:w-fit shadow-sm overflow-x-hidden">
              <button
                onClick={() => setActiveTab('offered')}
                disabled={isReadOnly}
                className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                  activeTab === 'offered'
                    ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200/50 scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <BookOpen size={18} className={activeTab === 'offered' ? 'text-blue-500' : 'text-slate-400'} />
                <span className="whitespace-nowrap">
                  <span className="sm:hidden">Ambil MK</span>
                  <span className="hidden sm:inline">Mata Kuliah Ditawarkan</span>
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('taken')}
                className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                  activeTab === 'taken'
                    ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200/50 scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <CheckCircle size={18} className={activeTab === 'taken' ? 'text-blue-500' : 'text-slate-400'} />
                <span className="whitespace-nowrap">KRS Saya</span>
                {enrollments.length > 0 && (
                  <span className={`ml-1 flex items-center justify-center min-w-[18px] h-4.5 px-1 rounded-full text-[9px] font-black tracking-tighter ${
                    activeTab === 'taken' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}>
                    {enrollments.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 relative min-h-[400px]">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-20 w-full bg-slate-100 rounded-xl border border-slate-200/50" />
                ))}
              </div>
            ) : (
              <>
                {activeTab === 'offered' && !isReadOnly && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <AvailableClassesSection
                      user={user}
                      availableClasses={availableClasses}
                      totalItems={totalItems}
                      error={error}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      selectedCourseSemester={selectedCourseSemester}
                      setSelectedCourseSemester={setSelectedCourseSemester}
                      currentPage={currentPage}
                      itemsPerPage={itemsPerPage}
                      enrolling={enrolling}
                      handleEnroll={handleEnroll}
                      fetchData={fetchData}
                      availableMeta={availableMeta}
                    />

                    {/* Pagination for Offered Classes */}
                    {totalPages > 1 && !error && (
                      <div className="flex justify-center">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                            {getPageNumbers().map((page, idx) => (
                              <PaginationItem key={idx}>
                                {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                                  <PaginationEllipsis />
                                ) : (
                                  <PaginationLink
                                    onClick={() => setCurrentPage(page)}
                                    isActive={currentPage === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                )}
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'taken' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <EnrolledClassesSection
                      enrollments={enrollments}
                      isReadOnly={isReadOnly}
                      totalSKS={totalSKS}
                      enrollmentStats={enrollmentStats}
                      dropping={dropping}
                      revising={revising}
                      handleDrop={handleDrop}
                      handleRevise={handleRevise}
                      canDrop={canDrop}
                      canRevise={canRevise}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default KartuRencanaStudi;
