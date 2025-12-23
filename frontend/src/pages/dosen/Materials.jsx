import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { getMaterials } from '../../services/dosen.service';
import BackButton from '../../components/navigation/BackButton';
import Breadcrumb from '../../components/navigation/Breadcrumb';
import Button from '../../components/ui/Button';

export default function Materials() {
  const { courseId } = useParams();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!courseId || courseId === 'undefined') return;

    setLoading(true);
    setError(null);
    getMaterials(courseId)
      .then(res => setMaterials(res.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (!courseId || courseId === 'undefined') {
    return <p className='text-gray-600'>Memuat data kelas...</p>;
  }

  const tabClass = ({ isActive }) =>
    `text-sm px-3 py-2 rounded ${isActive ? 'bg-white shadow font-semibold' : 'hover:bg-white/60'
    }`;

  const errorMessage = err =>
    err?.response?.data?.message || err?.message || 'Terjadi kesalahan.';

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <BackButton fallback={`/dosen/courses/${courseId}`} />
        <Breadcrumb
          items={[
            { label: 'Dashboard', to: '/dosen/dashboard' },
            { label: 'Kelas', to: `/dosen/courses/${courseId}` },
            { label: 'Materi' },
          ]}
        />
      </div>

      <div className='bg-gray-50 rounded p-2 flex gap-2 flex-wrap'>
        <NavLink to={`/dosen/courses/${courseId}/materials`} className={tabClass}>
          Materi
        </NavLink>
        <NavLink to={`/dosen/courses/${courseId}/students`} className={tabClass}>
          Mahasiswa
        </NavLink>
        <NavLink to={`/dosen/courses/${courseId}/assignments`} className={tabClass}>
          Tugas
        </NavLink>
        <NavLink to={`/dosen/courses/${courseId}/submissions`} className={tabClass}>
          Submission
        </NavLink>
      </div>

      <div className='flex justify-between items-center gap-3 flex-wrap'>
        <div>
          <h1 className='text-xl font-bold'>Materi</h1>
          <p className='text-sm text-gray-600'>Tambah dan susun materi untuk mahasiswa.</p>
        </div>
        <Button onClick={() => navigate(`/dosen/courses/${courseId}/materials/new`)}>
          Tambah Materi
        </Button>
      </div>

      {loading && <p className='text-gray-600'>Memuat materi...</p>}
      {error && <p className='text-red-600'>{errorMessage(error)}</p>}

      {!loading && !error && materials.length === 0 && (
        <div className='bg-white p-4 rounded shadow'>
          <p className='text-gray-600'>Belum ada materi.</p>
          <p className='text-sm text-gray-500'>Klik “Tambah Materi” untuk mulai.</p>
        </div>
      )}

      {materials.map(mat => (
        <div key={mat.id} className='bg-white p-4 rounded shadow'>
          {mat.order}. {mat.title}
        </div>
      ))}
    </div>
  );
}
