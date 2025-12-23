
/**
 * AuthLink Component
 * Link text untuk navigasi antar halaman auth (Login <-> Register).
 * 
 * @param {string} text - Text deskripsi sebelum link
 * @param {string} linkText - Text untuk link yang clickable
 * @param {string} href - URL tujuan
 * @param {function} onClick - Click handler (optional, untuk SPA routing)
 */
const AuthLink = ({ text, linkText, href = '#', onClick }) => (
  <p className="text-center text-sm text-gray-600">
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

export default AuthLink;
