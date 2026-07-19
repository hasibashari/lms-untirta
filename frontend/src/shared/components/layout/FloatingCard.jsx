
/**
 * FloatingCard Component
 * Kartu kecil yang melayang di atas gambar utama untuk memberi efek 3D/Layered.
 * Digunakan untuk menampilkan statistik atau info menarik pada hero section.
 * 
 * @param {LucideIcon} icon - Icon dari lucide-react
 * @param {string} title - Title text (uppercase, small)
 * @param {string} subtitle - Subtitle text (bold, larger)
 * @param {string} className - Additional CSS classes untuk positioning
 */
 
const FloatingCard = ({ icon: Icon, title, subtitle, className = '' }) => (
  <div className={`absolute bg-white p-4 rounded-xl shadow-xl border border-blue-50 flex items-center gap-3 animate-fade-in-up ${className}`}>
    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{title}</p>
      <p className="text-sm font-bold text-gray-900">{subtitle}</p>
    </div>
  </div>
);

export default FloatingCard;
