import React from 'react';

/**
 * MarqueeTrack Component
 * Track yang berisi items untuk animasi marquee.
 * Includes CSS animation for infinite scroll.
 * 
 * @param {array} items - Array items untuk ditampilkan
 * @param {function} renderItem - Function untuk render setiap item
 * @param {number} speed - Kecepatan animasi dalam detik (default: 40)
 * @param {string} className - Additional CSS classes
 */
const MarqueeTrack = ({
  items,
  renderItem,
  speed = 40,
  className = ''
}) => (
  <>
    <div
      className={`flex animate-marquee py-4 ${className}`}
      style={{ animationDuration: `${speed}s` }}
    >
      {items.map((item, index) => (
        <React.Fragment key={`${item.name || item.id}-${index}`}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
    </div>

    {/* CSS untuk Animasi Marquee */}
    <style>{`
      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .animate-marquee {
        display: flex;
        width: fit-content;
        animation: marquee 40s linear infinite;
      }
      /* Pause on Hover (UX Tambahan) */
      .animate-marquee:hover {
        animation-play-state: paused;
      }
    `}</style>
  </>
);

export default MarqueeTrack;
