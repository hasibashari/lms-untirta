import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCourses } from '../../services/dosen.service';

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getMyCourses().then(res => setCourses(res.data));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Kelas Saya</h1>

      {courses.map(course => (
        <div
          key={course.id}
          onClick={() => navigate(`/dosen/courses/${course.id}`)}
          className="cursor-pointer bg-white p-4 rounded shadow hover:bg-gray-50"
        >
          <h2 className="font-semibold">{course.title}</h2>
          <p className="text-xs text-gray-500">Kode: {course.code}</p>
        </div>
      ))}
    </div>
  );
}
