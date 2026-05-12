import { Search } from 'lucide-react';

/**
 * SearchBar Component
 * Search bar dengan integrated button untuk hero section.
 * 
 * @param {string} placeholder - Placeholder text
 * @param {string} value - Controlled value
 * @param {function} onChange - Handler untuk perubahan value
 * @param {function} onSubmit - Handler untuk submit form
 * @param {string} buttonText - Text untuk submit button
 * @param {string} className - Additional CSS classes
 */
const SearchBar = ({
  placeholder = 'Cari mata kuliah, topik, atau keahlian...',
  value,
  onChange,
  onSubmit,
  buttonText = 'Cari',
  className = ''
}) => (
  <form onSubmit={onSubmit} className={`relative max-w-md group ${className}`}>
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
    </div>
    <input
      type="text"
      className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
    <button
      type="submit"
      className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg font-medium transition-colors flex items-center"
    >
      {buttonText}
    </button>
  </form>
);

export default SearchBar;
