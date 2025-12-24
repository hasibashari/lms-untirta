import { NavLink } from "react-router-dom";
/**
 * DesktopNav Component
 * Menangani navigasi utama untuk layar lebar (md ke atas).
 * Menerima array navLinks sebagai props untuk fleksibilitas.
 * 
 * @param {Array} navLinks - Array of navigation link objects with { name, href, active }
 */
const DesktopNav = ({ navLinks = [] }) => (
  <ul className="hidden md:flex items-center gap-8">
    {navLinks.map((link) => {
      // 🌐 External link (buka tab baru)
      if (link.external) {
        return (
          <li key={link.name}>
            <a
              href={link.to}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] font-medium text-gray-500 hover:text-blue-600 transition-all duration-200 ease-in-out pb-1"
            >
              {link.name}
            </a>
          </li>
        );
      }

      // 🔗 Internal SPA navigation
      return (
        <li key={link.name}>
          <NavLink
            to={link.to}
            className={({ isActive }) =>
              `
              text-[15px] font-medium transition-all duration-200 ease-in-out pb-1
              ${isActive
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-blue-600 hover:border-b-2 hover:border-blue-200'
              }
              `
            }
          >
            {link.name}
          </NavLink>
        </li>
      );
    })}
  </ul>
);

export default DesktopNav;
