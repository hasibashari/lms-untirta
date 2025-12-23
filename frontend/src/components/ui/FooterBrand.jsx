import React from 'react';
import { Globe, ArrowRight } from 'lucide-react';

/**
 * FooterBrand Component
 * Section brand dengan logo, deskripsi, dan newsletter subscription form.
 * Menampilkan identitas SPADA Indonesia di footer.
 */
const FooterBrand = () => (
  <div className="space-y-6">
    {/* Logo Section */}
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center w-10 h-10">
        <Globe className="w-8 h-8 text-blue-500" />
        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-slate-900"></span>
      </div>
      <h2 className="text-xl font-extrabold text-white tracking-tight uppercase">
        SPADA <span className="text-blue-500">INDONESIA</span>
      </h2>
    </div>

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
