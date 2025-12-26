import { NavLink, Link } from 'react-router-dom';
import { UserCircle, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * MobileMenu Component
 * Navigasi toggle untuk layar kecil dengan animasi smooth.
 * Menerima state isOpen dan setter untuk kontrol dari parent.
 * 
 * @param {boolean} isOpen - State untuk menampilkan/menyembunyikan menu
 * @param {function} setIsOpen - Function untuk mengubah state isOpen
 * @param {Array} navLinks - Array of navigation links
 * @param {boolean} isAuthenticated - Status login user
 */
const MobileMenu = ({ isOpen, setIsOpen, navLinks = [], isAuthenticated = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  return (
    <div
      className={`
        absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-100 md:hidden
        transition-all duration-300 ease-in-out origin-top z-50
        ${isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0 pointer-events-none'}
      `}
    >
      <ul className="flex flex-col p-4 gap-4">
        {navLinks.map((link) => {
          // 🌐 External link
          if (link.external) {
            return (
              <li key={link.name}>
                <a
                  href={link.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 rounded-md font-medium text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                >
                  {link.name}
                </a>
              </li>
            );
          }

          // 🔗 Internal SPA link
          return (
            <li key={link.name}>
              <NavLink
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `
                  block px-4 py-2 rounded-md font-medium text-sm
                  ${isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }
                  `
                }
              >
                {link.name}
              </NavLink>
            </li>
          );
        })}

        {/* Login Button atau User Menu */}
        <li className="mt-2 pt-4 border-t border-gray-100">
          {isAuthenticated ? (
            <div className="space-y-2">
              {/* User Info */}
              <div className="px-4 py-2 bg-slate-50 rounded-lg">
                <p className="font-semibold text-slate-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-sm text-slate-500 truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>

              {/* Menu Items */}
              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-2 text-left text-slate-400 cursor-not-allowed rounded-md"
              >
                <User size={18} />
                <span className="text-sm font-medium">Profile</span>
                <span className="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Soon</span>
              </button>

              <button
                disabled
                className="w-full flex items-center gap-3 px-4 py-2 text-left text-slate-400 cursor-not-allowed rounded-md"
              >
                <Settings size={18} />
                <span className="text-sm font-medium">Settings</span>
                <span className="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Soon</span>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-md transition"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Keluar</span>
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={() => setIsOpen(false)}>
              <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-md font-semibold hover:bg-blue-700 active:scale-95 transition-all">
                <UserCircle size={18} />
                Masuk
              </button>
            </Link>
          )}
        </li>
      </ul>
    </div>
  );
};

export default MobileMenu;
