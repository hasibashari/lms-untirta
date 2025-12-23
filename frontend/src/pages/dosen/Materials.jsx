import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMaterials } from '../../services/dosen.service';

export default function Materials() {
  const { courseId } = useParams();
  const [materials, setMaterials] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getMaterials(courseId).then(res => setMaterials(res.data));
  }, [courseId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Materi</h1>
        <button
          onClick={() =>
            navigate(`/dosen/courses/${courseId}/materials/new`)
          }
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Tambah Materi
        </button>
      </div>

      {materials.map(mat => (
        <div key={mat.id} className="bg-white p-4 rounded shadow">
          {mat.order}. {mat.title}
        </div>
      ))}
    </div>
  );
}
