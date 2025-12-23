import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMyAssignmentStatus, submitAssignment } from '../../services/mahasiswa.service';
import Breadcrumb from '../../components/navigation/Breadcrumb';
import BackButton from '../../components/navigation/BackButton';

export default function AssignmentDetail() {
  const { courseId, assignmentId } = useParams();

  const [status, setStatus] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMyAssignmentStatus(assignmentId)
      .then(res => setStatus(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await submitAssignment(assignmentId, { fileUrl, note });
      const res = await getMyAssignmentStatus(assignmentId);
      setStatus(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Memuat tugas...</p>;
  if (!status) return <p>Data tugas tidak ditemukan.</p>;

  const assignmentTitle = status?.assignment?.title;
  const courseTitle = status?.assignment?.course?.title;

  console.log('DEBUG breadcrumb source', {
    status,
    courseId,
  });

  return (
    <div className='space-y-4'>
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/mahasiswa/dashboard' },
          { label: 'Kelas', to: `/mahasiswa/courses/${courseId}` },
          { label: 'Tugas', to: `/mahasiswa/courses/${courseId}/assignments` },
          { label: status?.title || 'Detail' },
        ]}
      />

      <BackButton fallback={`/mahasiswa/courses/${courseId}/assignments`} />

      <h1 className='text-xl font-bold'>Detail Tugas</h1>

      <p>
        Status: <strong>{status.status}</strong>
      </p>

      {status.grade !== null && (
        <p>
          Nilai: <strong>{status.grade}</strong>
        </p>
      )}

      {status.feedback && <p className='text-gray-600'>Feedback: {status.feedback}</p>}

      {status.status === 'Submitted' ? (
        <p className='text-green-600'>Tugas sudah dikumpulkan.</p>
      ) : (
        <form onSubmit={handleSubmit} className='space-y-3'>
          {error && <p className='text-red-600'>{error}</p>}

          <input
            type='url'
            placeholder='Link file tugas'
            value={fileUrl}
            onChange={e => setFileUrl(e.target.value)}
            className='w-full border p-2 rounded'
            required
          />

          <textarea
            placeholder='Catatan (opsional)'
            value={note}
            onChange={e => setNote(e.target.value)}
            className='w-full border p-2 rounded'
          />

          <button
            type='submit'
            disabled={submitting}
            className='px-4 py-2 bg-blue-600 text-white rounded'
          >
            {submitting ? 'Mengirim...' : 'Kumpulkan Tugas'}
          </button>
        </form>
      )}
    </div>
  );
}
