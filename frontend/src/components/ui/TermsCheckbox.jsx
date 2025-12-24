/**
 * TermsCheckbox - DEPRECATED
 * This component is kept for backward compatibility.
 * Consider using `Checkbox` component with custom label instead.
 * 
 * @deprecated Use `import Checkbox from './Checkbox'` with custom JSX label
 */

const TermsCheckbox = ({
  checked,
  onChange,
  required = true,
  termsUrl = '#',
  privacyUrl = '#'
}) => (
  <div className="flex items-start gap-3">
    <div className="flex items-center h-5">
      <input
        id="terms"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
        required={required}
      />
    </div>
    <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
      Saya menyetujui{' '}
      <a href={termsUrl} className="text-blue-600 font-medium hover:underline">
        Syarat & Ketentuan
      </a>{' '}
      serta{' '}
      <a href={privacyUrl} className="text-blue-600 font-medium hover:underline">
        Kebijakan Privasi
      </a>{' '}
      yang berlaku.
    </label>
  </div>
);

export default TermsCheckbox;
