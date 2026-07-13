import { useNavigate } from 'react-router-dom';
import { Users, Search, FileText, Calendar, Filter, ArrowLeft } from 'lucide-react';
import { useDosenSubmissions } from '../hooks/useDosenSubmissions';
import { SubmissionCard } from '../components/SubmissionCard';
import Breadcrumb from '@/shared/components/navigation/Breadcrumb';

/**
 * Submissions - Daftar Submission Mahasiswa (Dosen)
 */
export default function Submissions() {
  const navigate = useNavigate();
  const {
    classId,
    assignmentId,
    submissions,
    currentAssignment,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filteredSubmissions,
    stats,
    formatDate,
    isLate,
    handleGrade,
  } = useDosenSubmissions();

  if (!classId || classId === 'undefined') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-slate-500">Memuat data kelas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/dosen/dashboard' },
          { label: 'Kelas Saya', to: '/dosen/classes' },
          { label: 'Kelas', to: `/dosen/classes/${classId}` },
          { label: 'Tugas', to: `/dosen/classes/${classId}/assignments` },
          { label: 'Submissions' },
        ]}
      />

      {/* No Assignment ID fallback */}
      {!assignmentId && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <FileText size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Tugas Belum Dipilih</h3>
          <p className="text-slate-500 mb-6">
            Silakan pilih tugas dari daftar tugas untuk melihat submission.
          </p>
          <button
            onClick={() => navigate(`/dosen/classes/${classId}/assignments`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Lihat Daftar Tugas
          </button>
        </div>
      )}

      {/* Mode B: Submission List */}
      {assignmentId && (
        <>
          {/* Header with Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate(`/dosen/classes/${classId}/assignments`)}
                className="shrink-0 p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                  {currentAssignment?.title || 'Submissions'}
                </h1>
                {currentAssignment && (
                  <p className="text-slate-500 mt-1 flex items-center gap-2">
                    <Calendar size={14} />
                    Deadline: {formatDate(currentAssignment.dueDate)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {!loading && !error && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                <div className="text-sm text-slate-500">Total Mahasiswa</div>
              </div>
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.submitted}</div>
                <div className="text-sm text-emerald-600">Sudah Submit</div>
              </div>
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.graded}</div>
                <div className="text-sm text-blue-600">Sudah Dinilai</div>
              </div>
            </div>
          )}

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau email mahasiswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div className="relative">
              <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="submitted">Sudah Submit</option>
                <option value="not-submitted">Belum Submit</option>
                <option value="graded">Sudah Dinilai</option>
                <option value="not-graded">Belum Dinilai</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-slate-200 rounded w-1/3" />
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && submissions.length === 0 && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Users size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Belum Ada Data</h3>
              <p className="text-slate-500">Belum ada mahasiswa yang terdaftar atau mengumpulkan tugas</p>
            </div>
          )}

          {/* Submission List */}
          {!loading && !error && filteredSubmissions.length > 0 && (
            <div className="space-y-3">
              {filteredSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  dueDate={currentAssignment?.dueDate}
                  formatDate={formatDate}
                  isLate={isLate}
                  onGrade={handleGrade}
                />
              ))}
            </div>
          )}

          {/* No Search Results */}
          {!loading && !error && submissions.length > 0 && filteredSubmissions.length === 0 && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Search size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Tidak Ditemukan</h3>
              <p className="text-slate-500">Tidak ada hasil yang cocok dengan filter Anda</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
