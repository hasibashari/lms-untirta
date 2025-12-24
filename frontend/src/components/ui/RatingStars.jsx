import { Star } from 'lucide-react';

/**
 * RatingStars Component
 * Menampilkan rating dengan bintang icon dan nilai numerik.
 * 
 * @param {number} rating - Nilai rating (0-5)
 * @param {number} size - Ukuran icon dalam pixels (default: 14)
 * @param {boolean} showValue - Tampilkan nilai rating atau tidak (default: true)
 * @param {string} className - Additional CSS classes
 */
const RatingStars = ({
  rating,
  size = 14,
  showValue = true,
  className = ''
}) => (
  <div className={`flex items-center gap-1 text-yellow-400 ${className}`}>
    <Star size={size} fill="currentColor" />
    {showValue && (
      <span className="text-sm font-bold text-slate-700 ml-0.5">{rating}</span>
    )}
  </div>
);

export default RatingStars;
