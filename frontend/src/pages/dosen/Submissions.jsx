import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getSubmissions,
  gradeSubmission,
} from '../../services/dosen.service';
import SubmissionItem from '../../components/SubmissionItem';

export default function Submissions() {
  const { assignmentId } = useParams();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSubmissions(assignmentId)
      .then(res => setSubmissions(res.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  const handleGrade = async (submissionId, grade, feedback) => {
    try {
      const res = await gradeSubmission(submissionId, {
        grade,
        feedback,
      });

      // Update local state (UX cepat, tanpa refetch)
      setSubmissions(prev =>
        prev.map(s =>
          s.id === submissionId
            ? { ...s, ...res.data }
            : s
        )
      );
    } catch (err) {
      alert('Gagal menyimpan nilai');
    }
  };

  if (loading) return <p>Memuat submission...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  if (submissions.length === 0) {
    return (
      <p className="text-gray-500 italic">
        Belum ada mahasiswa yang mengumpulkan tugas.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">
        Submission Mahasiswa
      </h1>

      {submissions.map(sub => (
        <SubmissionItem
          key={sub.id}
          submission={sub}
          onGrade={handleGrade}
        />
      ))}
    </div>
  );
}
