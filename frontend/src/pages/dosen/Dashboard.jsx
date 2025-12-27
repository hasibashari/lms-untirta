import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  ClipboardList,
  ArrowRight,
  Inbox,
  Clock,
  CheckCircle,
  Bell,
  FileText,
} from 'lucide-react';
import { getMyCourses, getTeacherDashboardStats, getRecentSubmissions } from '../../services/dosen.service';

/**
 * TeacherDashboard
 * Halaman utama setelah login untuk dosen
 * Fokus: Overview/ringkasan kelas, stats actionable, dan notifikasi submissions
 */
export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getMyCourses(),
      getTeacherDashboardStats(),
      getRecentSubmissions(5),
    ])
      .then(([coursesRes, statsRes, submissionsRes]) => {
        setCourses(coursesRes.data);
        setStats(statsRes.data);
        setRecentSubmissions(submissionsRes.data);
      })
      .catch(err => setError(err?.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, []);

  // Stats cards - actionable dengan link
  const statsCards = [
    {
      label: 'Total Kelas',
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      color: 'blue',
      to: '/dosen/classes',
    },
    {
      label: 'Total Mahasiswa',
      value: stats?.totalStudents || 0,
      icon: Users,
      color: 'emerald',
      to: '/dosen/classes',
    },
    {
      label: 'Total Materi',
      value: stats?.totalMaterials || 0,
      icon: FileText,
      color: 'violet',
      to: '/dosen/classes',
    },
    {
      label: 'Perlu Dinilai',
      value: stats?.pendingGrading || 0,
      icon: ClipboardList,
      color: 'amber',
      to: '/dosen/submissions',
      highlight: (stats?.pendingGrading || 0) > 0,
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
  };

  // Preview hanya 3 kelas terbaru
  const previewCourses = courses.slice(0, 3);

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
    return submitted.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Selamat Datang! 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Berikut adalah ringkasan kelas Anda hari ini.
        </p>
      </div>

      {/* Stats Overview - Actionable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.to}
              className={`group bg-white rounded-2xl border p-5 hover:shadow-md transition-all ${stat.highlight ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200 hover:border-blue-300'
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${colorClasses[stat.color]}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{loading ? '-' : stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </div>
              {stat.highlight && stat.value > 0 && (
                <div className="mt-3 text-xs text-amber-600 font-medium flex items-center gap-1">
                  <Bell size={12} />
                  Butuh perhatian
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/dosen/classes"
          className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition">
            <BookOpen size={24} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Kelas Saya</h3>
            <p className="text-sm text-slate-500">{courses.length} kelas diampu</p>
          </div>
          <ArrowRight size={20} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/dosen/submissions"
          className={`group flex items-center gap-4 p-5 rounded-2xl border transition-all ${(stats?.pendingGrading || 0) > 0
              ? 'bg-amber-50 border-amber-200 hover:border-amber-300 hover:shadow-lg'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-lg'
            }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${(stats?.pendingGrading || 0) > 0
              ? 'bg-amber-100 group-hover:bg-amber-200'
              : 'bg-emerald-50 group-hover:bg-emerald-100'
            }`}>
            <Inbox size={24} className={(stats?.pendingGrading || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'} />
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold ${(stats?.pendingGrading || 0) > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
              Submissions
            </h3>
            <p className={`text-sm ${(stats?.pendingGrading || 0) > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
              {(stats?.pendingGrading || 0) > 0 ? `${stats.pendingGrading} perlu dinilai` : 'Semua sudah dinilai'}
            </p>
          </div>
          <ArrowRight size={20} className={`transition-all group-hover:translate-x-1 ${(stats?.pendingGrading || 0) > 0 ? 'text-amber-400 group-hover:text-amber-600' : 'text-slate-400 group-hover:text-emerald-600'
            }`} />
        </Link>

        {stats?.recentSubmissions > 0 ? (
          <div className="flex items-center gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-200">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Bell size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Submissions Baru</h3>
              <p className="text-sm text-blue-700">{stats.recentSubmissions} dalam 7 hari terakhir</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <Clock size={24} className="text-slate-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-500">Tidak Ada Baru</h3>
              <p className="text-sm text-slate-400">Belum ada submission</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Submissions - Notifikasi */}
      {recentSubmissions.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Inbox size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Submissions Terbaru</h2>
                <p className="text-sm text-slate-500">Tugas yang baru dikumpulkan mahasiswa</p>
              </div>
            </div>
            <Link
              to="/dosen/submissions"
              className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
            >
              Lihat Semua
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentSubmissions.map((submission) => (
              <Link
                key={submission.id}
                to={`/dosen/courses/${submission.courseId}/assignments/${submission.assignmentId}/submissions`}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition"
              >
                {/* Avatar placeholder */}
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                  {submission.studentName?.charAt(0)?.toUpperCase() || '?'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 truncate">{submission.studentName}</p>
                    {!submission.isGraded && (
                      <span className="shrink-0 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        Belum Dinilai
                      </span>
                    )}
                    {submission.isGraded && (
                      <span className="shrink-0 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <CheckCircle size={10} />
                        {submission.grade}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 truncate">
                    {submission.assignmentTitle} • {submission.courseName}
                  </p>
                </div>

                {/* Time */}
                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-400">{formatRelativeTime(submission.submittedAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Course Preview Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Kelas Terbaru</h2>
            <p className="text-sm text-slate-500">Preview kelas yang Anda ampu</p>
          </div>
          {courses.length > 3 && (
            <Link
              to="/dosen/classes"
              className="flex items-center gap-1 text-blue-600 font-medium hover:underline"
            >
              Lihat Semua
              <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="h-24 bg-slate-200"></div>
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-10 bg-slate-200 rounded mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-red-600 hover:underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <BookOpen size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Belum Ada Kelas
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-4">
              Anda belum memiliki kelas. Buat kelas pertama Anda sekarang.
            </p>
            <Link
              to="/dosen/classes"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Buat Kelas
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {!loading && !error && previewCourses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {previewCourses.map((course) => (
              <Link
                key={course.id}
                to={`/dosen/courses/${course.id}`}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all"
              >
                {/* Course Header */}
                <div className="h-24 bg-linear-to-br from-blue-500 to-blue-600 p-4 flex items-end">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                    <span className="text-white text-sm font-medium">{course.code}</span>
                  </div>
                </div>

                {/* Course Body */}
                <div className="p-5">
                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition mb-2 line-clamp-2">
                    {course.title}
                  </h3>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{course._count?.enrollments || 0} siswa</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText size={14} />
                      <span>{course._count?.materials || 0} materi</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
