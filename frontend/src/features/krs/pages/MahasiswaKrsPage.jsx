import { useAuth } from '@/app/providers/AuthContext';
import {
  AlertCircle,
  CheckCircle,
  Lock,
  Info,
  BookOpen,
} from 'lucide-react';
import { useMahasiswaKrs } from '../hooks/useMahasiswaKrs';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/shared/components/ui/pagination';

// Sub-components
import KrsHeader from '../components/KrsHeader';
import AvailableClassesSection from '../components/AvailableClassesSection';
import EnrolledClassesSection from '../components/EnrolledClassesSection';

/**
 * KRS (Kartu Rencana Studi) — Optimized & Modularized
 */
const KartuRencanaStudi = () => {
  const { user } = useAuth();
  const {
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
    enrolling,
    dropping,
    revising,
    isPrinting,
    itemsPerPage,
    totalItems,
    totalPages,
    totalSKS,
    enrollmentStats,
    handleEnroll,
    handleDrop,
    handleRevise,
    handlePrintKrs,
    fetchData,
  } = useMahasiswaKrs();

  const handleSemesterChange = (newId) => {
    setSelectedSemesterId(newId);
    setSearchQuery('');
    setSelectedCourseSemester('all');
    setCurrentPage(1);
  };

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
        semesters={semesters}
        selectedSemesterId={selectedSemesterId}
        handleSemesterChange={handleSemesterChange}
        semesterLabel={semesterLabel}
        user={user}
        totalSKS={totalSKS}
        maxSKS={summary.maxSKS || 24}
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
          {isReadOnly && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <Lock size={18} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="text-sm text-slate-600">
                <strong className="text-slate-900">Semester ini sudah ditutup.</strong> Anda hanya dapat melihat riwayat KRS. 
                Pendaftaran baru atau pembatalan tidak tersedia.
              </div>
            </div>
          )}

          {!isReadOnly && currentSemester && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800">
                <strong className="text-blue-900">Masa Pengisian KRS Terbuka.</strong> Silakan pilih mata kuliah yang ditawarkan di bawah ini. Pastikan konsultasi dengan Dosen PA.
              </div>
            </div>
          )}

          {/* Action Messages removed, now handled by toast */}

          {enrollmentStats.rejected > 0 && !isReadOnly && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">{enrollmentStats.rejected} mata kuliah ditolak oleh Dosen PA</p>
                <p className="text-xs text-red-600">Buka tab "KRS Saya" untuk melakukan revisi.</p>
              </div>
            </div>
          )}

          {/* Tabs Navigation & Actions Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-1">
            {/* Left: Tabs */}
            <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-xl border border-slate-200 w-full sm:w-fit shadow-sm">
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
                      enrollments={enrollments}
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
