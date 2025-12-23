import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { getAssignments } from '../../services/dosen.service';
import BackButton from '../../components/navigation/BackButton';
import Breadcrumb from '../../components/navigation/Breadcrumb';
import Button from '../../components/ui/Button';

export default function Assignments() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId || courseId === 'undefined') return;

    getAssignments(courseId)
      .then(res => setAssignments(res.data))
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

  if (loading) return <p className='text-gray-600'>Memuat tugas...</p>;
  if (error) return <p className='text-red-600'>{errorMessage(error)}</p>;

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <BackButton fallback={`/dosen/courses/${courseId}`} />
        <Breadcrumb
          items={[
            { label: 'Dashboard', to: '/dosen/dashboard' },
            { label: 'Kelas', to: `/dosen/courses/${courseId}` },
            { label: 'Tugas' },
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
          <h1 className='text-xl font-bold'>Tugas</h1>
          <p className='text-sm text-gray-600'>Buat tugas dan pantau pengumpulan mahasiswa.</p>
        </div>
        <Button onClick={() => navigate(`/dosen/courses/${courseId}/assignments/new`)}>
          Buat Tugas
        </Button>
      </div>

      {assignments.length === 0 && (
        <div className='bg-white p-4 rounded shadow'>
          <p className='text-gray-600'>Belum ada tugas di kelas ini.</p>
          <p className='text-sm text-gray-500'>Klik “Buat Tugas” untuk mulai.</p>
        </div>
      )}

      {assignments.map(task => (
        <div
          key={task.id}
          className='bg-white p-4 rounded shadow flex justify-between items-center gap-4'
        >
          <div>
            <h2 className='font-semibold'>{task.title}</h2>
            <p className='text-sm text-gray-600'>
              Deadline: {new Date(task.dueDate).toLocaleString('id-ID')}
            </p>
          </div>

          <button
            onClick={() =>
              navigate(`/dosen/courses/${courseId}/assignments/${task.id}/submissions`)
            }
            className='text-blue-600 hover:underline text-sm'
          >
            Lihat Submission →
          </button>
        </div>
      ))}
    </div>
  );
}
