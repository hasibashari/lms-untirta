
/**
 * StatItem Component
 * Menampilkan satu item statistik dengan value dan label.
 * Digunakan di hero section untuk menampilkan trust indicators.
 * 
 * @param {string} label - Label text
 * @param {string} value - Value/number text
 */
const StatItem = ({ label, value }) => (
  <div className="flex flex-col border-l-2 border-gray-200 pl-4 first:border-0 first:pl-0">
    <span className="text-2xl font-bold text-gray-900">{value}</span>
    <span className="text-sm text-gray-500">{label}</span>
  </div>
);

export default StatItem;
