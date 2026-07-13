import { useState, useEffect, useCallback } from 'react';
import { getClassStudents } from '../../class/classService';

export const useClassStudents = (classId) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStudents = useCallback(() => {
    if (!classId || classId === 'undefined') return;
    setLoading(true);
    setError(null);

    getClassStudents(classId)
      .then(res => {
        const enrollments = res.data || [];
        const studentList = enrollments.map(enrollment => ({
          id: enrollment.student?.id,
          name: enrollment.student?.name,
          email: enrollment.student?.email,
          enrollmentId: enrollment.enrollmentId,
          enrolledAt: enrollment.enrolledAt,
        }));
        setStudents(studentList);
      })
      .catch(err => setError(err?.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, [classId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return {
    students,
    filteredStudents,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    formatDate,
    refetch: fetchStudents,
  };
};
