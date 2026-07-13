import Breadcrumb from '@/shared/components/navigation/Breadcrumb';
import BackButton from '@/shared/components/navigation/BackButton';
import { Search, ClipboardList, CheckCircle, Clock, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { useMahasiswaAssignments } from '../hooks/useMahasiswaAssignments';
import { MahasiswaAssignmentCard } from '../components/MahasiswaAssignmentCard';

export default function Assignments() {
  const {
    classId,
    course,
    loading,
    searchQuery,
    setSearchQuery,
    filteredAssignments,
    stats,
    formatDate,
    getTimeRemaining,
  } = useMahasiswaAssignments();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Memuat tugas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Kelas Saya', to: '/mahasiswa/classes' },
          { label: course?.title || 'Kelas', to: `/mahasiswa/classes/${classId}` },
          { label: 'Tugas' },
        ]}
      />

      <BackButton fallback={`/mahasiswa/classes/${classId}`} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ClipboardList className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Daftar Tugas</h1>
            <p className="text-sm text-gray-500">{course?.title}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari tugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Total Tugas</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Dikumpulkan</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.submitted}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-yellow-100">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Belum Dikerjakan</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Terlambat</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.late}</p>
        </div>
      </div>

      {/* Assignment List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            {searchQuery ? 'Tugas tidak ditemukan' : 'Belum ada tugas'}
          </h3>
          <p className="text-gray-400">
            {searchQuery
              ? 'Coba gunakan kata kunci lain'
              : 'Dosen belum memberikan tugas untuk kelas ini'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((assignment) => (
            <MahasiswaAssignmentCard
              key={assignment.id}
              assignment={assignment}
              classId={classId}
              formatDate={formatDate}
              getTimeRemaining={getTimeRemaining}
            />
          ))}
        </div>
      )}
    </div>
  );
}
