
/**
 * LoginButton Component
 * Tombol utama di sebelah kanan navbar (Desktop).
 * Komponen reusable yang dapat dikustomisasi melalui props.
 * 
 * @param {string} text - Text yang ditampilkan di button (default: "Login")
 * @param {function} onClick - Handler untuk click event (optional)
 */
const LoginButton = ({ text = 'Login', onClick }) => (
  <button
    onClick={onClick}
    className="hidden md:block bg-blue-600 text-white px-8 py-2.5 rounded-md font-semibold text-sm shadow-sm hover:bg-blue-700 hover:shadow-md active:translate-y-0.5 transition-all duration-200"
  >
    {text}
  </button>
);

export default LoginButton;
