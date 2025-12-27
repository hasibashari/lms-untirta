import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/navigation';
import { Footer } from '../components/footer';

/**
 * HomeLayout Component
 * 
 * Layout untuk halaman publik (landing page).
 * Bertanggung jawab untuk:
 * - Struktur UI global (Navbar, Footer)
 * - Mengatur wrapper utama halaman
 * - Menyediakan slot content via Outlet
 * 
 * Layout TIDAK:
 * - Mengatur detail UI kecil (tugas Component)
 * - Melakukan data fetching (tugas Page)
 */
const HomeLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-gray-900">
      {/* Global Navigation */}
      <Navbar />

      {/* Main Content Area - Rendered by child routes */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default HomeLayout;
