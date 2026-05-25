import { useNavigate } from 'react-router-dom';

// Import Components (Sections)
import HeroSection from '../components/HeroSection';
import CourseSection from '../components/CourseSection';
import TestimonialSection from '../components/TestimonialSection';
import PoweredBySection from '../components/PoweredBySection';

// Import Data from constants
import { COURSES_DATA, TESTIMONIALS, PARTNERS } from '@/shared/utils/constants';

/**
 * Home Page
 * 
 * Halaman landing page utama.
 * Bertanggung jawab untuk:
 * - Mengatur susunan section/komponen
 * - Data fetching dan state management tingkat halaman
 * - Meneruskan data ke komponen presentational
 * 
 * Page TIDAK:
 * - Mengatur detail UI kecil (tugas Component)
 * - Mengatur struktur global seperti Navbar/Footer (tugas Layout)
 */
const Home = () => {
  const navigate = useNavigate();

  // Handler untuk navigasi ke halaman courses
  const handleViewAllCourses = () => {
    navigate('/courses');
  };

  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Partners/Powered By Section */}
      <PoweredBySection partners={PARTNERS} />

      {/* Course Section */}
      <CourseSection
        courses={COURSES_DATA}
        title="Jelajahi Kursus"
        subtitle="Tingkatkan keahlianmu dengan materi terbaik dari para ahli."
        onViewAll={handleViewAllCourses}
      />

      {/* Testimonial Section */}
      <TestimonialSection
        testimonials={TESTIMONIALS}
        title={`Cerita Sukses dari\nKomunitas Belajar Kami`}
        subtitle="Kata Mereka"
      />
    </>
  );
};

export default Home;
