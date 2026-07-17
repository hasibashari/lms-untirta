import { useState, useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  getAdvisoryStudents,
  updateEnrollmentStatus,
  bulkUpdateEnrollmentStatus,
} from '../api/krs.api';
import { getAllSemesters, updateSemester } from '@/features/academic/api/academic.api';
import { useSemesters } from '@/shared/hooks/useSemesters';

export const useDosenKrs = () => {
  const [academicSemesterId, setAcademicSemesterIdState] = useState(() => {
    return localStorage.getItem('selectedDosenAcademicSemesterId') || null;
  });

  const setAcademicSemesterId = useCallback((id) => {
    if (id) {
      localStorage.setItem('selectedDosenAcademicSemesterId', id);
    } else {
      localStorage.removeItem('selectedDosenAcademicSemesterId');
    }
    setAcademicSemesterIdState(id);
  }, []);

  const [page, setPage] = useState(1);
  const limit = 10;

  // Semester data for filter
  const { semesters } = useSemesters(getAllSemesters);

  // Data state
  const [advisoryData, setAdvisoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [revokeNoteId, setRevokeNoteId] = useState(null);
  const [revokeNote, setRevokeNote] = useState('');
  const [revokingId, setRevokingId] = useState(null);
  const [expandedStudentAll, setExpandedStudentAll] = useState(null);
  const [isAutoKrs, setIsAutoKrs] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Show temporary toast
  const showToast = useCallback((msg, type = 'success') => {
    type === 'error' ? toast.error(msg) : toast.success(msg);
  }, []);

  // Fetch advisory students
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (academicSemesterId) params.academicSemesterId = academicSemesterId;
      const res = await getAdvisoryStudents(params);
      setAdvisoryData(res.data || null);
    } catch (err) {
      setError(err?.message || err || 'Gagal memuat data mahasiswa');
    } finally {
      setLoading(false);
    }
  }, [academicSemesterId, page]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);


  // Auto-select active semester if none selected yet
  useEffect(() => {
    if (semesters.length > 0 && !academicSemesterId) {
      const active = semesters.find(s => s.status === 'OPEN');
      if (active) {
        setAcademicSemesterId(active.id);
        setIsAutoKrs(active.isAutoKrs ?? true);
      }
    }
  }, [semesters, academicSemesterId]);

  const prevSemesterRef = useRef(academicSemesterId);

  // Clear data immediately when semester changes to prevent data bleeding
  useEffect(() => {
    if (prevSemesterRef.current && prevSemesterRef.current !== academicSemesterId) {
      setAdvisoryData(null);
    }
    prevSemesterRef.current = academicSemesterId;
  }, [academicSemesterId]);

  // Sync isAutoKrs state when semester ID changes
  useEffect(() => {
    if (academicSemesterId && semesters.length > 0) {
      const selected = semesters.find(s => s.id === academicSemesterId);
      if (selected) {
        setIsAutoKrs(selected.isAutoKrs ?? true);
      }
    }
  }, [academicSemesterId, semesters]);

  const handleToggleAutoKrs = async () => {
    const activeSem = semesters.find(s => s.id === academicSemesterId) || semesters.find(s => s.status === 'OPEN');
    if (!activeSem) {
      showToast('Pilih semester aktif terlebih dahulu', 'error');
      return;
    }

    setIsToggling(true);
    const newValue = !isAutoKrs;
    try {
      await updateSemester(activeSem.id, { isAutoKrs: newValue });
      setIsAutoKrs(newValue);
      showToast(`Mode ${newValue ? 'Auto-Approval' : 'Manual Approval'} diaktifkan`);
    } catch {
      showToast('Gagal mengubah pengaturan', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  // Revoke approval (APPROVED → REJECTED)
  const handleRevoke = async (enrollmentId) => {
    if (!revokeNote.trim()) {
      showToast('Alasan pencabutan persetujuan wajib diisi', 'error');
      return;
    }
    setRevokingId(enrollmentId);
    try {
      await updateEnrollmentStatus(enrollmentId, { status: 'REJECTED', note: revokeNote });
      showToast('Persetujuan KRS berhasil dicabut');
      setRevokeNoteId(null);
      setRevokeNote('');
      fetchStudents();
    } catch (err) {
      showToast(err?.message || err || 'Gagal mencabut persetujuan', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  return {
    academicSemesterId,
    setAcademicSemesterId,
    page,
    setPage,
    limit,
    semesters,
    advisoryData,
    loading,
    error,
    revokeNoteId,
    setRevokeNoteId,
    revokeNote,
    setRevokeNote,
    revokingId,
    expandedStudentAll,
    setExpandedStudentAll,
    isAutoKrs,
    isToggling,
    handleToggleAutoKrs,
    handleRevoke,
    refetch: fetchStudents,
    bulkUpdate: bulkUpdateEnrollmentStatus,
    showToast,
  };
};
