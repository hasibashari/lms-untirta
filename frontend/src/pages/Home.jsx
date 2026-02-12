import { useNavigate } from 'react-router-dom';

import {
  HeroSection,
  CourseSection,
  TestimonialSection,
  PoweredBySection,
} from '../components/landing';

import { COURSES_DATA, TESTIMONIALS, PARTNERS } from '../utils/constants';

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

  const handleViewAllCourses = () => {
    navigate('/courses');
  };

  return (
    <>
      <HeroSection />
      <PoweredBySection partners={PARTNERS} />
      <CourseSection
        courses={COURSES_DATA}
        title="Jelajahi Kursus"
        subtitle="Tingkatkan keahlianmu dengan materi terbaik dari para ahli."
        onViewAll={handleViewAllCourses}
      />
      <TestimonialSection
        testimonials={TESTIMONIALS}
        title={`Cerita Sukses dari\nKomunitas Belajar Kami`}
        subtitle="Kata Mereka"
      />
    </>
  );
};

export default Home;
