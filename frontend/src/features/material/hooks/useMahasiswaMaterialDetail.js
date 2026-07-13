import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMaterialDetail, getMaterials } from '../api/material.api';
import { getMyKRS } from '../../krs/api/krs.api';

export const useMahasiswaMaterialDetail = (classId, materialId) => {
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!classId) return;

    Promise.all([
      getMaterials(classId),
      getMyKRS(),
    ])
      .then(([materialsRes, krsRes]) => {
        setMaterials(materialsRes.data);

        const approvedEnrollments = (krsRes?.data?.enrollments || []).filter(
          (item) => item.status === 'APPROVED'
        );
        const foundEnrollment = approvedEnrollments.find(
          (item) => item.class?.id === classId
        );
        setCourse(foundEnrollment?.class?.course || null);
      })
      .catch(err => toast.error(err?.message || 'Gagal memuat data kelas'));
  }, [classId]);

  useEffect(() => {
    if (!materialId) return;
    const startTimer = setTimeout(() => {
      setLoading(true);
      setMaterial(null);
    }, 0);

    getMaterialDetail(materialId)
      .then(res => setMaterial(res.data))
      .catch(err => toast.error(err?.message || 'Gagal memuat detail materi'))
      .finally(() => setLoading(false));
    return () => clearTimeout(startTimer);
  }, [materialId]);

  const currentIndex = materials.findIndex(
    m => m.id === parseInt(materialId) || m.id === materialId
  );
  
  const prevMaterial = currentIndex > 0 ? materials[currentIndex - 1] : null;
  const nextMaterial = currentIndex >= 0 && currentIndex < materials.length - 1
    ? materials[currentIndex + 1]
    : null;

  const handleCompleteAndNext = () => {
    toast.success('Materi ditandai selesai!');
    if (nextMaterial) {
      navigate(`/mahasiswa/classes/${classId}/materials/${nextMaterial.id}`);
    } else {
      navigate(`/mahasiswa/classes/${classId}`);
    }
  };

  return {
    material,
    materials,
    course,
    loading,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    currentIndex,
    prevMaterial,
    nextMaterial,
    handleCompleteAndNext,
  };
};
