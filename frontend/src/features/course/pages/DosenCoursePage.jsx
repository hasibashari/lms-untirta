import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  ClipboardList,
  Users,
  Hash,
  ArrowRight,
  FileText,
  Plus,
  Inbox,
  User,
  Award,
} from 'lucide-react';
import { getMyCourses, getCourseStudents } from '../courseService';
import { getMaterials } from '../../material/materialService';
import { getAssignments } from '../../assignment/assignmentService';
import Breadcrumb from '../../../components/navigation/Breadcrumb';

/**
 * TeacherCourseHome - Halaman Detail Kelas Dosen
 * Menampilkan overview kelas yang diampu dengan akses cepat ke fitur management
 */
export default function CourseHome() {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId || courseId === 'undefined') return;

    setLoading(true);
    Promise.all([
      getMyCourses(),
      getMaterials(courseId),
      getAssignments(courseId),
      getCourseStudents(courseId),
    ])
      .then(([coursesRes, materialsRes, assignmentsRes, studentsRes]) => {
        // Find this course from teacher's courses
        const foundCourse = coursesRes.data.find(
          c => c.id === courseId || c.id === parseInt(courseId)
        );
        setCourse(foundCourse);
        setMaterials(materialsRes.data || []);
        setAssignments(assignmentsRes.data || []);
        setStudents(studentsRes.data || []);
      })
      .catch(err => setError(err?.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (!courseId || courseId === 'undefined') {
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
          onClick={() => window.location.reload()}
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
  const gradientClass = course?.id ? gradients[course.id % gradients.length] : gradients[0];

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
      to: `/dosen/courses/${courseId}/materials`,
      action: {
        label: 'Tambah Materi',
        to: `/dosen/courses/${courseId}/materials/new`,
      },
    },
    {
      title: 'Kelola Tugas',
      description: `${assignments.length} tugas dibuat`,
      icon: ClipboardList,
      color: 'emerald',
      to: `/dosen/courses/${courseId}/assignments`,
      action: {
        label: 'Buat Tugas',
        to: `/dosen/courses/${courseId}/assignments/new`,
      },
    },
    {
      title: 'Daftar Mahasiswa',
      description: `${students.length} mahasiswa terdaftar`,
      icon: Users,
      color: 'violet',
      to: `/dosen/courses/${courseId}/students`,
    },
    {
      title: 'Cek Submission',
      description: 'Lihat pengumpulan tugas',
      icon: Inbox,
      color: 'orange',
      to: `/dosen/courses/${courseId}/submissions`,
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
          { label: course?.title || 'Kelas' },
        ]}
      />

      {/* Course Header Card */}
      <div className={`bg-linear-to-r ${gradientClass} rounded-2xl overflow-hidden`}>
        <div className="relative p-6 lg:p-8">
          <div className="absolute inset-0 bg-blue-600"></div>
          <div className="relative z-10">
            {/* Course Code Badge */}
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
              <Hash size={14} />
              {course?.code || 'KELAS'}
            </span>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">
              {course?.title || 'Nama Kelas'}
            </h1>

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
          {quickActions.map((action) => {
            const Icon = action.icon;
            const colors = colorClasses[action.color];

            return (
              <div
                key={action.title}
                className={`group bg-card rounded-xl border border-border shadow-sm ${colors.border} hover:shadow-lg transition-all overflow-hidden`}
              >
                <Link
                  to={action.to}
                  className="flex items-center gap-4 p-5"
                >
                  <div className={`w-14 h-14 rounded-xl ${colors.bg} ${colors.bgHover} flex items-center justify-center transition`}>
                    <Icon size={28} className={colors.text} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{action.title}</h3>
                    <p className="text-sm text-slate-500">{action.description}</p>
                  </div>
                  <ArrowRight size={20} className={`text-slate-400 group-hover:${colors.text} group-hover:translate-x-1 transition-all`} />
                </Link>

                {/* Quick Add Button */}
                {action.action && (
                  <div className="px-5 pb-4">
                    <Link
                      to={action.action.to}
                      className={`inline-flex items-center gap-1.5 text-sm font-medium ${colors.text} hover:underline`}
                    >
                      <Plus size={16} />
                      {action.action.label}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
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
              to={`/dosen/courses/${courseId}/materials/new`}
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
                to={`/dosen/courses/${courseId}/materials`}
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
              to={`/dosen/courses/${courseId}/materials/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              Tambah Materi
            </Link>
            <Link
              to={`/dosen/courses/${courseId}/assignments/new`}
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
