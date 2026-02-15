import {
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  FileText,
  Lock,
  PlayCircle,
  BookOpen,
} from 'lucide-react';

// --- Sub-Components ---

/**
 * LessonIcon Helper
 * Mengembalikan ikon yang sesuai berdasarkan tipe pelajaran.
 */
const getLessonIcon = (type) => {
  switch (type) {
    case 'video': return <PlayCircle size={16} className="text-blue-500" />;
    case 'article': return <FileText size={16} className="text-orange-500" />;
    case 'quiz': return <CheckCircle size={16} className="text-green-500" />;
    case 'assignment': return <BookOpen size={16} className="text-purple-500" />;
    default: return <FileText size={16} className="text-gray-400" />;
  }
};

/**
 * AccordionItem Component
 * Satu baris modul yang bisa di-expand/collapse.
 */
const AccordionItem = ({
  module,
  index,
  isOpen,
  onToggle,
  onLessonDownload,
}) => {
  const lessons = module?.lessons ?? [];
  const moduleCount = module?.moduleCount ?? lessons.length;
  const isLocked = Boolean(module?.isLocked);
  const canToggle = Boolean(onToggle) && !isLocked;

  return (
    <div className={`border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'shadow-md border-blue-200 bg-white' : 'hover:bg-slate-50 bg-white'}`}>

      {/* Header (Clickable) */}
      <button
        type="button"
        onClick={() => onToggle?.(module.id)}
        disabled={!canToggle}
        className="w-full flex items-center justify-between p-5 text-left focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-4">
          {/* Number/Status Indicator */}
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${isLocked ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
            {isLocked ? <Lock size={18} /> : index + 1}
          </div>

          {/* Title & Metadata */}
          <div>
            <h4 className={`font-bold text-lg ${isLocked ? 'text-slate-400' : 'text-slate-900'}`}>
              {module.title}
            </h4>
            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <BookOpen size={14} /> {moduleCount} Materi
              </span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="flex items-center gap-1">
                <Clock size={14} /> {module.duration}
              </span>
            </div>
          </div>
        </div>

        {/* Chevron Icon */}
        <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'}`}>
          <ChevronDown size={20} />
        </div>
      </button>

      {/* Content Body (Lessons List) */}
      {/* Menggunakan max-h untuk animasi slide yang smooth */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-125 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          <ul className="space-y-3">
            {lessons.map((lesson, idx) => (
              <li key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  {getLessonIcon(lesson.type)}
                  <span className="text-slate-700 font-medium group-hover:text-blue-600 transition-colors text-sm">
                    {lesson.title}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {Boolean(onLessonDownload) && lesson.type !== 'quiz' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onLessonDownload?.(module, lesson);
                      }}
                      className="text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Download Materi"
                      aria-label="Download Materi"
                    >
                      <Download size={16} />
                    </button>
                  )}
                  <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">
                    {lesson.duration}
                  </span>
                </div>
              </li>
            ))}

            {/* Empty State jika tidak ada lesson (misal modul terkunci) */}
            {lessons.length === 0 && (
              <li className="text-center text-slate-400 text-sm py-4 italic">
                Materi belum tersedia atau Anda harus menyelesaikan modul sebelumnya.
              </li>
            )}
          </ul>
        </div>
      </div>

    </div>
  );
};

// --- Main Component ---

/**
 * SyllabusSection Component
 *
 * Presentational component untuk menampilkan daftar modul (accordion) kurikulum.
 *
 * Prinsip arsitektur:
 * - TIDAK menyimpan dummy data.
 * - TIDAK menyertakan wrapper demo App.
 * - State (mis. modul mana yang terbuka) dikontrol via props oleh Page/Container.
 * - Menghindari kelas container & breakpoint halaman (max-w, mx-auto, sm:/md:/lg:).
 */
const SyllabusSection = ({
  id = 'syllabus',
  badge = 'Kurikulum & Materi',
  title = 'Apa yang akan Anda pelajari?',
  downloadLabel = 'Unduh Silabus',
  modules = [],
  openModuleId,
  onToggleModule,
  onDownloadSyllabus,
  onLessonDownload,
  className = '',
}) => {
  if (!modules.length) {
    return null;
  }

  return (
    <section id={id} className={className}>
      {/* Header */}
      <div className="space-y-4 mb-10">
        <div>
          <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">
            {badge}
          </h2>
          <h3 className="text-3xl font-extrabold text-slate-900">
            {title}
          </h3>
        </div>

        {onDownloadSyllabus && (
          <button
            type="button"
            onClick={onDownloadSyllabus}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
          >
            <Download size={18} />
            <span>{downloadLabel}</span>
          </button>
        )}
      </div>

      {/* Syllabus List */}
      <div className="space-y-4">
        {modules.map((module, index) => (
          <AccordionItem
            key={module.id}
            module={module}
            index={index}
            isOpen={module.id === openModuleId}
            onToggle={onToggleModule}
            onLessonDownload={onLessonDownload}
          />
        ))}
      </div>
    </section>
  );
};

export default SyllabusSection;