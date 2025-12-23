import React from 'react';
import { UserCircle } from 'lucide-react';

/**
 * MobileMenu Component
 * Navigasi toggle untuk layar kecil dengan animasi smooth.
 * Menerima state isOpen dan setter untuk kontrol dari parent.
 * 
 * @param {boolean} isOpen - State untuk menampilkan/menyembunyikan menu
 * @param {function} setIsOpen - Function untuk mengubah state isOpen
 * @param {Array} navLinks - Array of navigation links
 */
const MobileMenu = ({ isOpen, setIsOpen, navLinks = [] }) => (
  <div
    className={`
      absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-100 md:hidden
      transition-all duration-300 ease-in-out origin-top z-50
      ${isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0 pointer-events-none'}
    `}
  >
    <ul className="flex flex-col p-4 gap-4">
      {navLinks.map((link) => (
        <li key={link.name}>
          <a
            href={link.href}
            onClick={() => setIsOpen(false)}
            className={`
              block px-4 py-2 rounded-md font-medium text-sm
              ${link.active
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }
            `}
          >
            {link.name}
          </a>
        </li>
      ))}
      <li className="mt-2 pt-4 border-t border-gray-100">
        <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-md font-semibold hover:bg-blue-700 active:scale-95 transition-all">
          <UserCircle size={18} />
          Login
        </button>
      </li>
    </ul>
  </div>
);

export default MobileMenu;
