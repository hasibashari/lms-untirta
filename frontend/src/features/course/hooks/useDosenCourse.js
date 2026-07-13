import { useState, useEffect, useCallback } from 'react';
import { getClassById, getClassStudents } from '../../class/api/class.api';
import { getMaterials } from '../../material/api/material.api';
import { getAssignments } from '../../assignment/assignmentService';

export const useDosenCourse = (classId) => {
  const [classData, setClassData] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    if (!classId || classId === 'undefined') return;
    setLoading(true);
    setError(null);

    Promise.all([
      getClassById(classId),
      getMaterials(classId),
      getAssignments(classId),
      getClassStudents(classId),
    ])
      .then(([classRes, materialsRes, assignmentsRes, studentsRes]) => {
        setClassData(classRes.data);
        setMaterials(materialsRes.data || []);
        setAssignments(assignmentsRes.data || []);
        setStudents(studentsRes.data || []);
      })
      .catch((err) => setError(err?.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, [classId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return {
    classData,
    materials,
    assignments,
    students,
    loading,
    error,
    refetch: fetchData,
  };
};
