import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  getCourseStudents,
  enrollStudent,
} from '../../services/dosen.service';

export default function Students() {
  const { courseId } = useParams();
  const [email, setEmail] = useState('');
  const [students, setStudents] = useState([]);

  useEffect(() => {
    getCourseStudents(courseId).then(res => setStudents(res.data));
  }, [courseId]);

  const handleEnroll = async () => {
    const res = await enrollStudent(courseId, { email });
    setStudents(prev => [...prev, res.data.student]);
    setEmail('');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Mahasiswa</h1>

      <div className="flex gap-2">
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email mahasiswa"
          className="border p-2 flex-1"
        />
        <button
          onClick={handleEnroll}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Tambah
        </button>
      </div>

      <ul className="space-y-2">
        {students.map(s => (
          <li key={s.id} className="bg-white p-3 rounded shadow">
            {s.name} ({s.email})
          </li>
        ))}
      </ul>
    </div>
  );
}
