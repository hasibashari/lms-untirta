import { Globe } from 'lucide-react';

/**
 * Logo Component
 * Menampilkan Brand Identity dengan icon Globe dan teks SPADA INDONESIA.
 * Komponen ini bersifat standalone dan tidak memerlukan props eksternal.
 */
const Logo = () => (
  <div className="flex items-center gap-3 cursor-pointer group">
    <div className="relative flex items-center justify-center w-10 h-10">
      <Globe className="w-8 h-8 text-blue-500 transition-transform group-hover:rotate-12" />
      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-400 rounded-full border-2 border-white"></span>
    </div>

    <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
      SPADA <span className="text-slate-900">INDONESIA</span>
    </h1>
  </div>
);

export default Logo;
