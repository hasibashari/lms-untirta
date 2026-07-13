import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubmissions, gradeSubmission } from '../api/submission.api';
import { getAssignments } from '../../assignment/api/assignment.api';

/**
 * Hook untuk mengelola data submissions dari dosen
 */
export const useDosenSubmissions = () => {
  const { classId, assignmentId } = useParams();

  const [submissions, setSubmissions] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!classId || !assignmentId) return;

    const startTimer = setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);

    Promise.all([getSubmissions(assignmentId), getAssignments(classId)])
      .then(([subRes, assignRes]) => {
        const normalizedSubs = (subRes.data || []).map((sub) => ({
          ...sub,
          grade: sub.grade === -1 ? null : sub.grade,
          submittedAt: sub.submittedAt || null,
        }));
        setSubmissions(normalizedSubs);
        const current = (assignRes.data || []).find(
          (a) => a.id === assignmentId || a.id === parseInt(assignmentId)
        );
        setCurrentAssignment(current);
      })
      .catch((err) => setError(err?.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));

    return () => clearTimeout(startTimer);
  }, [classId, assignmentId]);

  const handleGrade = async (submissionId, grade, feedback) => {
    try {
      const res = await gradeSubmission(submissionId, { grade, feedback });
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? { ...s, grade: res.data?.grade ?? grade, feedback: res.data?.feedback ?? feedback }
            : s
        )
      );
      return { success: true };
    } catch {
      return { success: false, error: 'Gagal menyimpan nilai' };
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchSearch =
      sub.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.student?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const hasGrade = sub.grade !== null && sub.grade !== undefined;
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'submitted' && sub.submittedAt) ||
      (filterStatus === 'not-submitted' && !sub.submittedAt) ||
      (filterStatus === 'graded' && hasGrade) ||
      (filterStatus === 'not-graded' && sub.submittedAt && !hasGrade);

    return matchSearch && matchStatus;
  });

  const stats = {
    total: submissions.length,
    submitted: submissions.filter((s) => s.submittedAt).length,
    notSubmitted: submissions.filter((s) => !s.submittedAt).length,
    graded: submissions.filter((s) => s.grade !== null && s.grade !== undefined).length,
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const isLate = (submittedAt, dueDate) => {
    if (!submittedAt || !dueDate) return false;
    return new Date(submittedAt) > new Date(dueDate);
  };

  return {
    classId,
    assignmentId,
    submissions,
    currentAssignment,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filteredSubmissions,
    stats,
    formatDate,
    isLate,
    handleGrade,
  };
};
