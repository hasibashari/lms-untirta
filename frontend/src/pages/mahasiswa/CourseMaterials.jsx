import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMaterials } from '../../services/dosen.service';
import { getMyCourses } from '../../services/mahasiswa.service';
import Breadcrumb from '../../components/navigation/Breadcrumb';
import BackButton from '../../components/navigation/BackButton';

const CourseMaterials = () => {
  const { courseId } = useParams();
  const [materials, setMaterials] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return; // 🔥 KUNCI UTAMA

    Promise.all([getMaterials(courseId), getMyCourses()])
      .then(([materialsRes, coursesRes]) => {
        setMaterials(materialsRes.data);

        const foundCourse = coursesRes.data.find(
          item => item.course.id === parseInt(courseId)
        );
        setCourse(foundCourse?.course);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (!courseId) {
    return <p className='text-gray-500'>Memuat data kelas...</p>;
  }

  if (loading) return <p>Memuat materi...</p>;

  if (materials.length === 0) {
    return <p>Belum ada materi di kelas ini.</p>;
  }

  return (
    <div className='space-y-4'>
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/mahasiswa/dashboard' },
          { label: course?.title || 'Kelas', to: `/mahasiswa/courses/${courseId}` },
          { label: 'Materi' },
        ]}
      />

      <BackButton fallback={`/mahasiswa/courses/${courseId}`} />

      <h1 className='text-xl font-bold'>Daftar Materi</h1>

      <ol className='space-y-2'>
        {materials.map(material => (
          <li key={material.id} className="flex items-center gap-4 bg-white p-4 rounded shadow hover:bg-gray-50 transition">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 font-semibold rounded-full">
              {material.order}
            </div>

            <Link
              to={`/mahasiswa/courses/${courseId}/materials/${material.id}`}
              className="font-medium text-gray-800 hover:underline"
            >
              {material.title}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default CourseMaterials;
