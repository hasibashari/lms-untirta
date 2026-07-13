import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  ClipboardList,
  Users,
  Hash,
  ArrowRight,
  FileText,
  Plus,
  User,
  MessageSquare,
} from 'lucide-react';
import Breadcrumb from '@/shared/components/navigation/Breadcrumb';
import ActionCard from '@/shared/components/ui/ActionCard';
import { useDosenCourse } from '../hooks/useDosenCourse';

/**
 * TeacherCourseHome - Halaman Detail Kelas Dosen
 * Refactored using Feature-Sliced Design approach
 */
export default function CourseHome() {
  const { classId } = useParams();
  const { classData, materials, assignments, students, loading, error, refetch } = useDosenCourse(classId);

  if (!classId || classId === 'undefined') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-slate-500">Memuat data kelas...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        <div className="h-48 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={refetch}
          className="mt-3 text-sm text-red-600 hover:underline"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  // Generate gradient color based on course id
  const gradients = [
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-violet-500 to-violet-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
  ];
  const gradientClass = classData?.course?.id ? gradients[classData.course.id.charCodeAt(0) % gradients.length] : gradients[0];

  // Stats for header
  const stats = [
    { label: 'Materi', value: materials.length, icon: BookOpen },
    { label: 'Mahasiswa', value: students.length, icon: Users },
    { label: 'Tugas', value: assignments.length, icon: ClipboardList },
  ];

  // Quick actions config
  const quickActions = [
    {
      title: 'Kelola Materi',
      description: `${materials.length} materi tersedia`,
      icon: BookOpen,
      color: 'blue',
      to: `/dosen/classes/${classId}/materials`,
      action: {
        label: 'Tambah Materi',
        to: `/dosen/classes/${classId}/materials/new`,
      },
    },
    {
      title: 'Kelola Tugas',
      description: `${assignments.length} tugas dibuat`,
      icon: ClipboardList,
      color: 'emerald',
      to: `/dosen/classes/${classId}/assignments`,
      action: {
        label: 'Buat Tugas',
        to: `/dosen/classes/${classId}/assignments/new`,
      },
    },
    {
      title: 'Daftar Mahasiswa',
      description: `${students.length} mahasiswa terdaftar`,
      icon: Users,
      color: 'violet',
      to: `/dosen/classes/${classId}/students`,
    },
    {
      title: 'Forum Diskusi',
      description: 'Diskusi dengan mahasiswa',
      icon: MessageSquare,
      color: 'amber',
      to: `/dosen/classes/${classId}/forum`,
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      bgHover: 'group-hover:bg-blue-100',
      text: 'text-blue-600',
      border: 'hover:border-primary/50',
    },
    emerald: {
      bg: 'bg-emerald-50',
      bgHover: 'group-hover:bg-emerald-100',
      text: 'text-emerald-600',
      border: 'hover:border-emerald-300',
    },
    violet: {
      bg: 'bg-violet-50',
      bgHover: 'group-hover:bg-violet-100',
      text: 'text-violet-600',
      border: 'hover:border-violet-300',
    },
    orange: {
      bg: 'bg-orange-50',
      bgHover: 'group-hover:bg-orange-100',
      text: 'text-orange-600',
      border: 'hover:border-orange-300',
    },
    amber: {
      bg: 'bg-amber-50',
      bgHover: 'group-hover:bg-amber-100',
      text: 'text-amber-600',
      border: 'hover:border-amber-300',
    },
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/dosen/dashboard' },
          { label: 'Kelas Saya', to: '/dosen/classes' },
          { label: classData?.course?.title || 'Kelas' },
        ]}
      />

      {/* Course Header Card */}
      <div className={`bg-linear-to-r ${gradientClass} rounded-2xl overflow-hidden`}>
        <div className="relative p-6 lg:p-8">
          <div className="absolute inset-0 bg-blue-700"></div>
          <div className="relative z-10">
            {/* Course Code Badge */}
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
              <Hash size={14} />
              {classData?.course?.code || 'KELAS'}
            </span>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">
              {classData?.course?.title ? `${classData.course.title} - Kelas ${classData.section}` : 'Nama Kelas'}
            </h1>

            {/* Description (if available) */}
            {classData?.course?.description && (
              <p className="text-white/80 text-sm max-w-2xl leading-relaxed mt-2 mb-4 line-clamp-3 md:line-clamp-none">
                {classData.course.description}
              </p>
            )}

            {/* Teacher Info (You) */}
            <div className="flex items-center gap-3 text-white/90 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <p className="font-medium">Anda (Dosen Pengampu)</p>
                <p className="text-sm text-white/70">Halaman manajemen kelas</p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-white/20">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-xs text-white/70">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Kelola Kelas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <ActionCard
              key={action.title}
              title={action.title}
              subtitle={action.description}
              icon={action.icon}
              to={action.to}
              color={action.color}
            >
              {action.action && (
                <Link
                  to={action.action.to}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium ${action.color ? `text-${action.color}-600` : 'text-primary'} hover:underline`}
                  onClick={(e) => e.stopPropagation()} // Prevent triggering parent link if nested inside Link
                >
                  <Plus size={16} />
                  {action.action.label}
                </Link>
              )}
            </ActionCard>
          ))}
        </div>
      </section>

      {/* Recent Materials Preview */}
      {materials.length > 0 && (
        <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Materi Terbaru</h2>
              <p className="text-sm text-slate-500">Preview materi yang sudah ditambahkan</p>
            </div>
            <Link
              to={`/dosen/classes/${classId}/materials/new`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition"
            >
              <Plus size={16} />
              Tambah
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {materials.slice(0, 3).map((material, index) => (
              <div
                key={material.id}
                className="flex items-center gap-4 p-5 hover:bg-slate-50 transition"
              >
                <div className="shrink-0 w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center">
                  {material.order || index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 truncate">
                    {material.title}
                  </h3>
                  <p className="text-sm text-slate-500 truncate">
                    {material.type === 'video' ? '🎬 Video' : '📄 Dokumen'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {materials.length > 3 && (
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <Link
                to={`/dosen/classes/${classId}/materials`}
                className="flex items-center justify-center gap-2 text-blue-600 font-medium hover:underline"
              >
                Lihat Semua Materi ({materials.length})
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Empty State for New Course */}
      {materials.length === 0 && assignments.length === 0 && (
        <section className="bg-card rounded-xl border border-border shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <FileText size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Kelas Masih Kosong
          </h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            Mulai dengan menambahkan materi pembelajaran atau membuat tugas untuk mahasiswa.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to={`/dosen/classes/${classId}/materials/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              Tambah Materi
            </Link>
            <Link
              to={`/dosen/classes/${classId}/assignments/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              <Plus size={18} />
              Buat Tugas
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
