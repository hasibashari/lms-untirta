import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAssignments, deleteAssignment } from '../api/assignment.api';

export const useDosenAssignments = () => {
  const { classId } = useParams();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchAssignments = () => {
    if (!classId || classId === 'undefined') return;

    setLoading(true);
    getAssignments(classId)
      .then(res => setAssignments(res.data || []))
      .catch(err => setError(err?.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteAssignment(deleteConfirm.id);
      setAssignments((prev) => prev.filter((a) => a.id !== deleteConfirm.id));
      toast.success('Tugas berhasil dihapus');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menghapus tugas');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDeadlinePassed = (dueDate) => new Date(dueDate) < new Date();

  const isDeadlineNear = (dueDate) => {
    const diff = new Date(dueDate) - new Date();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;

    if (diff < 0) {
      const days = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Baru saja berakhir';
      return `${days} hari yang lalu`;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} hari ${hours} jam lagi`;
    if (hours > 0) return `${hours} jam lagi`;
    return 'Kurang dari 1 jam';
  };

  return {
    classId,
    assignments,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    deleteConfirm,
    setDeleteConfirm,
    filteredAssignments,
    fetchAssignments,
    handleDelete,
    isDeadlinePassed,
    isDeadlineNear,
    formatDate,
    getRelativeTime,
  };
};
