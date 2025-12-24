/**
 * CourseFooter Component
 * Footer section untuk course card dengan price dan action button.
 * 
 * @param {string} price - Harga course (e.g., "Gratis", "Rp 150.000")
 * @param {string} buttonText - Text untuk action button
 * @param {function} onButtonClick - Handler untuk click button
 * @param {boolean} isFree - Apakah course gratis
 * @param {string} className - Additional CSS classes
 */
const CourseFooter = ({
  price,
  buttonText = 'Detail Kursus',
  onButtonClick,
  isFree = false,
  className = ''
}) => (
  <div className={`p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between ${className}`}>
    <div className="font-bold text-slate-900">
      {isFree || price === 'Gratis' ? (
        <span className="text-green-600">Gratis</span>
      ) : (
        <span>{price}</span>
      )}
    </div>
    <button
      onClick={onButtonClick}
      className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
    >
      {buttonText}
    </button>
  </div>
);

export default CourseFooter;
