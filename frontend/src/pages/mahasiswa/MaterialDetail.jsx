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

      <h1 className='text-xl font-bold'>{material.title}</h1>

      <div className='prose max-w-none' dangerouslySetInnerHTML={{ __html: material.content }} />

      {material.attachments?.length > 0 && (
        <div>
          <h2 className='font-semibold mb-2'>Lampiran</h2>
          {material.attachments.map((file, i) => (
            <a
              key={i}
              href={file.url}
              target='_blank'
              rel='noopener noreferrer'
              className='text-blue-600 underline block'
            >
              {file.type.toUpperCase()}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialDetail;
