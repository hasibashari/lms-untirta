import { useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { createAssignment } from '../../services/dosen.service';
import BackButton from '../../components/navigation/BackButton';
import Breadcrumb from '../../components/navigation/Breadcrumb';
import Button from '../../components/ui/Button';

export default function CreateAssignment() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!courseId || courseId === 'undefined') return;

    setLoading(true);
    setError(null);

    try {
      await createAssignment(courseId, {
        title,
        description,
        dueDate,
      });

      navigate(`/dosen/courses/${courseId}/assignments`);
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
        <BackButton fallback={`/dosen/courses/${courseId}/assignments`} />
        <Breadcrumb
          items={[
            { label: 'Dashboard', to: '/dosen/dashboard' },
            { label: 'Kelas', to: `/dosen/courses/${courseId}` },
            { label: 'Tugas', to: `/dosen/courses/${courseId}/assignments` },
            { label: 'Buat Tugas' },
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

      <form onSubmit={handleSubmit} className='space-y-4 max-w-xl'>
        <div>
          <h1 className='text-xl font-bold'>Buat Tugas</h1>
          <p className='text-sm text-gray-600'>Tulis instruksi yang jelas untuk mengurangi pertanyaan ulang.</p>
        </div>

        {error && <p className='text-sm text-red-600'>{errorMessage(error)}</p>}

        <div>
          <label className='block text-sm font-medium'>Judul Tugas</label>
          <input
            className='border p-2 w-full rounded'
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className='block text-sm font-medium'>Deskripsi</label>
          <textarea
            className='border p-2 w-full rounded'
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className='block text-sm font-medium'>Deadline</label>
          <input
            type='datetime-local'
            className='border p-2 w-full rounded'
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            required
          />
        </div>

        <div className='flex gap-2'>
          <Button type='submit' disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>

          <Button
            type='button'
            variant='secondary'
            onClick={() => navigate(`/dosen/courses/${courseId}/assignments`)}
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
