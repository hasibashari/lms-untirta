import { useNavigate, useParams } from 'react-router-dom';

export default function CourseHome() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Dashboard Kelas</h1>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate(`/dosen/courses/${courseId}/materials`)}
          className="bg-white p-4 rounded shadow hover:bg-gray-50"
        >
          Kelola Materi
        </button>

        <button
          onClick={() => navigate(`/dosen/courses/${courseId}/students`)}
          className="bg-white p-4 rounded shadow hover:bg-gray-50"
        >
          Mahasiswa
        </button>

        <button
          onClick={() => navigate(`/dosen/courses/${courseId}/assignments`)}
          className="bg-white p-4 rounded shadow hover:bg-gray-50"
        >
          Tugas
        </button>
      </div>
    </div>
  );
}
