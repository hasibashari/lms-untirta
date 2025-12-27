import React from 'react';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

// Import Child Components
import { Link } from '../ui';
import { FooterColumn, FooterBrand, FooterContact, FooterBottom } from './';

// Import Configuration Data
import { FOOTER_LINKS, SOCIAL_LINKS, CONTACT_INFO } from '../../utils/constants';

// Map icon names ke actual icon components
const ICON_MAP = { Facebook, Twitter, Instagram, Youtube };

// Transform SOCIAL_LINKS dengan actual icon components
const getSocialWithIcons = () =>
  SOCIAL_LINKS.map(social => ({
    ...social,
    icon: ICON_MAP[social.iconName]
  }));

// --- Footer Component (Parent) ---
/**
 * Footer Component
 * 
 * Komponen parent yang mengatur layout dan struktur footer.
 * Bertanggung jawab untuk:
 * - Menyusun layout grid untuk konten footer
 * - Mengkoordinasikan child components
 * - Mendistribusikan data konfigurasi ke child components
 * 
 * Architecture:
 * - FooterBrand: Brand identity dengan logo dan newsletter
 * - FooterColumn + FooterLinkItem: Kolom navigasi links
 * - FooterContact: Informasi kontak
 * - FooterBottom: Copyright dan social icons
 */

const Footer = () => {
  // Get social links dengan icon components
  const socialsWithIcons = getSocialWithIcons();

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 font-sans">

      {/* Bagian Utama (Top Footer) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Kolom 1: Brand & Deskripsi */}
          <FooterBrand />

          {/* Kolom 2: Link Layanan */}
          <FooterColumn title={FOOTER_LINKS.layanan.title}>
            {FOOTER_LINKS.layanan.items.map((link, idx) => (
              <Link key={idx} href={link.href}>
                {link.label}
              </Link>
            ))}
          </FooterColumn>

          {/* Kolom 3: Link Tentang Kami */}
          <FooterColumn title={FOOTER_LINKS.tentang.title}>
            {FOOTER_LINKS.tentang.items.map((link, idx) => (
              <Link key={idx} href={link.href}>
                {link.label}
              </Link>
            ))}
          </FooterColumn>

          {/* Kolom 4: Kontak Info */}
          <FooterColumn title="Hubungi Kami">
            <FooterContact contactInfo={CONTACT_INFO} />
          </FooterColumn>

        </div>
      </div>

      {/* Bagian Bawah (Bottom Footer) */}
      <FooterBottom socials={socialsWithIcons} />

    </footer>
  );
};

export default Footer;