import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssignments } from '../../services/dosen.service';

export default function Assignments() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAssignments(courseId)
      .then(res => setAssignments(res.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <p>Memuat tugas...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Tugas</h1>
        <button
          onClick={() =>
            navigate(`/dosen/courses/${courseId}/assignments/new`)
          }
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Buat Tugas
        </button>
      </div>

      {assignments.length === 0 && (
        <p className="text-gray-500 italic">
          Belum ada tugas di kelas ini.
        </p>
      )}

      {/* List */}
      {assignments.map(task => (
        <div
          key={task.id}
          className="bg-white p-4 rounded shadow flex justify-between items-center"
        >
          <div>
            <h2 className="font-semibold">{task.title}</h2>
            <p className="text-sm text-gray-600">
              Deadline:{' '}
              {new Date(task.dueDate).toLocaleString()}
            </p>
          </div>

          <button
            onClick={() =>
              navigate(
                `/dosen/assignments/${task.id}/submissions`
              )
            }
            className="text-blue-600 hover:underline"
          >
            Lihat Submission →
          </button>
        </div>
      ))}
    </div>
  );
}
