import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Search,
  Filter,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { getAllMyGrades, getMyGradesStats } from '../api/submission.api';
import { getStudentSemesters } from '@/features/academic/api/academic.api';
import { useSemesters } from '@/shared/hooks/useSemesters';
import { Button } from '@/shared/components/ui/button';

/**
 * MyGrades - Halaman Nilai Terpusat
 * Menampilkan semua nilai dari semua kelas dalam satu tempat
 */
const MyGrades = () => {
  const [grades, setGrades] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    graded: 0,
    pending: 0,
    submitted: 0,
    overdue: 0,
    averageGrade: '-',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchGrades = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllMyGrades();
      setGrades(res.data);
    } catch (err) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const { semesters } = useSemesters(getStudentSemesters);
  const [selectedSemesterId] = useState(() => {
    return localStorage.getItem('selectedAcademicSemesterId') || null;
  });

  const activeSemesterId = selectedSemesterId || (semesters.find(s => s.status === 'OPEN') || semesters[0])?.id;

  useEffect(() => {
    if (activeSemesterId !== undefined) {
      getMyGradesStats({ academicSemesterId: activeSemesterId })
        .then(res => setStats(res.data))
        .catch(err => console.error('Failed to fetch grade stats:', err));
    }
  }, [activeSemesterId]);

  // Get active grades based on selected semester
  const activeGrades = grades.filter(g => !activeSemesterId || g.academicSemesterId === activeSemesterId);
  const uniqueClasses = [...new Map(activeGrades.map(g => [g.classId || g.courseId, { id: g.classId || g.courseId, name: g.className || g.courseName }])).values()];

  // Filter and search
  const filteredGrades = activeGrades.filter(grade => {
    const matchSearch =
      grade.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (grade.className || grade.courseName).toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = filterStatus === 'all' || grade.status === filterStatus;
    const matchClass = filterClass === 'all' || (grade.classId || grade.courseId) === filterClass;

    return matchSearch && matchStatus && matchClass;
  });

  // Status badge component
  const StatusBadge = ({ status }) => {
    const configs = {
      graded: { bg: 'bg-green-100', text: 'text-green-700', label: 'Dinilai', icon: CheckCircle },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Dikumpulkan', icon: Clock },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Belum Dikumpulkan', icon: Clock },
      overdue: { bg: 'bg-red-100', text: 'text-red-700', label: 'Terlambat', icon: AlertCircle },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  // Grade display component
  const GradeDisplay = ({ grade }) => {
    if (grade === null || grade === -1 || grade === undefined) return <span className="text-slate-400">-</span>;

    let colorClass = 'text-slate-900';
    if (grade >= 80) colorClass = 'text-green-600';
    else if (grade >= 60) colorClass = 'text-blue-600';
    else if (grade >= 40) colorClass = 'text-yellow-600';
    else colorClass = 'text-red-600';

    return <span className={`text-2xl font-bold ${colorClass}`}>{grade}</span>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <Button
          onClick={() => fetchGrades()}
          variant="link"
          className="mt-3 text-sm text-red-600"
        >
          Coba lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Nilai Saya
        </h1>
        <p className="text-slate-500 mt-1">
          Lihat semua nilai tugas dari seluruh kelas Anda
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Award size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.averageGrade}</p>
              <p className="text-xs text-slate-500">Rata-rata Nilai</p>
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

        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
              <p className="text-xs text-slate-500">Belum Dikumpulkan</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <BookOpen size={20} className="text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Tugas</p>
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
              placeholder="Cari tugas atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2"
          >
            <Filter size={18} />
            <span className="font-medium">Filter</span>
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
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
                <option value="graded">Sudah Dinilai</option>
                <option value="submitted">Dikumpulkan (Belum Dinilai)</option>
                <option value="pending">Belum Dikumpulkan</option>
                <option value="overdue">Terlambat</option>
              </select>
            </div>

            {/* Class Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Kelas</label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value === 'all' ? 'all' : e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Kelas</option>
                {uniqueClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Award size={16} />
        <span>{filteredGrades.length} dari {activeGrades.length} tugas</span>
      </div>

      {/* Grades List */}
      {activeGrades.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Award size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Belum Ada Tugas
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Belum ada tugas yang tersedia di semester ini.
          </p>
        </div>
      ) : filteredGrades.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Search size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Tidak Ditemukan
          </h3>
          <p className="text-slate-500">
            Tidak ada tugas yang sesuai dengan filter Anda.
          </p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('all');
              setFilterClass('all');
            }}
            className="mt-4 text-blue-600 font-medium"
          >
            Reset Filter
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGrades.map((grade, index) => (
            <div
              key={`${grade.assignmentId}-${index}`}
              className="bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Grade Circle */}
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <GradeDisplay grade={grade.grade} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {grade.assignmentTitle}
                    </h3>
                    <StatusBadge status={grade.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <BookOpen size={14} />
                      {grade.className || grade.courseName}
                    </span>
                    <span>•</span>
                    <span>{grade.teacherName}</span>
                    <span>•</span>
                    <span>
                      Deadline: {new Date(grade.dueDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Feedback */}
                  {grade.feedback && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MessageSquare size={16} className="text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-blue-700 mb-0.5">Feedback Dosen</p>
                          <p className="text-sm text-blue-800">{grade.feedback}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="shrink-0">
                  <Link
                    to={`/mahasiswa/classes/${grade.classId || grade.courseId}/assignments/${grade.assignmentId}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyGrades;
