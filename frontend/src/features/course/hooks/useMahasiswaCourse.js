import { useState, useEffect, useCallback } from 'react';
import { getMyKRS } from '../../krs/api/krs.api';
import { getMaterials } from '../../material/materialService';
import { getAssignments } from '../../assignment/assignmentService';

export const useMahasiswaCourse = (classId) => {
  const [assignments, setAssignments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    if (!classId || classId === 'undefined') return;
    setLoading(true);
    setError(null);

    Promise.all([
      getAssignments(classId),
      getMyKRS(),
      getMaterials(classId),
    ])
      .then(([assignmentsRes, krsRes, materialsRes]) => {
        setAssignments(assignmentsRes.data || []);
        setMaterials(materialsRes.data || []);

        const approvedEnrollments = (krsRes?.data?.enrollments || []).filter(
          (item) => item.status === 'APPROVED'
        );
        const foundEnrollment = approvedEnrollments.find(
          (item) => item.classId === classId || item.classId === parseInt(classId)
        );
        if (foundEnrollment) {
          setCourse({
            ...foundEnrollment.class.course,
            teacher: foundEnrollment.class.lecturer,
            classSection: foundEnrollment.class.section,
          });
        } else {
          setCourse(null);
        }
      })
      .catch((err) => setError(err?.message || 'Gagal memuat data kelas'))
      .finally(() => setLoading(false));
  }, [classId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    course,
    materials,
    assignments,
    loading,
    error,
    refetch: fetchData,
  };
};
