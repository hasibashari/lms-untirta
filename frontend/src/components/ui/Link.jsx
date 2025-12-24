/**
 * Link Component (renamed from FooterLinkItem)
 * Link item dengan hover effect, generic untuk berbagai konteks.
 * 
 * @param {string} href - URL tujuan link
 * @param {ReactNode} children - Text atau konten link
 * @param {string} className - Additional CSS classes
 */
const Link = ({ href, children, className = '' }) => (
  <a
    href={href}
    className={`block w-fit mb-2 hover:text-blue-400 hover:translate-x-1 transition-all duration-200 ${className}`}
  >
    {children}
  </a>
);

export default Link;
