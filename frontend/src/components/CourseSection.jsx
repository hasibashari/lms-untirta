import { MoreHorizontal } from 'lucide-react';
import { CourseCard } from './course';

/**
 * CourseSection Component
 * 
 * Section untuk menampilkan daftar kursus dalam grid layout.
 * Menerima data kursus via props dari Page.
 * Mengatur layout grid yang responsif untuk card kursus.
 * 
 * @param {Array} courses - Array of course objects
 * @param {string} title - Section title
 * @param {string} subtitle - Section subtitle
 * @param {function} onViewAll - Handler for "View All" button
 * @param {string} className - Additional CSS classes
 */
const CourseSection = ({
  courses = [],
  title = "Jelajahi Kursus",
  subtitle = "Tingkatkan keahlianmu dengan materi terbaik dari para ahli.",
  onViewAll,
  className = ''
}) => {
  if (!courses.length) {
    return null;
  }

  return (
    <section className={`py-16 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-500">{subtitle}</p>
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 transition-colors"
            >
              Lihat Semua <MoreHorizontal size={20} />
            </button>
          )}
        </div>

        {/* Grid Layout Container */}
        {/* Responsive Grid: 1 col (mobile), 2 cols (tablet), 3 cols (desktop), 4 cols (large) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default CourseSection;
