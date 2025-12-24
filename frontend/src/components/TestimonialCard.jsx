import { Star, Quote } from 'lucide-react';

/**
 * RatingStars Component
 * Menampilkan bintang rating untuk testimoni.
 * 
 * @param {number} count - Jumlah bintang yang terisi (1-5)
 */
const RatingStars = ({ count }) => (
  <div className="flex gap-0.5 mb-3">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        className={`${i < count ? "fill-orange-400 text-orange-400" : "fill-gray-200 text-gray-200"}`}
      />
    ))}
  </div>
);

/**
 * TestimonialCard Component
 * 
 * Komponen presentational murni untuk menampilkan satu testimoni.
 * TIDAK mengatur layout halaman, TIDAK menyimpan hardcoded data.
 * Data diterima via props dari parent (page/section).
 * 
 * @param {object} data - Data testimoni {id, name, role, content, rating, avatar}
 * @param {string} className - Additional CSS classes (optional)
 */
const TestimonialCard = ({ data, className = '' }) => (
  <div className={`snap-center bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 relative flex flex-col h-full hover:shadow-md transition-shadow duration-300 ${className}`}>

    {/* Watermark Icon */}
    <Quote className="absolute top-6 right-6 text-blue-50 opacity-50 transform rotate-180" size={64} />

    {/* Content */}
    <div className="relative z-10 flex flex-col h-full">
      <RatingStars count={data.rating} />

      <p className="text-slate-600 italic mb-6 leading-relaxed grow">
        "{data.content}"
      </p>

      {/* User Info */}
      <div className="flex items-center gap-4 mt-auto pt-6 border-t border-slate-50">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-slate-100">
          <img
            src={data.avatar}
            alt={data.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/150' }}
          />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm">{data.name}</h4>
          <p className="text-xs text-blue-600 font-medium">{data.role}</p>
        </div>
      </div>
    </div>
  </div>
);

export default TestimonialCard;
