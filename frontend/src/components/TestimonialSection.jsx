import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TestimonialCard from './TestimonialCard';

/**
 * TestimonialSection Component
 * 
 * Section untuk menampilkan testimoni dengan scrollable carousel.
 * Komponen ini bertanggung jawab untuk:
 * - Mengatur layout carousel (horizontal scroll)
 * - Mengelola scroll navigation
 * - Menerima data testimoni via props
 * 
 * TIDAK menyimpan hardcoded data - data harus diterima dari Page.
 * 
 * @param {Array} testimonials - Array of testimonial objects
 * @param {string} title - Section title
 * @param {string} subtitle - Section subtitle
 * @param {string} className - Additional CSS classes
 */
const TestimonialSection = ({
  testimonials = [],
  title = "Cerita Sukses dari Komunitas Belajar Kami",
  subtitle = "Kata Mereka",
  className = ''
}) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!testimonials.length) {
    return null;
  }

  return (
    <section className={`py-20 bg-slate-50 relative overflow-hidden ${className}`}>
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-slate-200 to-transparent"></div>
      <div className="absolute -left-20 top-40 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute -right-20 bottom-40 w-72 h-72 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-blue-600 font-semibold tracking-wide uppercase text-sm mb-2">
              {subtitle}
            </h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
              {title.split('\n').map((line, i) => (
                <span key={i}>
                  {i === 1 ? (
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
                      {line}
                    </span>
                  ) : line}
                  {i < title.split('\n').length - 1 && <br />}
                </span>
              ))}
            </h3>
          </div>

          {/* Navigation Buttons (Desktop) */}
          <div className="hidden md:flex gap-3">
            <button
              onClick={() => scroll('left')}
              className="p-3 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95 shadow-sm"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-3 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95 shadow-sm"
              aria-label="Next testimonial"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scroll-smooth hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {testimonials.map((item) => (
            <TestimonialCard
              key={item.id}
              data={item}
              className="min-w-75 md:min-w-87.5 lg:min-w-100"
            />
          ))}

          {/* Spacer at the end for better scrolling experience */}
          <div className="w-4 shrink-0"></div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden justify-center gap-4 mt-4">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-white shadow text-blue-600"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-white shadow text-blue-600"
            aria-label="Next testimonial"
          >
            <ChevronRight size={20} />
          </button>
        </div>

      </div>

      {/* Styles for animation */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </section>
  );
};

export default TestimonialSection;
