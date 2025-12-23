import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMaterialDetail } from '../../services/dosen.service';
import Breadcrumb from '../../components/navigation/Breadcrumb';
import BackButton from '../../components/navigation/BackButton';

const MaterialDetail = () => {
  const { courseId, materialId } = useParams();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMaterialDetail(materialId)
      .then(res => setMaterial(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [materialId]);

  if (loading) return <p>Memuat materi...</p>;
  if (!material) return <p>Materi tidak ditemukan.</p>;


  return (
    <div className='space-y-6'>
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/mahasiswa/dashboard' },
          { label: material.course?.title || 'Kelas', to: `/mahasiswa/courses/${courseId}` },
          { label: 'Materi', to: `/mahasiswa/courses/${courseId}/materials` },
          { label: material.title },
        ]}
      />

      <BackButton fallback={`/mahasiswa/courses/${courseId}/materials`} />

      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">
          {material.title}
        </h1>

        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: material.content }}
        />
      </div>

      {material.attachments && material.attachments.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-4">Lampiran</h2>
          <div className="space-y-2">
            {material.attachments.map((file, i) => (
              <a
                key={i}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline p-2 hover:bg-blue-50 rounded transition"
              >
                📎 {file.type.toUpperCase()} - {file.url.split('/').pop() || 'Lihat File'}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialDetail;
