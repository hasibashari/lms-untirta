import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  ClipboardList,
  Inbox,
  Clock,
  Bell,
  LayoutDashboard,
} from 'lucide-react';
import DashboardJumbotron from '@/shared/components/layout/Jumbotron';
import DashboardSkeleton from '@/shared/components/feedback/DashboardSkeleton';
import StatCard from '@/shared/components/ui/StatCard';
import ActionCard from '@/shared/components/ui/ActionCard';
import RecentSubmissionsList from '../components/RecentSubmissionsList';
import { useDosenDashboardData } from '../hooks/useDosenDashboard';

/**
 * TeacherDashboard
 * Halaman utama setelah login untuk dosen
 * Fokus: Overview/ringkasan kelas, stats actionable, dan notifikasi submissions
 */
export default function Dashboard() {
  const { classes, stats, recentSubmissions, loading, error } = useDosenDashboardData();

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
      highlightText: 'Butuh perhatian',
      highlightIcon: Bell,
    },
  ];

  const pendingGradingCount = stats?.pendingGrading || 0;
  const hasPendingGrading = pendingGradingCount > 0;

  if (loading) {
    return <DashboardSkeleton statCount={3} actionCount={3} />;
  }

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
        {statsCards.map((stat) => (
          <StatCard key={stat.label} {...stat} loading={loading} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ActionCard
          title="Kelas Saya"
          subtitle={`${classes.length} kelas diampu`}
          icon={BookOpen}
          to="/dosen/classes"
        />

        <ActionCard
          title="Submissions"
          subtitle={hasPendingGrading ? `${pendingGradingCount} perlu dinilai` : 'Semua sudah dinilai'}
          icon={Inbox}
          to="/dosen/submissions"
          highlight={hasPendingGrading}
          titleClassName={hasPendingGrading ? 'text-amber-900' : 'text-card-foreground'}
          subtitleClassName={hasPendingGrading ? 'text-amber-700' : 'text-muted-foreground'}
          iconClassName={hasPendingGrading ? 'text-amber-600' : 'text-emerald-600'}
          iconContainerClassName={hasPendingGrading ? 'bg-amber-100 group-hover:bg-amber-200' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'}
          arrowClassName={hasPendingGrading ? 'text-amber-400 group-hover:text-amber-600 group-hover:translate-x-1' : 'text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-1'}
        />

        {stats?.recentSubmissions > 0 ? (
          <ActionCard
            title="Submissions Baru"
            subtitle={`${stats.recentSubmissions} dalam 7 hari terakhir`}
            icon={Bell}
            to="/dosen/submissions"
            cardClassName="bg-primary/5 border-primary/20 hover:border-primary/50 hover:shadow-sm"
            iconContainerClassName="bg-primary/10"
            iconClassName="text-primary"
            titleClassName="text-primary"
            subtitleClassName="text-primary/80"
            arrowClassName="text-primary/50 group-hover:text-primary group-hover:translate-x-1"
          />
        ) : (
          <ActionCard
            title="Tidak Ada Baru"
            subtitle="Belum ada submission"
            icon={Clock}
            cardClassName="bg-card border-border"
            iconContainerClassName="bg-muted"
            iconClassName="text-muted-foreground"
            titleClassName="text-muted-foreground"
            subtitleClassName="text-muted-foreground/80"
            arrowClassName="hidden"
          />
        )}
      </div>

      <RecentSubmissionsList submissions={recentSubmissions} />
    </div>
  );
}
