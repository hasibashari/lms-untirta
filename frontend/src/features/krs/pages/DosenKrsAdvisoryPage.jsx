import { useDosenKrs } from '../hooks/useDosenKrs';
import {
  Loader2, AlertCircle, XCircle, Users,
  ChevronDown, ChevronUp, UserCheck, ShieldOff,
} from 'lucide-react';
import SemesterFilter from '@/shared/components/forms/SemesterFilter';
import DashboardJumbotron from '@/shared/components/layout/Jumbotron';
import StudentAdvisoryCard from '../components/StudentAdvisoryCard';
import {
} from '@/shared/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/shared/components/ui/pagination';

// ============================================================
// Dosen Pembimbing (Dospem) Advisory Page
// Menampilkan mahasiswa bimbingan dan KRS mereka
// ============================================================

const DosenAdvisoryPage = () => {
  const {
    academicSemesterId,
    setAcademicSemesterId,
    page,
    setPage,
    semesters,
    advisoryData,
    loading,
    error,
    revokeNoteId,
    setRevokeNoteId,
    revokeNote,
    setRevokeNote,
    revokingId,
    expandedStudentAll,
    setExpandedStudentAll,
    isAutoKrs,
    isToggling,
    handleToggleAutoKrs,
    handleRevoke,
    refetch,
    bulkUpdate,
    showToast,
  } = useDosenKrs();

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <DashboardJumbotron
        title="Perwalian Akademik"
        subtitle="Kelola KRS mahasiswa bimbingan Anda. Tinjau riwayat dan cabut persetujuan KRS jika diperlukan."
        icon={UserCheck}
      />

      {/* Mode Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isAutoKrs ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
            <ShieldOff size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Mode Persetujuan KRS</h4>
            <p className="text-xs text-slate-500">Saat ini: <b>{isAutoKrs ? 'Otomatis' : 'Manual'}</b></p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4 border-r pr-4 border-slate-100">
            <span className={`text-[10px] font-bold uppercase ${isAutoKrs ? 'text-blue-600' : 'text-slate-400'}`}>Auto</span>
            <button
              onClick={handleToggleAutoKrs}
              disabled={isToggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isAutoKrs ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <span
                className={`${isAutoKrs ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
            <span className={`text-[10px] font-bold uppercase ${!isAutoKrs ? 'text-slate-700' : 'text-slate-400'}`}>Manual</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Filter Semester:</span>
            <SemesterFilter
              semesters={semesters}
              selectedId={academicSemesterId}
              onSelect={(val) => {
                setAcademicSemesterId(val);
                setPage(1);
              }}
              hideAllOption={true}
            />
          </div>
        </div>
      </div>

      {/* Advisory Content */}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-2">
          <AlertCircle size={32} />
          <p className="text-sm">{error}</p>
          <button onClick={refetch} className="text-blue-600 text-sm underline">
            Coba lagi
          </button>
        </div>
      ) : (
        /* ============ ALL STUDENTS TAB ============ */
        !advisoryData || advisoryData.students?.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-600">Belum ada mahasiswa bimbingan</p>
            <p className="text-sm">Hubungi Admin untuk penugasan mahasiswa.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{advisoryData.summary?.totalStudents || 0}</p>
                <p className="text-xs text-slate-500">Total Mahasiswa</p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-lg font-bold text-green-600">{advisoryData.summary?.totalApproved || 0}</p>
                <p className="text-xs text-slate-500">KRS Disetujui</p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center col-span-2 md:col-span-1">
                <p className="text-lg font-bold text-red-600">{advisoryData.summary?.totalRejected || 0}</p>
                <p className="text-xs text-slate-500">KRS Ditolak / Dicabut</p>
              </div>
            </div>

            {/* Student List — Expandable */}
            <div className="space-y-3">
              {advisoryData.students.map(student => {
                const isExpanded = expandedStudentAll === student.id;

                return (
                  <StudentAdvisoryCard
                    key={student.id}
                    student={student}
                    isExpanded={isExpanded}
                    onToggleExpand={() => setExpandedStudentAll(isExpanded ? null : student.id)}
                    revokeNoteId={revokeNoteId}
                    setRevokeNoteId={setRevokeNoteId}
                    revokeNote={revokeNote}
                    setRevokeNote={setRevokeNote}
                    revokingId={revokingId}
                    handleRevoke={handleRevoke}
                    bulkUpdate={bulkUpdate}
                    showToast={showToast}
                    refetch={refetch}
                  />
                );
              })}
            </div>

            {advisoryData._meta?.pagination && advisoryData._meta.pagination.totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      aria-disabled={page === 1}
                      className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-sm text-slate-500 mx-4">
                      Halaman {advisoryData._meta.pagination.currentPage} dari {advisoryData._meta.pagination.totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(p => Math.min(advisoryData._meta.pagination.totalPages, p + 1))}
                      aria-disabled={page === advisoryData._meta.pagination.totalPages}
                      className={page === advisoryData._meta.pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default DosenAdvisoryPage;
