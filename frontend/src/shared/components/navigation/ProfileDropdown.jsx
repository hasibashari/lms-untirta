import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * ProfileDropdown Component
 * Dropdown menu untuk profile user di Navbar
 * Menampilkan avatar, nama, dan menu dropdown
 * 
 * UI Only - Profile & Settings disabled untuk saat ini
 */
const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  const menuItems = [
    {
      label: 'Profile',
      icon: User,
      disabled: false,
      onClick: () => {
        navigate('/profile');
        setIsOpen(false);
      },
    },
    {
      label: 'Settings',
      icon: Settings,
      disabled: false,
      onClick: () => {
        navigate('/profile?tab=settings');
        setIsOpen(false);
      },
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button - Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>

        {/* Name & Chevron (hidden on mobile) */}
        <div className="hidden lg:flex items-center gap-1">
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-sm text-slate-500 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-left transition
                    ${item.disabled
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.disabled && (
                    <span className="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Logout */}
          <div className="border-t border-slate-100 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Keluar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
