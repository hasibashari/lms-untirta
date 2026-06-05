/**
 * Navigation Links Configuration
 * Digunakan untuk menu navigasi di Navbar
 * 
 * Properti:
 * - name: Label yang ditampilkan
 * - to: Path tujuan (static)
 * - external: Buka di tab baru (optional)
 * - requiresAuth: Link yang behavior-nya berbeda berdasarkan auth state (optional)
 */
export const NAV_LINKS = [
  { name: 'Home', to: '/' },
  { name: 'About Us', to: '/about' },
  { name: 'Course', to: '/login', requiresAuth: true },
  { name: 'Website Untirta', to: 'https://untirta.ac.id', external: true },
  { name: 'Siakang', to: 'https://siakang.untirta.ac.id', external: true },
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
      { label: "Profil SPADA UNTIRTA", href: "#" },
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
    line1: "Kampus Sindangsari,",
    line2: "Jl. Raya Pabuaran,",
    line3: "Kab. Serang, Banten 42163"
  },
  phone: "+62 254 280330",
  email: "helpdesk@untirta.ac.id"
};

/**
 * Roles Configuration
 * Dapat digunakan untuk role-based access control
 * IMPORTANT: Harus sesuai dengan enum Role di database (UPPERCASE)
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  DOSEN: 'DOSEN',
  MAHASISWA: 'MAHASISWA',
};

/**
 * Testimonials Data
 * Data testimoni untuk landing page
 */
export const TESTIMONIALS = [
  {
    id: 1,
    name: "Sarah Amalia",
    role: "Mahasiswa Informatika, ITB",
    content: "SPADA UNTIRTA sangat membantu saya mengakses materi. Modul React-nya sangat terstruktur dan mudah dipahami bahkan untuk pemula. Sertifikatnya juga valid untuk portofolio!",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d"
  },
  {
    id: 2,
    name: "Dr. Hendra Gunawan",
    role: "Dosen Manajemen, UI",
    content: "Sebagai pengajar, platform ini memudahkan saya mendistribusikan materi ke jangkauan yang lebih luas. Fitur tracking progress mahasiswa sangat detail dan membantu evaluasi.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d"
  },
  {
    id: 3,
    name: "Rudi Hartono",
    role: "Alumni / Web Developer",
    content: "Dulu saya kesulitan mencari kursus berkualitas yang gratis. Berkat SPADA UNTIRTA, saya bisa belajar skill baru yang relevan dengan industri saat ini. Sekarang saya sudah bekerja di Startup Unicorn.",
    rating: 4,
    avatar: "https://i.pravatar.cc/150?u=a04258114e29026302d"
  },
  {
    id: 4,
    name: "Putri Indah",
    role: "Mahasiswa Sastra Inggris, UGM",
    content: "Tampilan antarmukanya sangat user-friendly. Saya suka fitur forum diskusinya, bisa berinteraksi dengan mahasiswa dari universitas lain di seluruh Indonesia.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d"
  },
  {
    id: 5,
    name: "Dimas Anggara",
    role: "Praktisi Data Science",
    content: "Materi yang disajikan sangat daging! Tidak hanya teori, tapi banyak studi kasus nyata yang relevan dengan kebutuhan industri saat ini.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?u=25"
  }
];

/**
 * Partners Data
 * Data mitra/universitas untuk landing page
 */
export const PARTNERS = [
  { name: "Kemendikbud Ristek", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg/250px-Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg.png" },
  { name: "Universitas Indonesia", logo: "https://upload.wikimedia.org/wikipedia/id/thumb/0/0f/Makara_of_Universitas_Indonesia.svg/960px-Makara_of_Universitas_Indonesia.svg.png" },
  { name: "Institut Teknologi Bandung", logo: "https://upload.wikimedia.org/wikipedia/id/9/95/Logo_Institut_Teknologi_Bandung.png" },
  { name: "Universitas Gadjah Mada", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6a/UNIVERSITAS_GADJAH_MADA%2C_YOGYAKARTA.png" },
  { name: "Institut Pertanian Bogor", logo: "https://upload.wikimedia.org/wikipedia/id/0/0f/Logo_IPB.png" },
  { name: "Universitas Sultan Ageng Tirtayasa", logo: "https://upload.wikimedia.org/wikipedia/id/7/76/Logo_UNTIRTA.png" },
];

/**
 * Courses Sample Data
 * Data kursus untuk landing page
 */
export const COURSES_DATA = [
  {
    id: 1,
    title: "Dasar Pemrograman Web Modern dengan React & Tailwind",
    category: "Teknologi",
    instructor: {
      name: "Dr. Budi Santoso",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d"
    },
    rating: 4.8,
    students: 1250,
    modules: 12,
    duration: "6 Jam",
    price: "Gratis",
    thumbnail: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    title: "Manajemen Bisnis Digital untuk UMKM",
    category: "Bisnis",
    instructor: {
      name: "Siti Aminah, M.B.A",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d"
    },
    rating: 4.5,
    students: 850,
    modules: 8,
    duration: "4 Jam",
    price: "Rp 150.000",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    title: "Desain UI/UX: Dari Konsep hingga Prototyping",
    category: "Desain",
    instructor: {
      name: "Rizky Ramadhan",
      avatar: "https://i.pravatar.cc/150?u=a04258114e29026302d"
    },
    rating: 4.9,
    students: 2100,
    modules: 20,
    duration: "10 Jam",
    price: "Rp 299.000",
    thumbnail: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 4,
    title: "Public Speaking & Komunikasi Efektif",
    category: "Soft Skill",
    instructor: {
      name: "Chandra W.",
      avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d"
    },
    rating: 4.7,
    students: 540,
    modules: 5,
    duration: "3 Jam",
    price: "Gratis",
    thumbnail: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  }
];

