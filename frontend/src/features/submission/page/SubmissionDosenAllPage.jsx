import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ChevronDown,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { getRecentSubmissions } from '../submissionService';

/**
 * AllSubmissions - Halaman Semua Submissions Dosen
 * Menampilkan semua submissions dari semua kelas dalam satu tempat
 */
export default function AllSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    Promise.all([
      getRecentSubmissions(100), // Get more submissions
    ])
      .then(([submissionsRes]) => {
        setSubmissions(submissionsRes.data);
      })
      .catch(err => setError(err.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, []);

  // Get unique courses for filter
  const uniqueCourses = [...new Map(submissions.map(s => [s.courseId, { id: s.courseId, name: s.courseName }])).values()];

  // Filter and search
  const filteredSubmissions = submissions.filter(submission => {
    const matchSearch =
      submission.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.assignmentTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.courseName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'graded' && submission.isGraded) ||
      (filterStatus === 'ungraded' && !submission.isGraded);

    const matchCourse = filterCourse === 'all' || submission.courseId === filterCourse;

    return matchSearch && matchStatus && matchCourse;
  });

  // Calculate summary stats
  const stats = {
    total: submissions.length,
    graded: submissions.filter(s => s.isGraded).length,
    ungraded: submissions.filter(s => !s.isGraded).length,
  };

  // Format relative time
  const formatRelativeTime = (date) => {
    const now = new Date();
    const submitted = new Date(date);
    const diff = now - submitted;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return submitted.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-slate-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-red-600 hover:underline"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Semua Submissions
        </h1>
        <p className="text-slate-500 mt-1">
          Lihat dan nilai semua tugas yang dikumpulkan mahasiswa
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Inbox size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Submissions</p>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${stats.ungraded > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.ungraded > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
              <Clock size={20} className={stats.ungraded > 0 ? 'text-amber-600' : 'text-slate-400'} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${stats.ungraded > 0 ? 'text-amber-900' : 'text-slate-900'}`}>{stats.ungraded}</p>
              <p className={`text-xs ${stats.ungraded > 0 ? 'text-amber-700' : 'text-slate-500'}`}>Belum Dinilai</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.graded}</p>
              <p className="text-xs text-slate-500">Sudah Dinilai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari mahasiswa, tugas, atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border transition ${showFilters
              ? 'bg-blue-50 border-blue-200 text-blue-600'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
          >
            <Filter size={18} />
            <span className="font-medium">Filter</span>
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="ungraded">Belum Dinilai</option>
                <option value="graded">Sudah Dinilai</option>
              </select>
            </div>

            {/* Course Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Kelas</label>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value === 'all' ? 'all' : e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Kelas</option>
                {uniqueCourses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Inbox size={16} />
        <span>{filteredSubmissions.length} dari {submissions.length} submissions</span>
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Inbox size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Belum Ada Submissions
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Belum ada mahasiswa yang mengumpulkan tugas.
          </p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Search size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Tidak Ditemukan
          </h3>
          <p className="text-slate-500">
            Tidak ada submissions yang sesuai dengan filter Anda.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('all');
              setFilterCourse('all');
            }}
            className="mt-4 text-blue-600 hover:underline font-medium"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredSubmissions.map((submission) => (
              <Link
                key={submission.id}
                to={`/dosen/courses/${submission.courseId}/assignments/${submission.assignmentId}/submissions`}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-lg">
                  {submission.studentName?.charAt(0)?.toUpperCase() || '?'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900">{submission.studentName}</p>
                    {!submission.isGraded ? (
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <Clock size={10} />
                        Belum Dinilai
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <CheckCircle size={10} />
                        Nilai: {submission.grade}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">{submission.assignmentTitle}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} />
                      {submission.courseName}
                    </span>
                  </div>
                </div>

                {/* Time & Action */}
                <div className="shrink-0 text-right flex items-center gap-4">
                  <div>
                    <p className="text-xs text-slate-400">{formatRelativeTime(submission.submittedAt)}</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
