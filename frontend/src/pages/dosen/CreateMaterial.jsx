import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { createMaterial } from '../../services/dosen.service';

export default function CreateMaterial() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    await createMaterial(courseId, { title, content });
    navigate(`/dosen/courses/${courseId}/materials`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-bold">Tambah Materi</h1>

      <input
        className="border p-2 w-full"
        placeholder="Judul Materi"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      <textarea
        className="border p-2 w-full"
        placeholder="Konten Materi"
        rows={6}
        value={content}
        onChange={e => setContent(e.target.value)}
      />

      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Simpan
      </button>
    </form>
  );
}
