import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAssignments, getMyCourses } from '../../services/mahasiswa.service';
import Breadcrumb from '../../components/navigation/Breadcrumb';

const CourseHome = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return; // 🔥 KUNCI UTAMA
    if (courseId === 'undefined') return; // defensive

    Promise.all([getAssignments(courseId), getMyCourses()])
      .then(([assignmentsRes, coursesRes]) => {
        setAssignments(assignmentsRes.data);

        const foundCourse = coursesRes.data.find(
          item => item.course.id === courseId // 🔧 FIX #2
        );
        setCourse(foundCourse?.course);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (!courseId) {
    return <p className="text-gray-500">Memuat data kelas...</p>;
  }


  return (
    <div className='space-y-6'>
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/mahasiswa/dashboard' },
          { label: course?.title || 'Kelas' },
        ]}
      />

      <h1 className='text-xl font-bold'>Dashboard Kelas</h1>

      <p className='text-gray-600'>
        Selamat datang di kelas ini. Silakan lanjutkan ke materi atau tugas.
      </p>

      <div className='flex gap-4'>
        <button
          onClick={() => navigate(`/mahasiswa/courses/${courseId}/materials`)}
          className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
        >
          Lihat Materi
        </button>

        <button
          onClick={() => navigate(`/mahasiswa/courses/${courseId}/assignments`)}
          className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700'
        >
          Lihat Tugas
        </button>
      </div>

      {/* Section Tugas */}
      <div className='mt-6'>
        <h2 className='text-lg font-semibold mb-4'>Tugas Terbaru</h2>

        {loading ? (
          <p className='text-gray-500'>Memuat tugas...</p>
        ) : assignments.length === 0 ? (
          <p className='text-gray-500'>Tidak ada tugas di kelas ini.</p>
        ) : (
          <div className='space-y-3'>
            {assignments.slice(0, 3).map(assignment => (
              <div
                key={assignment.id}
                onClick={() =>
                  navigate(`/mahasiswa/courses/${courseId}/assignments/${assignment.id}`)
                }
                className='cursor-pointer bg-white p-4 rounded shadow hover:bg-gray-50 border-l-4 border-green-500'
              >
                <h3 className='font-semibold'>{assignment.title}</h3>
                <p className='text-sm text-gray-600 mt-1'>
                  Deadline: {new Date(assignment.dueDate).toLocaleString('id-ID')}
                </p>
                <span className='inline-block mt-2 text-xs px-2 py-1 rounded bg-blue-100 text-blue-700'>
                  Status: {assignment.status || 'Belum Dikerjakan'}
                </span>
              </div>
            ))}

            {assignments.length > 3 && (
              <button
                onClick={() => navigate(`/mahasiswa/courses/${courseId}/assignments`)}
                className='text-blue-600 hover:underline text-sm'
              >
                Lihat semua tugas ({assignments.length})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseHome;
