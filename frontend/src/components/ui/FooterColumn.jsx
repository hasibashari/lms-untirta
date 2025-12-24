
/**
 * FooterColumn Component
 * Wrapper untuk kolom footer dengan title dan aksen garis bawah.
 * Reusable untuk berbagai jenis konten footer.
 * 
 * @param {string} title - Judul kolom
 * @param {ReactNode} children - Konten kolom
 */
const FooterColumn = ({ title, children }) => (
  <div className="flex flex-col gap-4">
    <h3 className="text-white font-bold text-lg tracking-wide relative inline-block">
      {title}
      {/* Aksen garis bawah kecil */}
      <span className="absolute -bottom-2 left-0 w-8 h-1 bg-blue-500 rounded-full"></span>
    </h3>
    <div className="mt-2 text-slate-400 text-sm leading-relaxed">
      {children}
    </div>
  </div>
);

export default FooterColumn;
