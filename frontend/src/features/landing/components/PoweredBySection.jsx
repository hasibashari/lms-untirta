import React from 'react';

// Import Child Components
import SectionHeader from '@/shared/components/layout/SectionHeader';
import PartnerLogo from '@/shared/components/branding/PartnerLogo';
import MarqueeContainer from '@/shared/components/layout/MarqueeContainer';
import MarqueeTrack from '@/shared/components/layout/MarqueeTrack';

/**
 * PoweredBySection Component
 * 
 * Section untuk menampilkan logo partners/mitra dengan animasi marquee.
 * Komponen presentational yang menerima data via props.
 * TIDAK menyimpan hardcoded data - data harus diterima dari Page.
 * 
 * @param {Array} partners - Array of partner objects {name, logo}
 * @param {string} badge - Badge text above title
 * @param {string} title - Section title
 * @param {string} className - Additional CSS classes
 */
const PoweredBySection = ({
  partners = [],
  badge = "Kolaborasi Nasional",
  title = "Didukung Oleh Perguruan Tinggi Terbaik",
  className = ''
}) => {
  // Menggandakan array agar animasi loop tidak terputus (Seamless Loop)
  const marqueeItems = [...partners, ...partners];

  if (!partners.length) {
    return null;
  }

  return (
    <section className={`py-12 bg-white border-y border-slate-100 overflow-hidden ${className}`}>

      {/* Header */}
      <SectionHeader
        badge={badge}
        title={title}
        badgeColor="blue"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10"
      />

      {/* Marquee Container dengan Gradient Masks */}
      <MarqueeContainer>
        <MarqueeTrack
          items={marqueeItems}
          renderItem={(partner) => (
            <PartnerLogo data={partner} />
          )}
          speed={40}
        />
      </MarqueeContainer>

    </section>
  );
};

export default PoweredBySection;