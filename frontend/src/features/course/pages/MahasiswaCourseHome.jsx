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

  useEffect(() => {
    if (!courseId || courseId === 'undefined') return;

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
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
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

  // Generate warna gradient berdasarkan course id
  const gradients = [
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-violet-500 to-violet-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
  ];
  const gradientClass = course?.id ? gradients[course.id % gradients.length] : gradients[0];

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/mahasiswa/dashboard' },
          { label: course?.title || 'Kelas' },
        ]}
      />

      {/* Course Header Card */}
      <div className={`bg-linear-to-r ${gradientClass} rounded-2xl overflow-hidden`}>
        <div className="relative p-6 lg:p-8">
          <div className="absolute inset-0 bg-black/10"></div>
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

            {/* Instructor */}
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <p className="font-medium">{course?.teacher?.name || 'Dosen'}</p>
                <p className="text-sm text-white/70">Dosen Pengampu</p>
              </div>
            </div>

            {/* Description (if available) */}
            {course?.description && (
              <p className="mt-4 text-white/80 max-w-2xl">
                {course.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/mahasiswa/courses/${courseId}/materials`)}
          className="group flex items-center gap-4 p-5 h-auto justify-start hover:border-blue-300 hover:shadow-lg"
        >
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition">
            <BookOpen size={28} className="text-blue-600" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-slate-900">Materi Pembelajaran</h3>
            <p className="text-sm text-slate-500">{materials.length} materi tersedia</p>
          </div>
          <ArrowRight size={20} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate(`/mahasiswa/courses/${courseId}/assignments`)}
          className="group flex items-center gap-4 p-5 h-auto justify-start hover:border-green-300 hover:shadow-lg"
        >
          <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition">
            <ClipboardList size={28} className="text-green-600" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-slate-900">Tugas</h3>
            <p className="text-sm text-slate-500">{assignments.length} tugas tersedia</p>
          </div>
          <ArrowRight size={20} className="text-slate-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
        </Button>
      </div>

      {/* Silabus Section */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Silabus Materi</h2>
          <p className="text-sm text-slate-500 mt-1">Daftar materi yang akan Anda pelajari</p>
        </div>

        {materials.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <FileText size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500">Belum ada materi di kelas ini</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {materials.map((material, index) => (
              <Link
                key={material.id}
                to={`/mahasiswa/courses/${courseId}/materials/${material.id}`}
                className="flex items-center gap-4 p-5 hover:bg-slate-50 transition group"
              >
                {/* Number/Progress indicator */}
                <div className="shrink-0 w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center">
                  {material.order || index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 group-hover:text-blue-600 transition truncate">
                    {material.title}
                  </h3>
                </div>

                {/* Arrow */}
                <ArrowRight size={18} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        )}

        {/* View All Link */}
        {materials.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <Link
              to={`/mahasiswa/courses/${courseId}/materials`}
              className="flex items-center justify-center gap-2 text-blue-600 font-medium hover:underline"
            >
              Lihat Semua Materi
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </section>

      {/* Recent Assignments */}
      {assignments.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Tugas Terbaru</h2>
            <p className="text-sm text-slate-500 mt-1">Tugas yang perlu Anda kerjakan</p>
          </div>

          <div className="divide-y divide-slate-100">
            {assignments.slice(0, 3).map((assignment) => (
              <div
                key={assignment.id}
                onClick={() =>
                  navigate(`/mahasiswa/courses/${courseId}/assignments/${assignment.id}`)
                }
                className="flex items-center gap-4 p-5 hover:bg-slate-50 transition cursor-pointer group"
              >
                {/* Icon */}
                <div className="shrink-0 w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                  <ClipboardList size={20} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 group-hover:text-green-600 transition truncate">
                    {assignment.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <Clock size={14} />
                    <span>
                      Deadline: {new Date(assignment.dueDate).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${assignment.status === 'submitted'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
                  }`}>
                  {assignment.status === 'submitted' ? 'Selesai' : 'Belum Dikerjakan'}
                </span>
              </div>
            ))}
          </div>

          {assignments.length > 3 && (
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <Button
                variant="link"
                onClick={() => navigate(`/mahasiswa/courses/${courseId}/assignments`)}
                className="flex items-center justify-center gap-2 w-full text-green-600 font-medium"
              >
                Lihat Semua Tugas ({assignments.length})
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default CourseHome;
