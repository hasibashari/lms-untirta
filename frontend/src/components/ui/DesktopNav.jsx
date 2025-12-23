import React from 'react';

/**
 * DesktopNav Component
 * Menangani navigasi utama untuk layar lebar (md ke atas).
 * Menerima array navLinks sebagai props untuk fleksibilitas.
 * 
 * @param {Array} navLinks - Array of navigation link objects with { name, href, active }
 */
const DesktopNav = ({ navLinks = [] }) => (
  <ul className="hidden md:flex items-center gap-8">
    {navLinks.map((link) => (
      <li key={link.name}>
        <a
          href={link.href}
          className={`
            text-[15px] font-medium transition-all duration-200 ease-in-out pb-1
            ${link.active
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-blue-600 hover:border-b-2 hover:border-blue-200'
            }
          `}
        >
          {link.name}
        </a>
      </li>
    ))}
  </ul>
);

export default DesktopNav;
