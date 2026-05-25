
/**
 * PartnerLogo Component
 * Menampilkan logo partner/mitra dengan hover effect.
 * 
 * @param {object} data - Data partner { name, logo }
 * @param {string} className - Additional CSS classes
 */
const PartnerLogo = ({ data, className = '' }) => (
  <div className={`flex items-center justify-center min-w-30 md:min-w-40 mx-6 md:mx-10 group cursor-pointer ${className}`}>
    <img
      src={data.logo}
      alt={data.name}
      className="h-12 md:h-16 w-auto object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110"
      title={data.name}
      loading="lazy"
    />
  </div>
);

export default PartnerLogo;
