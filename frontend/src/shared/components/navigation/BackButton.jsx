import { useNavigate } from 'react-router-dom';

export default function BackButton({ fallback = '/' }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="text-sm text-blue-600 hover:underline"
    >
      ← Kembali
    </button>
  );
}
