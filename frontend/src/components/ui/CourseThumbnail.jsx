import { Heart, PlayCircle } from 'lucide-react';

/**
 * CategoryBadge Component
 * Badge simple untuk kategori course.
 * 
 * @param {string} children - Text kategori
 * @param {string} color - Variant warna ('blue' | 'orange' | 'green')
 */
const CategoryBadge = ({ children, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-600 text-white',
    green: 'bg-emerald-600 text-white',
    orange: 'bg-orange-500 text-white',
  };

  // Logic untuk variety (bisa di-custom sesuai kebutuhan)
  const selectedColor = children && children.length > 7 ? colorClasses.blue : colorClasses.orange;

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${selectedColor}`}>
      {children}
    </span>
  );
};

/**
 * CourseThumbnail Component
 * Section thumbnail course dengan image, overlay, badge, dan interactive elements.
 * 
 * @param {string} thumbnail - URL gambar thumbnail
 * @param {string} alt - Alt text untuk image
 * @param {string} category - Kategori course
 * @param {function} onWishlistClick - Handler untuk wishlist button
 * @param {boolean} isWishlisted - Status wishlist
 */
const CourseThumbnail = ({
  thumbnail,
  alt,
  category,
  onWishlistClick,
  isWishlisted = false
}) => (
  <div className="relative h-48 overflow-hidden">
    {/* Image with Zoom Effect */}
    <img
      src={thumbnail}
      alt={alt}
      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
      loading="lazy"
    />

    {/* Overlay Gradient */}
    <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

    {/* Floating Category Badge */}
    <div className="absolute top-4 left-4 z-10">
      <CategoryBadge>{category}</CategoryBadge>
    </div>

    {/* Wishlist Button */}
    <button
      onClick={onWishlistClick}
      className={`absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm z-10 ${isWishlisted ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
        }`}
    >
      <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
    </button>

    {/* Play Icon on Hover */}
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50">
        <PlayCircle size={32} className="text-white fill-white/20" />
      </div>
    </div>
  </div>
);

export default CourseThumbnail;
