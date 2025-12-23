import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCourses } from '../../services/mahasiswa.service';

import Breadcrumb from '../../components/navigation/Breadcrumb';

<Breadcrumb items={[{ label: 'Dashboard', to: '/mahasiswa/dashboard' }]} />;

const MahasiwaDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getMyCourses()
      .then(res => setCourses(res.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Memuat kelas...</p>;
  if (error) return <p className='text-red-600'>{error}</p>;

  if (courses.length === 0) {
    return <p className='text-gray-600'>Belum terdaftar di kelas.</p>;
  }

  return (
    <div className='space-y-4'>
      <h1 className='text-xl font-bold'>Kelas Saya</h1>

      {courses.map(item => (
        <div
          key={item.enrollmentId}
          onClick={() => navigate(`/mahasiswa/courses/${item.course.id}`)}
          className='cursor-pointer bg-white p-4 rounded shadow hover:bg-gray-50'
        >
          <div className='bg-white p-5 rounded-lg shadow hover:shadow-md transition'>
            <h2 className='font-semibold text-lg'>{item.course.title}</h2>
            <p className='text-sm text-gray-600 mt-1'>Dosen: {item.course.teacher.name}</p>

            <div className='mt-3 flex justify-between items-center'>
              <span className='text-xs text-gray-500'>Kode: {item.course.code}</span>
              <span className='text-blue-600 text-sm font-medium'>Masuk →</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MahasiwaDashboard;
