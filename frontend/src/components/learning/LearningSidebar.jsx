import { Link, useNavigate } from 'react-router-dom';
import {
  X,
  ArrowLeft,
  Home,
} from 'lucide-react';

/**
 * LearningSidebar Component
 * Sidebar navigasi materi saat membaca/belajar
 * Terinspirasi dari Dicoding untuk navigasi antar materi
 * 
 * @param {array} materials - Daftar semua materi
 * @param {string} currentMaterialId - ID materi yang sedang dibaca
 * @param {string} courseId - ID kelas
 * @param {object} course - Data kelas
 * @param {boolean} isOpen - Status buka/tutup sidebar (mobile)
 * @param {function} onClose - Callback untuk menutup sidebar (mobile)
 */
const LearningSidebar = ({
  materials = [],
  currentMaterialId,
  courseId,
  course,
  isOpen = false,
  onClose = () => { },
}) => {
  const navigate = useNavigate();
  const currentIndex = materials.findIndex(
    m => m.id === parseInt(currentMaterialId) || m.id === currentMaterialId
  );

  return (
    <>
      {/* Mobile Overlay - only show on mobile when open */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-dvh w-80 bg-white border-r border-slate-200 z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4">
          <button
            onClick={() => navigate(`/mahasiswa/courses/${courseId}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Kembali</span>
          </button>

          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Course Title */}
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 line-clamp-2">
            {course?.title || 'Nama Kelas'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {materials.length} Materi
          </p>
        </div>

        {/* Materials List */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {materials.map((material, index) => {
              const isActive = material.id === parseInt(currentMaterialId) || material.id === currentMaterialId;

              return (
                <li key={material.id}>
                  <Link
                    to={`/mahasiswa/courses/${courseId}/materials/${material.id}`}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-xl transition-all
                      ${isActive
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                      }
                    `}
                  >
                    {/* Number */}
                    <div className={`
                      shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}
                    `}>
                      {material.order || index + 1}
                    </div>

                    {/* Title */}
                    <span className="flex-1 text-sm line-clamp-2">
                      {material.title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Back to Course Home */}
        <div className="p-4 border-t border-slate-100">
          <Link
            to={`/mahasiswa/courses/${courseId}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition"
          >
            <Home size={18} />
            Kembali ke Kelas
          </Link>
        </div>
      </aside>
    </>
  );
};

export default LearningSidebar;
