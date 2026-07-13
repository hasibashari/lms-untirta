import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAssignments } from '../api/assignment.api';
import { getMyKRS } from '../../krs/api/krs.api';

export const useMahasiswaAssignments = () => {
  const { classId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([getAssignments(classId), getMyKRS()])
      .then(([assignmentsRes, krsRes]) => {
        setAssignments(assignmentsRes.data);
        const approvedEnrollments = (krsRes?.data?.enrollments || []).filter(
          (item) => item.status === 'APPROVED'
        );
        const foundEnrollment = approvedEnrollments.find(
          (item) => item.class?.id === classId
        );
        setCourse(foundEnrollment?.class?.course || null);
      })
      .catch(err => toast.error(err?.message || 'Gagal memuat data tugas'))
      .finally(() => setLoading(false));
  }, [classId]);

  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: assignments.length,
    submitted: assignments.filter(a => a.status === 'submitted' || a.status === 'graded').length,
    pending: assignments.filter(
      a => a.status !== 'submitted' && a.status !== 'graded' && new Date(a.dueDate) >= new Date()
    ).length,
    late: assignments.filter(
      a => a.status !== 'submitted' && a.status !== 'graded' && new Date(a.dueDate) < new Date()
    ).length,
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;

    if (diff < 0) return null; // Sudah lewat

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} hari ${hours} jam lagi`;
    if (hours > 0) return `${hours} jam lagi`;
    return 'Kurang dari 1 jam';
  };

  return {
    classId,
    course,
    loading,
    searchQuery,
    setSearchQuery,
    filteredAssignments,
    stats,
    formatDate,
    getTimeRemaining,
  };
};
