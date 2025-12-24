
/**
 * CourseInstructor Component
 * Menampilkan informasi instructor dengan avatar dan nama.
 * 
 * @param {string} name - Nama instructor
 * @param {string} avatar - URL avatar instructor
 * @param {string} className - Additional CSS classes
 */
const CourseInstructor = ({ name, avatar, className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <img
      src={avatar}
      alt={name}
      className="w-6 h-6 rounded-full border border-slate-200"
      loading="lazy"
    />
    <span className="text-sm text-slate-600 font-medium truncate">
      {name}
    </span>
  </div>
);

export default CourseInstructor;
