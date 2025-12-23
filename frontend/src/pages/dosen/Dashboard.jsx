import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCourse, getMyCourses } from '../../services/dosen.service';
import Button from '../../components/ui/Button';

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    getMyCourses()
      .then(res => setCourses(res.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateCourse = async e => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const res = await createCourse({ title: newTitle, code: newCode });
      const createdCourse = res?.data;

      // Refresh list so UX is stable even if API response shape changes
      const refreshed = await getMyCourses();
      setCourses(refreshed.data);

      setNewTitle('');
      setNewCode('');
      setShowCreate(false);

      if (createdCourse?.id) {
        navigate(`/dosen/courses/${createdCourse.id}`);
      }
    } catch (err) {
      setCreateError(err);
    } finally {
      setCreating(false);
    }
  };

  const errorMessage = err =>
    err?.response?.data?.message || err?.message || 'Terjadi kesalahan.';

  return (
    <div className='space-y-4'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-xl font-bold'>Kelas Saya</h1>
          <p className='text-sm text-gray-600'>
            Pilih kelas untuk mengelola materi, mahasiswa, tugas, dan submission.
          </p>
        </div>

        <Button
          variant='primary'
          onClick={() => setShowCreate(v => !v)}
        >
          Tambah Kelas
        </Button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreateCourse}
          className='bg-white rounded shadow p-4 space-y-3'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <div>
              <label className='block text-sm font-medium'>Nama Kelas</label>
              <input
                className='border p-2 w-full rounded'
                placeholder='contoh: Pemrograman Web'
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium'>Kode Kelas</label>
              <input
                className='border p-2 w-full rounded'
                placeholder='contoh: WEB-01'
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                required
              />
            </div>
          </div>

          {createError && (
            <p className='text-sm text-red-600'>{errorMessage(createError)}</p>
          )}

          <div className='flex gap-2'>
            <Button type='submit' disabled={creating}>
              {creating ? 'Menyimpan...' : 'Simpan'}
            </Button>
            <Button
              type='button'
              variant='secondary'
              onClick={() => {
                setShowCreate(false);
                setCreateError(null);
              }}
            >
              Batal
            </Button>
          </div>
        </form>
      )}

      {loading && <p className='text-gray-600'>Memuat kelas...</p>}
      {error && <p className='text-red-600'>{errorMessage(error)}</p>}

      {!loading && !error && courses.length === 0 && (
        <div className='bg-white rounded shadow p-4'>
          <p className='text-gray-600'>Belum ada kelas yang diampu.</p>
          <p className='text-sm text-gray-500'>Klik “Tambah Kelas” untuk mulai.</p>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
        {courses.map(course => (
          <div
            key={course.id}
            onClick={() => navigate(`/dosen/courses/${course.id}`)}
            className='cursor-pointer bg-white p-4 rounded shadow hover:bg-gray-50'
            role='button'
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate(`/dosen/courses/${course.id}`);
              }
            }}
          >
            <h2 className='font-semibold'>{course.title}</h2>
            <p className='text-xs text-gray-500'>Kode: {course.code}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
