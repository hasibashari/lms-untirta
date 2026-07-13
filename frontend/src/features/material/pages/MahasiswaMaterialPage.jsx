import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  ArrowRight,
  ChevronLeft,
  Hash,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useMahasiswaMaterials } from '../hooks/useMahasiswaMaterials';
import Breadcrumb from '@/shared/components/navigation/Breadcrumb';
import { Button } from '@/shared/components/ui/button';

/**
 * CourseMaterials - Halaman Daftar Materi / Silabus
 * Terinspirasi dari Dicoding: menampilkan silabus dengan progress visual
 */
const CourseMaterials = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  
  const {
    materials,
    course,
    loading,
    error,
    fetchData,
  } = useMahasiswaMaterials(classId);

  if (!classId) {
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
          { label: 'Kelas Saya', to: '/mahasiswa/classes' },
          { label: course?.title || 'Kelas', to: `/mahasiswa/classes/${classId}` },
          { label: 'Materi' },
        ]}
      />

      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(`/mahasiswa/classes/${classId}`)}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium -ml-2"
      >
        <ChevronLeft size={20} />
        Kembali ke Kelas
      </Button>

      {/* Course Header Mini */}
      <div className={`bg-linear-to-r ${gradientClass} rounded-2xl overflow-hidden`}>
        <div className="relative p-6">
          <div className="absolute inset-0 bg-blue-700"></div>
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
          <h2 className="text-xl font-bold text-foreground">Daftar Materi</h2>
          <p className="text-sm text-muted-foreground">
            {materials.length} materi pembelajaran tersedia
          </p>
        </div>
      </div>

      {/* Materials List */}
      {materials.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <FileText size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Belum Ada Materi
          </h3>
          <p className="text-muted-foreground">
            Materi pembelajaran belum tersedia untuk kelas ini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material, index) => (
            <Link
              key={material.id}
              to={`/mahasiswa/classes/${classId}/materials/${material.id}`}
              className="group block"
            >
              <div className="flex items-center gap-4 p-5 bg-card rounded-xl border border-border shadow-sm hover:border-primary/50 hover:shadow-lg transition-all">
                {/* Order Number */}
                <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {material.order || index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {material.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Materi {material.order || index + 1} dari {materials.length}
                  </p>
                </div>

                {/* Action Arrow */}
                <div className="shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary transition-colors">
                  <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                </div>
              </div>
            </Link>
          ))}
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
              to={`/mahasiswa/classes/${classId}/materials/${materials[0]?.id}`}
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
