/**
 * NavLink Component (renamed from AuthLink)
 * Link text dengan styling untuk navigasi antar halaman.
 * Generic dan reusable untuk berbagai konteks.
 * 
 * @param {string} text - Text deskripsi sebelum link
 * @param {string} linkText - Text untuk link yang clickable
 * @param {string} href - URL tujuan
 * @param {function} onClick - Click handler (optional, untuk SPA routing)
 * @param {string} className - Additional CSS classes
 */
const NavLink = ({ text, linkText, href = '#', onClick, className = '' }) => (
  <p className={`text-center text-sm text-gray-600 ${className}`}>
    {text}{' '}
    <a
      href={href}
      onClick={onClick}
      className="font-semibold text-blue-600 hover:text-blue-500 hover:underline"
    >
      {linkText}
    </a>
  </p>
);

export default NavLink;
