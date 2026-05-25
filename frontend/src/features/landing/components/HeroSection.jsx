import { useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, CheckCircle, Users } from 'lucide-react';

// Import Child Components
import { Badge } from '@/shared/components/ui/badge';
import SearchBar from '@/shared/components/forms/SearchBar';
import StatsGrid from '@/shared/components/data-display/StatsGrid';
import UserAvatars from '@/shared/components/data-display/UserAvatars';
import HeroVisual from './HeroVisual';

// --- HeroSection Component (Parent) ---
/**
 * HeroSection Component
 * 
 * Section hero utama untuk landing page.
 * Bertanggung jawab untuk:
 * - Mengelola search state
 * - Menyusun layout 2-column (text + visual)
 * - Mengkoordinasikan child components
 * - Handle search submission
 * 
 * Architecture:
 * - PillBadge: Badge highlight di atas headline
 * - SearchBar: Search input untuk cari kursus
 * - StatsGrid: Trust indicators (stats)
 * - UserAvatars: Social proof dengan avatar
 * - HeroVisual: Right side image dengan floating cards
 */

const HeroSection = () => {
  // State Management
  const [searchQuery, setSearchQuery] = useState('');

  // Handler untuk search
  const handleSearch = (e) => {
    e.preventDefault();
    toast(`Mencari kursus: ${searchQuery}`);
  };

  // Data Configuration
  const stats = [
    { value: '300+', label: 'Mitra Kampus' },
    { value: '15k+', label: 'Modul Ajar' },
    { value: '1.2M+', label: 'Mahasiswa' }
  ];

  const floatingCards = [
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
  ];

  return (
    <section className="relative bg-white overflow-hidden">

      {/* Background Decor: Gradient Blob yang halus */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-150 h-150 bg-blue-50/50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-100 h-100 bg-orange-50/50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* 1. Left Column: Text & Actions */}
          <div className="relative z-10 max-w-2xl">

            {/* Badge */}
            <Badge variant="outline" className="mb-6 rounded-full bg-blue-100/50 text-blue-700 border-blue-100 px-3 py-1 gap-2 text-sm font-semibold">
              <Sparkles size={16} className="text-orange-500" />
              <span>Platform Pembelajaran Digital #1</span>
            </Badge>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
              Akses Pendidikan <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
                Berkualitas & Inklusif
              </span> <br />
              Tanpa Batas.
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
              Bergabunglah dengan ekosistem SPADA Indonesia. Temukan ribuan mata kuliah dari perguruan tinggi terbaik, tingkatkan kompetensi, dan raih masa depan gemilang.
            </p>

            {/* Search Bar Action */}
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSubmit={handleSearch}
              placeholder="Cari mata kuliah, topik, atau keahlian..."
              buttonText="Cari"
              className="mb-8"
            />

            {/* Quick Stats / Trust Indicators */}
            <StatsGrid stats={stats} className="pt-4" />

            {/* Secondary Link / Social Proof */}
            <UserAvatars
              text="Bergabung bersama mahasiswa lainnya hari ini."
              className="mt-8"
            />

          </div>

          {/* 2. Right Column: Hero Visual/Image */}
          <HeroVisual
            floatingCards={floatingCards}
            showDecorations={true}
          />

        </div>
      </div>

      {/* Styles for custom animation */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        .animate-bounce-slow {
          animation: bounce 3s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(5%); }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;