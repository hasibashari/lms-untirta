import Logo from '../ui/Logo';
import { ArrowRight } from 'lucide-react';

/**
 * FooterBrand Component
 * Section brand dengan logo, deskripsi, dan newsletter subscription form.
 * Menampilkan identitas SPADA UNTIRTA di footer.
 */
const FooterBrand = () => (
  <div className="space-y-6">
    {/* Logo Section (reused) */}
    <Logo variant="footer" />

    {/* Description */}
    <p className="text-sm leading-relaxed text-slate-400">
      Platform pembelajaran daring terpadu untuk meningkatkan akses dan kualitas pendidikan tinggi di Indonesia. Belajar kapan saja, di mana saja.
    </p>

    {/* Newsletter Mini Form */}
    <div className="pt-2">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
        Berlangganan Info Terbaru
      </label>
      <div className="flex">
        <input
          type="email"
          placeholder="Email Anda..."
          className="bg-slate-800 border border-slate-700 text-white text-sm rounded-l-md px-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-r-md transition-colors">
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  </div>
);

export default FooterBrand;
