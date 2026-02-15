import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import Child Components
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import DesktopNav from './DesktopNav';
import MobileMenu from './MobileMenu';
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

  // Auth state - ambil isAuthenticated dan user untuk routing
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Left Section: Logo */}
          <div className="shrink-0">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          {/* Middle Section: Navigation Links (Desktop) */}
          <div className="flex-1 flex justify-center">
            <DesktopNav
              navLinks={NAV_LINKS}
              isAuthenticated={isAuthenticated}
              user={user}
            />
          </div>

          {/* Right Section: Action Button (Desktop) & Hamburger (Mobile) */}
          <div className="flex items-center gap-4">
            {/* Desktop: Profile Dropdown atau Login Button */}
            <div className="hidden md:block">
              {isAuthenticated ? (
                <ProfileDropdown />
              ) : (
                <Link to="/login">
                  <Button variant="primary" size="md" showArrow>
                    Masuk
                  </Button>
                </Link>
              )}
            </div>

            {/* Hamburger Button (Mobile Only) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors focus:outline-none focus:ring-0 focus:ring-blue-500"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
          navLinks={NAV_LINKS}
          isAuthenticated={isAuthenticated}
        />
      </nav>
    </header>
  );
};

export default Navbar;
