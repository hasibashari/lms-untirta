import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Hash, ArrowRight } from 'lucide-react';

/**
 * StudentCourseCard Component
 * Card component untuk menampilkan kelas mahasiswa dari endpoint /courses/me
 * 
 * Props dari backend:
 * - course.title (nama kelas)
 * - course.code (kode kelas)
 * - course.teacher.name (nama dosen)
 * - course.description (deskripsi opsional)
 * 
 * @param {object} enrollment - Data enrollment dari API
 */
const StudentCourseCard = ({ enrollment }) => {
  const navigate = useNavigate();
  const course = enrollment.course;

  const handleClick = () => {
    navigate(`/mahasiswa/courses/${course.id}`);
  };

  // Generate warna gradient berdasarkan course id untuk variasi visual
  const gradients = [
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-violet-500 to-violet-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
  ];
  const gradientClass = gradients[course.id % gradients.length];

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
    >
      {/* Header dengan gradient */}
      <div className={`h-24 bg-linear-to-r ${gradientClass} relative`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute bottom-4 left-5">
          <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
            <Hash size={12} />
            {course.code}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col grow p-5">
        {/* Title */}
        <h3 className="font-bold text-lg text-slate-900 leading-snug mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {course.title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <User size={16} className="text-slate-500" />
          </div>
          <span className="font-medium">{course.teacher?.name || 'Dosen'}</span>
        </div>

        {/* Description preview (jika ada) */}
        {course.description && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-4">
            {course.description}
          </p>
        )}

        {/* Spacer */}
        <div className="mt-auto"></div>

        {/* Footer Action */}
        <div className="pt-4 border-t border-slate-100">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 font-medium rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
            <BookOpen size={18} />
            <span>Masuk Kelas</span>
            <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentCourseCard;
