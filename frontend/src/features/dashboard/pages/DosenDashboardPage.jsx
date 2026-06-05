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
  LayoutDashboard,
} from 'lucide-react';
import { getMyClasses, getTeacherDashboardStats } from '../../class/classService';
import { getRecentSubmissions } from '../../submission/submissionService';
import DashboardJumbotron from '@/shared/components/layout/Jumbotron';

/**
 * TeacherDashboard
 * Halaman utama setelah login untuk dosen
 * Fokus: Overview/ringkasan kelas, stats actionable, dan notifikasi submissions
 */
export default function Dashboard() {
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getMyClasses(),
      getTeacherDashboardStats(),
      getRecentSubmissions(5),
    ])
      .then(([classesRes, statsRes, submissionsRes]) => {
        setClasses(classesRes.data);
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
      value: stats?.totalClasses || 0,
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
      label: 'Perlu Dinilai',
      value: stats?.pendingGrading || 0,
      icon: ClipboardList,
      color: 'amber',
      to: '/dosen/submissions',
      highlight: (stats?.pendingGrading || 0) > 0,
    },
  ];

  const colorClasses = {
    blue: 'bg-primary/10 text-primary group-hover:bg-primary/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20',
    violet: 'bg-violet-500/10 text-violet-600 group-hover:bg-violet-500/20',
    amber: 'bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20',
  };

  // Preview hanya 3 kelas terbaru

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
      {/* Error Banner */}
      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm'>
          {error}
        </div>
      )}

      {/* Jumbotron / Hero Section */}
      <DashboardJumbotron
        icon={LayoutDashboard}
        title="Selamat Datang! 👋"
        subtitle="Berikut adalah ringkasan kelas Anda hari ini."
      >
        <Link
          to="/dosen/classes"
          className="px-4 py-2 text-sm font-medium bg-background text-primary hover:bg-white/25 rounded-lg transition"
        >
          Lihat Kelas
        </Link>
      </DashboardJumbotron>

      {/* Stats Overview - Actionable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.to}
              className={`group bg-card rounded-xl border p-5 hover:shadow-sm transition-all ${stat.highlight ? 'border-amber-300 ring-1 ring-amber-100' : 'border-border hover:border-primary/50'
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${colorClasses[stat.color]}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">{loading ? '-' : stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
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
          className="group flex items-center gap-4 p-5 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
            <BookOpen size={24} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground">Kelas Saya</h3>
            <p className="text-sm text-muted-foreground">{classes.length} kelas diampu</p>
          </div>
          <ArrowRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/dosen/submissions"
          className={`group flex items-center gap-4 p-5 rounded-xl border transition-all ${(stats?.pendingGrading || 0) > 0
            ? 'bg-amber-50 border-amber-200 hover:border-amber-300 hover:shadow-sm'
            : 'bg-card border-border hover:border-emerald-500/50 hover:shadow-sm'
            }`}
        >
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition ${(stats?.pendingGrading || 0) > 0
            ? 'bg-amber-100 group-hover:bg-amber-200'
            : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
            }`}>
            <Inbox size={24} className={(stats?.pendingGrading || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'} />
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold ${(stats?.pendingGrading || 0) > 0 ? 'text-amber-900' : 'text-card-foreground'}`}>
              Submissions
            </h3>
            <p className={`text-sm ${(stats?.pendingGrading || 0) > 0 ? 'text-amber-700' : 'text-muted-foreground'}`}>
              {(stats?.pendingGrading || 0) > 0 ? `${stats.pendingGrading} perlu dinilai` : 'Semua sudah dinilai'}
            </p>
          </div>
          <ArrowRight size={20} className={`transition-all group-hover:translate-x-1 ${(stats?.pendingGrading || 0) > 0 ? 'text-amber-400 group-hover:text-amber-600' : 'text-muted-foreground group-hover:text-emerald-600'
            }`} />
        </Link>

        {stats?.recentSubmissions > 0 ? (
          <div className="flex items-center gap-4 p-5 bg-primary/5 rounded-xl border border-primary/20">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell size={24} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary">Submissions Baru</h3>
              <p className="text-sm text-primary/80">{stats.recentSubmissions} dalam 7 hari terakhir</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-5 bg-card rounded-xl border border-border">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <Clock size={24} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-muted-foreground">Tidak Ada Baru</h3>
              <p className="text-sm text-muted-foreground/80">Belum ada submission</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Submissions - Notifikasi */}
      {recentSubmissions.length > 0 && (
        <section className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Inbox size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-card-foreground">Submissions Terbaru</h2>
                <p className="text-sm text-muted-foreground">Tugas yang baru dikumpulkan mahasiswa</p>
              </div>
            </div>
            <Link
              to="/dosen/submissions"
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              Lihat Semua
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {recentSubmissions.map((submission) => (
              <Link
                key={submission.id}
                to={`/dosen/classes/${submission.classId || submission.courseId}/assignments/${submission.assignmentId}/submissions`}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition"
              >
                {/* Avatar placeholder */}
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                  {submission.studentName?.charAt(0)?.toUpperCase() || '?'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-card-foreground truncate">{submission.studentName}</p>
                    {!submission.isGraded && (
                      <span className="shrink-0 px-2 py-0.5 bg-amber-500/10 text-amber-700 text-xs font-medium rounded-full">
                        Belum Dinilai
                      </span>
                    )}
                    {submission.isGraded && (
                      <span className="shrink-0 px-2 py-0.5 bg-emerald-500/10 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <CheckCircle size={10} />
                        {submission.grade}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {submission.assignmentTitle} • {submission.courseName}
                  </p>
                </div>

                {/* Time */}
                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground/80">{formatRelativeTime(submission.submittedAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
