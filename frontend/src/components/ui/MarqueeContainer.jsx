
/**
 * MarqueeContainer Component
 * Container untuk marquee dengan gradient fade masks di kiri dan kanan.
 * 
 * @param {node} children - Konten marquee (track)
 * @param {string} className - Additional CSS classes
 */
const MarqueeContainer = ({ children, className = '' }) => (
  <div className={`relative w-full ${className}`}>
    {/* Gradient Masks (Fade Effect di Kiri Kanan) */}
    <div className="absolute top-0 left-0 h-full w-24 md:w-48 bg-linear-to-r from-white to-transparent z-10 pointer-events-none" />
    <div className="absolute top-0 right-0 h-full w-24 md:w-48 bg-linear-to-l from-white to-transparent z-10 pointer-events-none" />

    {/* Scrolling Content */}
    <div className="flex overflow-hidden">
      {children}
    </div>
  </div>
);

export default MarqueeContainer;
