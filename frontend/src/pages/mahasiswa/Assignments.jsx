import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAssignments, getMyCourses } from '../../services/mahasiswa.service';
import Breadcrumb from '../../components/navigation/Breadcrumb';
import BackButton from '../../components/navigation/BackButton';

export default function Assignments() {
  const { courseId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAssignments(courseId), getMyCourses()])
      .then(([assignmentsRes, coursesRes]) => {
        setAssignments(assignmentsRes.data);
        const foundCourse = coursesRes.data.find(item => item.course.id === parseInt(courseId));
        setCourse(foundCourse?.course);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <p>Memuat tugas...</p>;

  if (assignments.length === 0) {
    return <p>Tidak ada tugas di kelas ini.</p>;
  }

  return (
    <div className='space-y-4'>
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/mahasiswa/dashboard' },
          { label: course?.title || 'Kelas', to: `/mahasiswa/courses/${courseId}` },
          { label: 'Tugas' },
        ]}
      />

      <BackButton fallback={`/mahasiswa/courses/${courseId}`} />

      <h1 className='text-xl font-bold'>Tugas</h1>

      {assignments.map(assignment => (
        <Link
          key={assignment.id}
          to={`/mahasiswa/courses/${courseId}/assignments/${assignment.id}`}
          className='block bg-white p-4 rounded shadow hover:bg-gray-50'
        >
          <h2 className='font-semibold'>{assignment.title}</h2>
          <p className='text-sm text-gray-600'>
            Deadline: {new Date(assignment.dueDate).toLocaleString()}
          </p>
          <p className='text-xs text-blue-600'>Status: {assignment.status}</p>
        </Link>
      ))}
    </div>
  );
}
