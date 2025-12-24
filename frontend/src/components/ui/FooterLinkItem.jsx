
/**
 * FooterLinkItem Component
 * Link item dengan hover effect untuk footer navigation.
 * 
 * @param {string} href - URL tujuan link
 * @param {ReactNode} children - Text atau konten link
 */
const FooterLinkItem = ({ href, children }) => (
  <a
    href={href}
    className="block w-fit mb-2 hover:text-blue-400 hover:translate-x-1 transition-all duration-200"
  >
    {children}
  </a>
);

export default FooterLinkItem;
