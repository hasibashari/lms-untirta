import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createAssignment } from '../../services/dosen.service';

export default function CreateAssignment() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createAssignment(courseId, {
        title,
        description,
        dueDate,
      });

      navigate(`/dosen/courses/${courseId}/assignments`);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <h1 className="text-xl font-bold">Buat Tugas</h1>

      {error && <p className="text-red-600">{error}</p>}

      <div>
        <label className="block text-sm font-medium">
          Judul Tugas
        </label>
        <input
          className="border p-2 w-full rounded"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">
          Deskripsi
        </label>
        <textarea
          className="border p-2 w-full rounded"
          rows={4}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">
          Deadline
        </label>
        <input
          type="datetime-local"
          className="border p-2 w-full rounded"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          required
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(`/dosen/courses/${courseId}/assignments`)
          }
          className="border px-4 py-2 rounded"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
