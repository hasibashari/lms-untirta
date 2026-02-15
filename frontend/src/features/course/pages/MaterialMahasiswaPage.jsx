import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  ArrowRight,
  ChevronLeft,
  Hash,
} from 'lucide-react';
import { getMaterials } from '../../material/materialService';
import { getMyCourses } from '../courseService';
import Breadcrumb from '../../../components/navigation/Breadcrumb';
import { Button } from '@/components/ui/button';

/**
 * CourseMaterials - Halaman Daftar Materi / Silabus
 * Terinspirasi dari Dicoding: menampilkan silabus dengan progress visual
 */
const CourseMaterials = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    Promise.all([getMaterials(courseId), getMyCourses()])
      .then(([materialsRes, coursesRes]) => {
        setMaterials(materialsRes.data);

        const foundCourse = coursesRes.data.find(
          item => item.course.id === parseInt(courseId) || item.course.id === courseId
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
        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-slate-200 rounded-xl"></div>
        ))}
      </div>
    );
  }

  // Generate warna gradient
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
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/mahasiswa/dashboard' },
          { label: course?.title || 'Kelas', to: `/mahasiswa/courses/${courseId}` },
          { label: 'Materi' },
        ]}
      />

      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(`/mahasiswa/courses/${courseId}`)}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium -ml-2"
      >
        <ChevronLeft size={20} />
        Kembali ke Kelas
      </Button>

      {/* Course Header Mini */}
      <div className={`bg-linear-to-r ${gradientClass} rounded-2xl overflow-hidden`}>
        <div className="relative p-6">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full mb-3">
              <Hash size={14} />
              {course?.code || 'KELAS'}
            </span>
            <h1 className="text-xl lg:text-2xl font-bold text-white">
              {course?.title || 'Nama Kelas'}
            </h1>
          </div>
        </div>
      </div>

      {/* Materials Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Daftar Materi</h2>
          <p className="text-sm text-slate-500">
            {materials.length} materi pembelajaran tersedia
          </p>
        </div>
      </div>

      {/* Materials List */}
      {materials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <FileText size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Belum Ada Materi
          </h3>
          <p className="text-slate-500">
            Materi pembelajaran belum tersedia untuk kelas ini.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Progress Line (vertical) */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200 hidden sm:block"></div>

          {/* Materials Items */}
          <div className="space-y-4">
            {materials.map((material, index) => (
              <Link
                key={material.id}
                to={`/mahasiswa/courses/${courseId}/materials/${material.id}`}
                className="group relative block"
              >
                <div className="flex items-stretch gap-4 sm:gap-6 bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all">
                  {/* Number Indicator */}
                  <div className="relative z-10 shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-50 border-4 border-white shadow text-blue-600 font-bold flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                      {material.order || index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition mb-1 truncate">
                      {material.title}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Materi {material.order || index + 1} dari {materials.length}
                    </p>
                  </div>

                  {/* Action Arrow */}
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-600 transition">
                      <ArrowRight size={18} className="text-slate-400 group-hover:text-white transition" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Start Learning CTA */}
      {materials.length > 0 && (
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <BookOpen size={28} className="text-blue-600" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold text-slate-900">Siap untuk belajar?</h3>
              <p className="text-sm text-slate-600">
                Mulai dari materi pertama dan ikuti alur pembelajaran secara berurutan.
              </p>
            </div>
            <Link
              to={`/mahasiswa/courses/${courseId}/materials/${materials[0]?.id}`}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              Mulai Belajar
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseMaterials;
