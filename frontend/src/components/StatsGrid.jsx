import StatItem from './ui/StatItem';

/**
 * StatsGrid Component
 * Grid untuk menampilkan beberapa StatItem.
 * Digunakan di hero section untuk trust indicators.
 * 
 * @param {Array} stats - Array of {value, label} objects
 * @param {string} className - Additional CSS classes
 */
const StatsGrid = ({ stats = [], className = '' }) => (
  <div className={`flex items-center gap-6 ${className}`}>
    {stats.map((stat, index) => (
      <StatItem key={index} value={stat.value} label={stat.label} />
    ))}
  </div>
);

export default StatsGrid;
