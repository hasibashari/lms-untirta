import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams, Link } from 'react-router-dom';
import { getAssignments } from '../assignmentService';
import { getMyCourses } from '../../course/courseService';
import Breadcrumb from '../../../components/navigation/Breadcrumb';
import BackButton from '../../../components/navigation/BackButton';
import {
  Search,
  ClipboardList,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Loader2,
} from 'lucide-react';

export default function Assignments() {
  const { courseId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([getAssignments(courseId), getMyCourses()])
      .then(([assignmentsRes, coursesRes]) => {
        setAssignments(assignmentsRes.data);
        const foundCourse = coursesRes.data.find(item => item.course.id === parseInt(courseId));
        setCourse(foundCourse?.course);
      })
      .catch(err => toast.error(err?.message || 'Gagal memuat data tugas'))
      .finally(() => setLoading(false));
  }, [courseId]);

  // Filter tugas berdasarkan pencarian
  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Hitung statistik - Fix: Backend return lowercase status
  const stats = {
    total: assignments.length,
    submitted: assignments.filter(a => a.status === 'submitted' || a.status === 'graded').length,
    pending: assignments.filter(a => (a.status !== 'submitted' && a.status !== 'graded') && new Date(a.dueDate) >= new Date()).length,
    late: assignments.filter(a => (a.status !== 'submitted' && a.status !== 'graded') && new Date(a.dueDate) < new Date()).length,
  };

  // Helper: Format tanggal
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper: Hitung sisa waktu
  const getTimeRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;

    if (diff < 0) return null; // Sudah lewat

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} hari ${hours} jam lagi`;
    if (hours > 0) return `${hours} jam lagi`;
    return 'Kurang dari 1 jam';
  };

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
          { label: course?.title || 'Kelas', to: `/mahasiswa/courses/${courseId}` },
          { label: 'Tugas' },
        ]}
      />

      <BackButton fallback={`/mahasiswa/courses/${courseId}`} />

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
          {filteredAssignments.map((assignment) => {
            // Fix: Backend return lowercase status ('submitted', 'graded', 'pending', 'overdue')
            const isSubmitted = assignment.status === 'submitted' || assignment.status === 'graded';
            const isLate = new Date(assignment.dueDate) < new Date() && !isSubmitted;
            const timeRemaining = getTimeRemaining(assignment.dueDate);

            return (
              <Link
                key={assignment.id}
                to={`/mahasiswa/courses/${courseId}/assignments/${assignment.id}`}
                className={`block bg-white rounded-xl p-5 shadow-sm border transition-all hover:shadow-md hover:-translate-y-0.5 ${isLate
                  ? 'border-red-200 hover:border-red-300'
                  : isSubmitted
                    ? 'border-green-200 hover:border-green-300'
                    : 'border-gray-100 hover:border-blue-200'
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="font-semibold text-gray-800 truncate">{assignment.title}</h2>
                      {/* Status Badge */}
                      {isSubmitted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          Dikumpulkan
                        </span>
                      ) : isLate ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3" />
                          Terlambat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          <Clock className="w-3 h-3" />
                          Belum dikumpulkan
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Deadline: {formatDate(assignment.dueDate)}</span>
                      </div>
                      {!isSubmitted && timeRemaining && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Clock className="w-4 h-4" />
                          <span>{timeRemaining}</span>
                        </div>
                      )}
                    </div>

                    {/* Nilai jika sudah dikumpulkan dan dinilai */}
                    {isSubmitted && assignment.grade !== null && (
                      <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-lg">
                        <span className="text-sm text-blue-600">Nilai:</span>
                        <span className="font-bold text-blue-700">{assignment.grade}</span>
                      </div>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
