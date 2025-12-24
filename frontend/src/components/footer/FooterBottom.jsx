import { Heart } from 'lucide-react';
import SocialIcons from '../ui/SocialIcons';

/**
 * FooterBottom Component
 * Bottom bar footer dengan copyright text dan social media icons.
 * 
 * @param {Array} socials - Array of social media objects untuk SocialIcons
 */
const FooterBottom = ({ socials = [] }) => (
  <div className="bg-slate-950 py-6 border-t border-slate-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">

      {/* Copyright */}
      <div className="text-sm text-slate-500 text-center md:text-left">
        &copy; {new Date().getFullYear()} Spada Indonesia. Hak Cipta Dilindungi.
        <span className="hidden sm:inline mx-2">|</span>
        <span className="flex sm:inline items-center justify-center gap-1 mt-1 sm:mt-0">
          Dibuat dengan <Heart size={12} className="text-red-500 fill-red-500" /> untuk Pendidikan Indonesia.
        </span>
      </div>

      {/* Social Icons */}
      <SocialIcons socials={socials} variant="dark" />

    </div>
  </div>
);

export default FooterBottom;
