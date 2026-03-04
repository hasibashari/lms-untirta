import { Link } from 'react-router-dom';
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
 * @param {function} onBackClick - Callback untuk tombol kembali (header)
 * @param {string} basePath - Base path untuk link navigasi (default: /mahasiswa)
 */
const LearningSidebar = ({
  materials = [],
  currentMaterialId,
  courseId,
  course,
  isOpen = false,
  onClose = () => { },
  onBackClick,
  basePath = '/mahasiswa',
  collapsed = false,
  className = '',
}) => {
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
          fixed top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border z-50 flex flex-col overflow-hidden
          transform transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-80'}
          lg:fixed lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${className}
        `}
      >
        {/* Header */}
        <div className="h-16 border-b border-sidebar-border flex items-center justify-between px-4">
          <button
            onClick={onBackClick}
            className={`flex items-center gap-2 text-muted-foreground hover:text-foreground transition ${collapsed ? 'justify-center' : ''
              }`}
          >
            <ArrowLeft size={18} />
            {!collapsed && <span className="text-sm font-medium">Kembali</span>}
          </button>

          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-sidebar-accent rounded-lg transition"
          >
            <X size={20} className="text-muted-foreground hover:text-sidebar-accent-foreground" />
          </button>
        </div>

        {/* Course Title */}
        <div className={`p-4 border-b border-sidebar-border ${collapsed ? 'px-2' : ''}`}>
          {!collapsed && (
            <>
              <h2 className="font-bold text-sidebar-foreground line-clamp-2">
                {course?.title || 'Nama Kelas'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {materials.length} Materi
              </p>
            </>
          )}
        </div>

        {/* Materials List */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {materials.map((material, index) => {
              const isActive = material.id === parseInt(currentMaterialId) || material.id === currentMaterialId;

              return (
                <li key={material.id}>
                  <Link
                    to={`${basePath}/courses/${courseId}/materials/${material.id}`}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 ${collapsed ? 'px-2 justify-center' : 'px-3'} py-3 rounded-xl transition-all
                      ${isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      }
                    `}
                  >
                    {/* Number */}
                    <div className={`
                      shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-muted text-muted-foreground'}
                    `}>
                      {material.order || index + 1}
                    </div>

                    {/* Title - hide if collapsed */}
                    {!collapsed && (
                      <span className="flex-1 text-sm line-clamp-2">
                        {material.title}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Back to Course Home */}
        <div className={`p-4 border-t border-sidebar-border ${collapsed ? 'px-2' : ''}`}>
          <Link
            to={`${basePath}/courses/${courseId}`}
            className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-muted text-foreground font-medium rounded-xl hover:bg-muted/80 transition ${collapsed ? 'px-2' : ''
              }`}
          >
            <Home size={18} />
            {!collapsed && <span>Kembali ke Kelas</span>}
          </Link>
        </div>
      </aside>
    </>
  );
};

export default LearningSidebar;
