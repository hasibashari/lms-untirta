/**
 * Navigation Links Configuration
 * Digunakan untuk menu navigasi di Navbar
 */
export const NAV_LINKS = [
  { name: 'Home', href: '#', active: true },
  { name: 'About US', href: '#', active: false },
  { name: 'Course', href: '#', active: false },
  { name: 'Website Untirta', href: '#', active: false },
  { name: 'Siakang', href: '#', active: false },
];

/**
 * Footer Links Configuration
 * Digunakan untuk navigasi dan informasi di Footer
 */
export const FOOTER_LINKS = {
  layanan: {
    title: "Layanan",
    items: [
      { label: "Mata Kuliah Daring", href: "#" },
      { label: "Program MBKM", href: "#" },
      { label: "Validasi Sertifikat", href: "#" },
      { label: "Mitra Perguruan Tinggi", href: "#" },
    ]
  },
  tentang: {
    title: "Tentang Kami",
    items: [
      { label: "Profil SPADA", href: "#" },
      { label: "Panduan Pengguna", href: "#" },
      { label: "Berita & Artikel", href: "#" },
      { label: "FAQ / Bantuan", href: "#" },
    ]
  }
};

/**
 * Social Media Links Configuration
 * Digunakan di Footer dan halaman lainnya
 * Note: Icon components harus di-import terpisah di komponen yang menggunakan
 */
export const SOCIAL_LINKS = [
  { iconName: 'Facebook', href: "#", label: "Facebook" },
  { iconName: 'Twitter', href: "#", label: "Twitter" },
  { iconName: 'Instagram', href: "#", label: "Instagram" },
  { iconName: 'Youtube', href: "#", label: "Youtube" },
];

/**
 * Contact Information Configuration
 * Digunakan di Footer untuk informasi kontak
 */
export const CONTACT_INFO = {
  address: {
    line1: "Gedung D, Kemendikbud Ristek,",
    line2: "Jl. Jenderal Sudirman, Senayan,",
    line3: "Jakarta Pusat 10270"
  },
  phone: "+62 21 5794 6104",
  email: "sekretariat@spada.id"
};

/**
 * Roles Configuration
 * Dapat digunakan untuk role-based access control
 */
export const ROLES = {
  ADMIN: 'admin',
  DOSEN: 'dosen',
  MAHASISWA: 'mahasiswa',
};

