import { useState, useEffect, useCallback } from 'react';
import { getMaterials } from '../api/material.api';
import { getMyKRS } from '../../krs/api/krs.api';

export const useMahasiswaMaterials = (classId) => {
  const [materials, setMaterials] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    if (!classId) return;
    setLoading(true);
    setError(null);

    Promise.all([getMaterials(classId), getMyKRS()])
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
      .catch(err => {
        console.error(err);
        setError(err.message || 'Gagal memuat data materi');
      })
      .finally(() => setLoading(false));
  }, [classId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchData]);

  return {
    materials,
    course,
    loading,
    error,
    fetchData,
  };
};
