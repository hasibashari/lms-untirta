import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// Import Child Components
import Logo from '../ui/Logo';
import { Button } from '../ui/button';
import ProfileDropdown from './ProfileDropdown';

// Import Auth Context
import { useAuth } from '../../contexts/AuthContext';

// Import Configuration Data
import { NAV_LINKS } from '../../utils/constants';

// --- Navbar Component (Parent) ---
/**
 * Navbar Component
 * 
 * Komponen parent yang mengatur layout dan state management untuk navbar.
 * Bertanggung jawab untuk:
 * - Mengelola state mobile menu (open/close)
 * - Menyusun layout struktur navbar (logo, nav, actions)
 * - Mengkoordinasikan komunikasi antar child components
 * - Menampilkan Profile Dropdown jika user sudah login
 * 
 * Architecture:
 * - Logo: Brand identity (static)
 * - DesktopNav: Navigation links untuk desktop view
 * - LoginButton / ProfileDropdown: Berdasarkan status login
 * - MobileMenu: Dropdown menu untuk mobile view
 */

const Navbar = () => {
  // State Management untuk Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Auth state - ambil isAuthenticated dan user untuk routing
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Left Section: Logo */}
          <div className="shrink-0 flex items-center">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
              <Logo />
            </Link>
          </div>

          {/* Middle Section: Navigation Links (Desktop) */}
          <div className="flex-1 flex justify-center">
            <div className="hidden md:flex space-x-1 lg:space-x-4">
              {NAV_LINKS.map((link) => {
                if (link.requiresAuth && !isAuthenticated) return null;

                // Determine target path: if link requires auth and user is logged in, 
                // redirect to their specific dashboard.
                let targetTo = link.to;
                if (link.requiresAuth && isAuthenticated && user?.role) {
                  const role = user.role.toUpperCase();
                  if (role === 'ADMIN') targetTo = '/admin/dashboard';
                  else if (role === 'DOSEN') targetTo = '/dosen/dashboard';
                  else if (role === 'MAHASISWA') targetTo = '/mahasiswa/dashboard';
                }

                const isActive = location.pathname === targetTo;

                if (link.external) {
                  return (
                    <a key={link.name} href={link.to} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200">
                      {link.name}
                    </a>
                  );
                }
                return (
                  <Link 
                    key={link.name} 
                    to={targetTo} 
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Section: Action Button (Desktop) & Hamburger (Mobile) */}
          <div className="flex items-center gap-4">
            {/* Desktop: Profile Dropdown atau Login/Register Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <ProfileDropdown />
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="font-semibold text-gray-600 hover:text-blue-600">
                      Masuk
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="default" size="sm" showArrow className="font-semibold shadow-sm">
                      Daftar
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Hamburger Button (Mobile Only) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <div className={`transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden absolute left-0 right-0 top-[80px] bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xl overflow-hidden transition-all duration-300 ease-in-out origin-top ${
          isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}>
          <div className="px-4 pt-2 pb-4 space-y-1">
            {NAV_LINKS.map((link) => {
              if (link.requiresAuth && !isAuthenticated) return null;

              // Determine target path for mobile menu as well
              let targetTo = link.to;
              if (link.requiresAuth && isAuthenticated && user?.role) {
                const role = user.role.toUpperCase();
                if (role === 'ADMIN') targetTo = '/admin/dashboard';
                else if (role === 'DOSEN') targetTo = '/dosen/dashboard';
                else if (role === 'MAHASISWA') targetTo = '/mahasiswa/dashboard';
              }

              const isActive = location.pathname === targetTo;

              if (link.external) {
                return (
                  <a key={link.name} href={link.to} target="_blank" rel="noopener noreferrer" className="block px-4 py-3 rounded-xl text-base font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    {link.name}
                  </a>
                );
              }
              return (
                <Link 
                  key={link.name} 
                  to={targetTo} 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className={`block px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Mobile Auth Actions */}
            {!isAuthenticated && (
              <div className="flex flex-col gap-3 pt-4 pb-2 border-t border-gray-100 mt-2">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center font-semibold text-gray-700 py-6">
                    Masuk
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="default" className="w-full justify-center font-semibold shadow-sm py-6">
                    Daftar Sekarang
                  </Button>
                </Link>
              </div>
            )}
            {isAuthenticated && (
              <div className="pt-4 pb-2 border-t border-gray-100 mt-2 flex justify-start">
                 <ProfileDropdown />
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
