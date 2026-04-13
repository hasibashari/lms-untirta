import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  ClipboardList,
  User,
  Hash,
  ArrowRight,
  Clock,
  FileText,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { getMyCourses } from '../courseService';
import { getMaterials } from '../../material/materialService';
import { getAssignments } from '../../assignment/assignmentService';
import Breadcrumb from '../../../components/navigation/Breadcrumb';
import { Button } from '@/components/ui/button';

/**
 * CourseHome - Halaman Detail Kelas
 * Terinspirasi dari Dicoding: menampilkan overview kelas dan silabus
 */
const CourseHome = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    if (!courseId || courseId === 'undefined') return;
    setLoading(true);
    setError(null);

    Promise.all([
      getAssignments(courseId),
      getMyCourses(),
      getMaterials(courseId),
    ])
      .then(([assignmentsRes, coursesRes, materialsRes]) => {
        setAssignments(assignmentsRes.data);
        setMaterials(materialsRes.data);

        const foundCourse = coursesRes.data.find(
          item => item.course.id === courseId || item.course.id === parseInt(courseId)
        );
        setCourse(foundCourse?.course);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Gagal memuat data kelas');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  if (!courseId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-slate-500">Memuat data kelas...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="h-40 bg-slate-200 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <p className="text-slate-600 text-center">{error}</p>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={16} />
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Kelas Saya', to: '/mahasiswa/classes' },
          { label: course?.title || 'Kelas' },
        ]}
      />

      {/* Course Header Card - Blue Dominant Theme */}
      <div className="bg-linear-to-br from-blue-700 to-blue-800 rounded-2xl overflow-hidden relative shadow-md">
        {/* Subtle decorative pattern or glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="relative p-6 lg:p-8 z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
          <div className="flex-1 min-w-0">
            {/* Course Code Badge */}
            <span className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors border border-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-md mb-4 shadow-sm">
              <Hash size={12} />
              {course?.code || 'KELAS'}
            </span>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 tracking-tight drop-shadow-sm wrap-break-word">
              {course?.title || 'Nama Kelas'}
            </h1>

            {/* Description (if available) */}
            {course?.description && (
              <p className="text-blue-50 text-sm max-w-2xl leading-relaxed mt-2 mb-2 line-clamp-3 md:line-clamp-none">
                {course.description}
              </p>
            )}
          </div>
          
          <div className="w-full md:w-72 lg:w-80 shrink-0 flex items-center gap-4 p-4 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm shadow-inner transition-colors hover:bg-white/15">
            <div className="shrink-0 w-12 h-12 rounded-full bg-blue-600/50 border border-blue-400/50 flex items-center justify-center text-white shadow-sm">
              <User size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-blue-200 font-semibold mb-1">Dosen Pengampu</p>
              <p className="font-semibold text-white drop-shadow-sm truncate text-sm sm:text-base" title={course?.teacher?.name || 'Belum Diatur'}>
                {course?.teacher?.name || 'Belum Diatur'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => navigate(`/mahasiswa/courses/${courseId}/materials`)}
          className="group flex items-center gap-4 p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md hover:bg-slate-50 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 group-hover:scale-105 transition-all duration-300">
            <BookOpen size={24} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">Materi Pembelajaran</h3>
            <p className="text-sm text-slate-500 mt-0.5">{materials.length} materi tersedia</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors">
            <ArrowRight size={16} className="text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </div>

        <div
          onClick={() => navigate(`/mahasiswa/courses/${courseId}/assignments`)}
          className="group flex items-center gap-4 p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md hover:bg-slate-50 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 group-hover:scale-105 transition-all duration-300">
            <ClipboardList size={24} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">Tugas Akademik</h3>
            <p className="text-sm text-slate-500 mt-0.5">{assignments.length} tugas tersedia</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors">
            <ArrowRight size={16} className="text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>

      {/* Silabus Section */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Silabus Materi</h2>
          <p className="text-sm text-slate-500 mt-1">Daftar perjalanan pembelajaran Anda di kelas ini</p>
        </div>

        {materials.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
              <FileText size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Belum ada materi di kelas ini</p>
            <p className="text-sm text-slate-400 mt-1">Materi akan muncul setelah dosen mengunggahnya</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {materials.map((material, index) => (
              <Link
                key={material.id}
                to={`/mahasiswa/courses/${courseId}/materials/${material.id}`}
                className="flex items-center gap-4 p-4 sm:p-5 hover:bg-slate-50 transition-colors group"
              >
                {/* Number indicator */}
                <div className="shrink-0 w-8 h-8 rounded bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-sm flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-700 transition-colors">
                  {material.order || index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-800 group-hover:text-indigo-700 transition-colors truncate">
                    {material.title}
                  </h3>
                </div>

                {/* Arrow */}
                <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:-rotate-45 transition-all opacity-0 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        )}

        {/* View All Link */}
        {materials.length > 0 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100">
            <Link
              to={`/mahasiswa/courses/${courseId}/materials`}
              className="flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-indigo-600 font-medium transition-colors"
            >
              Lihat Seluruh Materi
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </section>

      {/* Recent Assignments */}
      {assignments.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tugas Terbaru</h2>
              <p className="text-sm text-slate-500 mt-1">Evaluasi yang perlu Anda perhatikan</p>
            </div>
            <Link
              to={`/mahasiswa/courses/${courseId}/assignments`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {assignments.slice(0, 4).map((assignment) => (
              <div
                key={assignment.id}
                onClick={() =>
                  navigate(`/mahasiswa/courses/${courseId}/assignments/${assignment.id}`)
                }
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                {/* Icon */}
                <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hidden sm:flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                  <ClipboardList size={20} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-800 group-hover:text-indigo-700 transition-colors truncate">
                    {assignment.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5">
                    <Clock size={14} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    <span>
                      Tenggat: {new Date(assignment.dueDate).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0 mt-2 sm:mt-0">
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                    assignment.status === 'submitted'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {assignment.status === 'submitted' ? 'Selesai' : 'Belum Dikerjakan'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CourseHome;
