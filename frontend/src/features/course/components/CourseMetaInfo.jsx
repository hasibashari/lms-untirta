import { BookOpen, Clock } from 'lucide-react';

/**
 * CourseMetaInfo Component
 * Menampilkan meta informasi course (modules, duration, dll).
 * 
 * @param {number} modules - Jumlah modul
 * @param {string} duration - Durasi course (e.g., "6 Jam")
 * @param {string} className - Additional CSS classes
 */
const CourseMetaInfo = ({ modules, duration, className = '' }) => (
  <div className={`flex gap-3 ${className}`}>
    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
      <BookOpen size={12} className="text-blue-500" />
      <span className="text-xs text-slate-500 font-medium">{modules} Modul</span>
    </div>
    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
      <Clock size={12} className="text-orange-500" />
      <span className="text-xs text-slate-500 font-medium">{duration}</span>
    </div>
  </div>
);

export default CourseMetaInfo;
