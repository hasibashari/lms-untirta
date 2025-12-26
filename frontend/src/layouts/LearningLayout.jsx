import { Outlet } from 'react-router-dom';

/**
 * LearningLayout
 * Layout khusus untuk mode membaca/belajar materi
 * Tanpa sidebar utama untuk fokus maksimal
 */
const LearningLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Outlet />
    </div>
  );
};

export default LearningLayout;
