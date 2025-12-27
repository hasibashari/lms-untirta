/**
 * PageLoader - Komponen loading untuk lazy-loaded pages
 * Digunakan sebagai fallback Suspense saat page sedang dimuat
 */
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">Memuat halaman...</p>
    </div>
  </div>
);

export default PageLoader;
