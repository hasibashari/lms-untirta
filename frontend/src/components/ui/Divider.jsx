
/**
 * Divider Component
 * Reusable divider dengan text di tengah.
 * Dapat digunakan sebagai separator antara sections.
 * 
 * @param {string} text - Text yang ditampilkan di tengah divider
 * @param {string} className - Additional CSS classes (optional)
 */
const Divider = ({ text, className = '' }) => (
  <div className={`flex items-center ${className}`}>
    <div className="grow border-t border-gray-200"></div>
    {text && (
      <span className="shrink-0 mx-4 text-gray-400 text-sm">{text}</span>
    )}
    <div className="grow border-t border-gray-200"></div>
  </div>
);

export default Divider;
