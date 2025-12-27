/**
 * UserAvatars Component
 * Menampilkan grup avatar pengguna yang overlap.
 * Digunakan untuk social proof di hero section.
 * 
 * @param {Array} avatarUrls - Array of avatar image URLs
 * @param {string} text - Text yang ditampilkan di sebelah avatars
 * @param {number} count - Jumlah avatar yang ditampilkan (default: 4)
 * @param {string} className - Additional CSS classes
 */
const UserAvatars = ({
  avatarUrls = [],
  text = 'Bergabung bersama mahasiswa lainnya hari ini.',
  count = 4,
  className = ''
}) => {
  // Generate default avatars jika tidak ada
  const defaultAvatars = Array.from({ length: count }, (_, i) =>
    `https://i.pravatar.cc/100?img=${i + 10}`
  );

  const avatars = avatarUrls.length > 0 ? avatarUrls : defaultAvatars;

  return (
    <div className={`flex items-center gap-4 text-sm font-medium text-slate-500 ${className}`}>
      <div className="flex -space-x-2">
        {avatars.slice(0, count).map((url, i) => (
          <img
            key={i}
            className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
            src={url}
            alt={`User ${i + 1}`}
            loading="lazy"
          />
        ))}
      </div>
      <p>{text}</p>
    </div>
  );
};

export default UserAvatars;
