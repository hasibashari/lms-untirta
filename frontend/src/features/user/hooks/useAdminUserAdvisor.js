import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  getUsers, updateDospemStatus, assignAdvisor,
  bulkAssignAdvisor, getAdvisorSummary,
} from '../userService';

export const useAdminUserAdvisor = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('advisors'); // 'advisors' | 'students'

  // Data
  const [dosenList, setDosenList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [advisorSummary, setAdvisorSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [bulkAdvisorId, setBulkAdvisorId] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [expandedAdvisor, setExpandedAdvisor] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    type === 'error' ? toast.error(msg) : toast.success(msg);
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dosenRes, studentRes, summaryRes] = await Promise.all([
        getUsers({ role: 'DOSEN', limit: 100 }),
        getUsers({ role: 'MAHASISWA', limit: 100 }),
        getAdvisorSummary().catch(() => ({ data: [] })),
      ]);
      setDosenList(dosenRes.data || []);
      setStudentList(studentRes.data || []);
      setAdvisorSummary(summaryRes.data || []);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle Dospem status
  const handleToggleDospem = async (userId, currentStatus) => {
    setProcessingId(userId);
    try {
      await updateDospemStatus(userId, !currentStatus);
      setDosenList(prev =>
        prev.map(d => d.id === userId ? { ...d, isDospem: !currentStatus } : d)
      );
      showToast(`Status Dospem berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
      
      // Refresh summary
      const summaryRes = await getAdvisorSummary().catch(() => ({ data: [] }));
      setAdvisorSummary(summaryRes.data || []);
    } catch (err) {
      showToast(err?.message || 'Gagal mengubah status Dospem', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Assign single student
  const handleAssignAdvisor = async (studentId, advisorId) => {
    setProcessingId(studentId);
    try {
      await assignAdvisor(studentId, advisorId || null);
      setStudentList(prev =>
        prev.map(s => {
          if (s.id !== studentId) return s;
          const advisor = advisorId ? dosenList.find(d => d.id === advisorId) : null;
          return {
            ...s,
            advisorId: advisorId || null,
            advisor: advisor ? { id: advisor.id, name: advisor.name, email: advisor.email } : null
          };
        })
      );
      showToast(advisorId ? 'Dosen pembimbing berhasil ditetapkan' : 'Dosen pembimbing berhasil dihapus');
    } catch (err) {
      showToast(err?.message || 'Gagal menetapkan dosen pembimbing', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Bulk assign
  const handleBulkAssign = async () => {
    if (selectedStudents.size === 0 || !bulkAdvisorId) return;
    setBulkProcessing(true);
    try {
      await bulkAssignAdvisor(Array.from(selectedStudents), bulkAdvisorId);
      const advisor = dosenList.find(d => d.id === bulkAdvisorId);
      setStudentList(prev =>
        prev.map(s => {
          if (!selectedStudents.has(s.id)) return s;
          return {
            ...s,
            advisorId: bulkAdvisorId,
            advisor: advisor ? { id: advisor.id, name: advisor.name, email: advisor.email } : null
          };
        })
      );
      showToast(`${selectedStudents.size} mahasiswa berhasil ditetapkan`);
      setSelectedStudents(new Set());
      setBulkAdvisorId('');
    } catch (err) {
      showToast(err?.message || 'Gagal bulk assign', 'error');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Toggle student selection
  const toggleStudent = (id) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Memoized derived data
  const activeDospem = useMemo(() => dosenList.filter(d => d.isDospem), [dosenList]);

  const filteredDosen = useMemo(() => {
    if (!searchQuery.trim()) return dosenList;
    const q = searchQuery.toLowerCase();
    return dosenList.filter(d => d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q));
  }, [dosenList, searchQuery]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentList;
    const q = searchQuery.toLowerCase();
    return studentList.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.advisor?.name?.toLowerCase()?.includes(q)
    );
  }, [studentList, searchQuery]);

  const toggleSelectAllStudents = useCallback(() => {
    const visible = filteredStudents.map(s => s.id);
    setSelectedStudents(prev => {
      const allSelected = visible.every(id => prev.has(id));
      const next = new Set(prev);
      visible.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  }, [filteredStudents]);

  const stats = useMemo(() => {
    const totalDospem = activeDospem.length;
    const totalStudents = studentList.length;
    const assigned = studentList.filter(s => s.advisorId).length;
    return { totalDospem, totalStudents, assigned, unassigned: totalStudents - assigned };
  }, [activeDospem, studentList]);

  return {
    activeTab,
    setActiveTab,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    processingId,
    selectedStudents,
    setSelectedStudents,
    bulkAdvisorId,
    setBulkAdvisorId,
    bulkProcessing,
    expandedAdvisor,
    setExpandedAdvisor,
    fetchData,
    handleToggleDospem,
    handleAssignAdvisor,
    handleBulkAssign,
    toggleStudent,
    toggleSelectAllStudents,
    activeDospem,
    filteredDosen,
    filteredStudents,
    stats,
    advisorSummary,
  };
};
