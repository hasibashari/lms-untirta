import { CheckCircle, Users } from 'lucide-react';
import FloatingCard from '../ui/FloatingCard';

/**
 * HeroVisual Component
 * Section visual hero di sebelah kanan dengan gambar dan floating elements.
 * 
 * @param {string} imageUrl - URL gambar utama
 * @param {string} imageAlt - Alt text untuk gambar
 * @param {Array} floatingCards - Array of {icon, title, subtitle, position} untuk floating cards
 * @param {boolean} showDecorations - Toggle untuk decorative elements
 */
const HeroVisual = ({
  imageUrl = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
  imageAlt = 'Students Collaboration',
  floatingCards = [
    {
      icon: CheckCircle,
      title: 'Sertifikat Terbit',
      subtitle: '24,500+ Bulan Ini',
      position: '-left-8 top-12 z-20 hidden md:flex animate-bounce-slow'
    },
    {
      icon: Users,
      title: 'Sedang Belajar',
      subtitle: '4,200+ Mahasiswa',
      position: '-right-8 bottom-24 z-20 hidden md:flex animate-bounce-slow delay-700'
    }
  ],
  showDecorations = true
}) => (
  <div className="relative lg:h-150 flex items-center justify-center lg:justify-end">
    {/* Main Image Container */}
    <div className="relative w-full max-w-md lg:max-w-lg aspect-4/5 lg:aspect-square">

      {/* Abstract Background Element */}
      {showDecorations && (
        <div className="absolute inset-0 bg-blue-600 rounded-4xl rotate-3 transform translate-x-2 translate-y-2 opacity-10"></div>
      )}

      {/* Main Image */}
      <img
        src={imageUrl}
        alt={imageAlt}
        className="relative w-full h-full object-cover rounded-4xl shadow-2xl z-10"
        loading="lazy"
      />

      {/* Floating Cards */}
      {floatingCards.map((card, index) => (
        <FloatingCard
          key={index}
          icon={card.icon}
          title={card.title}
          subtitle={card.subtitle}
          className={card.position}
        />
      ))}

      {/* Decorative Circle */}
      {showDecorations && (
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-orange-400 rounded-full z-0 flex items-center justify-center text-white/20">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
            <circle cx="12" cy="5" r="2" />
          </svg>
        </div>
      )}

    </div>
  </div>
);

export default HeroVisual;
