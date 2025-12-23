import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  getCourseStudents,
  enrollStudent,
} from '../../services/dosen.service';
import BackButton from '../../components/navigation/BackButton';
import Breadcrumb from '../../components/navigation/Breadcrumb';
import Button from '../../components/ui/Button';

export default function Students() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!courseId || courseId === 'undefined') return;

    setLoading(true);
    setError(null);
    getCourseStudents(courseId)
      .then(res => setStudents(res.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleEnroll = async () => {
    if (!email.trim()) return;
    if (!courseId || courseId === 'undefined') return;

    setEnrolling(true);
    setError(null);
    try {
      const res = await enrollStudent(courseId, { email });
      setStudents(prev => [...prev, res.data.student]);
      setEmail('');
    } catch (err) {
      setError(err);
    } finally {
      setEnrolling(false);
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
        <BackButton fallback={`/dosen/courses/${courseId}`} />
        <Breadcrumb
          items={[
            { label: 'Dashboard', to: '/dosen/dashboard' },
            { label: 'Kelas', to: `/dosen/courses/${courseId}` },
            { label: 'Mahasiswa' },
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

      <div className='flex items-start justify-between gap-3 flex-wrap'>
        <div>
          <h1 className='text-xl font-bold'>Mahasiswa</h1>
          <p className='text-sm text-gray-600'>Kelola roster mahasiswa di kelas ini.</p>
        </div>

        <Button variant='secondary' onClick={() => navigate(`/dosen/courses/${courseId}`)}>
          Kembali ke Dashboard Kelas
        </Button>
      </div>

      <div className='bg-white rounded shadow p-4 space-y-3'>
        <div>
          <p className='font-medium'>Tambah Mahasiswa</p>
          <p className='text-sm text-gray-600'>Masukkan email mahasiswa untuk enroll.</p>
        </div>

        <div className='flex gap-2 flex-wrap'>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder='Email mahasiswa'
            className='border p-2 flex-1 rounded min-w-55'
          />
          <Button onClick={handleEnroll} disabled={enrolling}>
            {enrolling ? 'Menambah...' : 'Tambah'}
          </Button>
        </div>

        {error && <p className='text-sm text-red-600'>{errorMessage(error)}</p>}
      </div>

      {loading && <p className='text-gray-600'>Memuat mahasiswa...</p>}

      {!loading && !error && students.length === 0 && (
        <div className='bg-white p-4 rounded shadow'>
          <p className='text-gray-600'>Belum ada mahasiswa terdaftar.</p>
        </div>
      )}

      <ul className='space-y-2'>
        {students.map(s => (
          <li key={s.id} className='bg-white p-3 rounded shadow'>
            {s.name} ({s.email})
          </li>
        ))}
      </ul>
    </div>
  );
}
