import { NavLink, useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../components/navigation/BackButton';
import Breadcrumb from '../../components/navigation/Breadcrumb';
import Button from '../../components/ui/Button';

export default function CourseHome() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  if (!courseId || courseId === 'undefined') {
    return <p className='text-gray-600'>Memuat data kelas...</p>;
  }

  const tabClass = ({ isActive }) =>
    `text-sm px-3 py-2 rounded ${isActive ? 'bg-white shadow font-semibold' : 'hover:bg-white/60'
    }`;

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <BackButton fallback='/dosen/dashboard' />
        <Breadcrumb
          items={[
            { label: 'Dashboard', to: '/dosen/dashboard' },
            { label: 'Kelas' },
          ]}
        />
      </div>

      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-xl font-bold'>Dashboard Kelas</h1>
          <p className='text-sm text-gray-600'>
            Mulai dari sini untuk menambah materi, membuat tugas, atau mengecek submission.
          </p>
        </div>

        <div className='flex gap-2'>
          <Button onClick={() => navigate(`/dosen/courses/${courseId}/materials/new`)}>
            Tambah Materi
          </Button>
          <Button
            variant='secondary'
            onClick={() => navigate(`/dosen/courses/${courseId}/assignments/new`)}
          >
            Buat Tugas
          </Button>
        </div>
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

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <button
          onClick={() => navigate(`/dosen/courses/${courseId}/materials`)}
          className='bg-white p-4 rounded shadow hover:bg-gray-50 text-left'
        >
          <p className='font-semibold'>Kelola Materi</p>
          <p className='text-sm text-gray-600'>Tambah dan rapikan materi per pertemuan.</p>
        </button>

        <button
          onClick={() => navigate(`/dosen/courses/${courseId}/assignments`)}
          className='bg-white p-4 rounded shadow hover:bg-gray-50 text-left'
        >
          <p className='font-semibold'>Kelola Tugas</p>
          <p className='text-sm text-gray-600'>Buat tugas dan cek deadline.</p>
        </button>

        <button
          onClick={() => navigate(`/dosen/courses/${courseId}/students`)}
          className='bg-white p-4 rounded shadow hover:bg-gray-50 text-left'
        >
          <p className='font-semibold'>Lihat Mahasiswa</p>
          <p className='text-sm text-gray-600'>Cek roster dan tambah mahasiswa.</p>
        </button>

        <button
          onClick={() => navigate(`/dosen/courses/${courseId}/submissions`)}
          className='bg-white p-4 rounded shadow hover:bg-gray-50 text-left'
        >
          <p className='font-semibold'>Cek Submission</p>
          <p className='text-sm text-gray-600'>Lihat pengumpulan terbaru dan penilaian.</p>
        </button>
      </div>
    </div>
  );
}
