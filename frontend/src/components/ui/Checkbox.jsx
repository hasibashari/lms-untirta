
/**
 * Checkbox Component
 * Reusable checkbox dengan label.
 * 
 * @param {string} id - ID untuk input dan label
 * @param {string} label - Label text
 * @param {boolean} checked - Checked state
 * @param {function} onChange - Handler untuk perubahan value
 */
const Checkbox = ({ id, label, checked, onChange }) => (
  <div className="flex items-center">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
    />
    <label
      htmlFor={id}
      className="ml-2 block text-sm text-gray-600 cursor-pointer select-none"
    >
      {label}
    </label>
  </div>
);

export default Checkbox;
