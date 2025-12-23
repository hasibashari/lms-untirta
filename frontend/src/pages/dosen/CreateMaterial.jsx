import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { createMaterial } from '../../services/dosen.service';
import BackButton from '../../components/navigation/BackButton';
import Breadcrumb from '../../components/navigation/Breadcrumb';
import Button from '../../components/ui/Button';

export default function CreateMaterial() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();

    if (!courseId || courseId === 'undefined') return;

    setLoading(true);
    setError(null);
    try {
      await createMaterial(courseId, { title, content });
      navigate(`/dosen/courses/${courseId}/materials`);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

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
        <BackButton fallback={`/dosen/courses/${courseId}/materials`} />
        <Breadcrumb
          items={[
            { label: 'Dashboard', to: '/dosen/dashboard' },
            { label: 'Kelas', to: `/dosen/courses/${courseId}` },
            { label: 'Materi', to: `/dosen/courses/${courseId}/materials` },
            { label: 'Tambah Materi' },
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

      <form onSubmit={handleSubmit} className='space-y-4 max-w-2xl'>
        <div>
          <h1 className='text-xl font-bold'>Tambah Materi</h1>
          <p className='text-sm text-gray-600'>Buat materi singkat dan jelas untuk mahasiswa.</p>
        </div>

        {error && <p className='text-sm text-red-600'>{errorMessage(error)}</p>}

        <div>
          <label className='block text-sm font-medium'>Judul Materi</label>
          <input
            className='border p-2 w-full rounded'
            placeholder='contoh: Pertemuan 1 - Pengenalan'
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className='block text-sm font-medium'>Konten Materi</label>
          <textarea
            className='border p-2 w-full rounded'
            placeholder='Tuliskan ringkasan materi atau instruksi...'
            rows={6}
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>

        <div className='flex gap-2'>
          <Button type='submit' disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
          <Button
            type='button'
            variant='secondary'
            onClick={() => navigate(`/dosen/courses/${courseId}/materials`)}
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
