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

      <div className='bg-white p-4 rounded shadow space-y-2'>
        <h2 className='font-semibold text-lg'>{status.title}</h2>
        <p className='text-gray-600'>{status.description}</p>
        <p className='text-sm text-gray-500'>
          Deadline: {new Date(status.dueDate).toLocaleString()}
        </p>
        <p>
          Status: <strong>{status.status}</strong>
        </p>
        {status.grade !== null && (
          <p>
            Nilai: <strong>{status.grade}</strong>
          </p>
        )}
        {status.feedback && <p className='text-gray-600'>Feedback: {status.feedback}</p>}
      </div>

      {status.status === 'Submitted' ? (
        <p className='text-green-600'>Tugas sudah dikumpulkan.</p>
      ) : (
        <form onSubmit={handleSubmit} className='bg-white p-4 rounded shadow space-y-3'>
          {error && (
            <p className='text-red-600 bg-red-50 p-3 rounded'>
              {error.response?.data?.message || error.message || 'Terjadi kesalahan'}
            </p>
          )}

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
            rows={4}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Mengirim...' : 'Kumpulkan Tugas'}
          </button>
        </form>
      )}
    </div>
  );
}
