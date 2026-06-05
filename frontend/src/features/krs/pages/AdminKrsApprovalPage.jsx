import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Loader2, AlertCircle, CheckCircle, Users,
  Clock, BarChart3, ChevronDown, ChevronUp, Search,
} from 'lucide-react';
import { getKrsMonitoring } from '../krsService';
import { getAllSemesters } from '@/features/academic/academicService';
import SemesterFilter from '@/shared/components/forms/SemesterFilter';
import KrsStatusBadge from '../components/KrsStatusBadge';
import DashboardJumbotron from '@/shared/components/layout/Jumbotron';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/shared/components/ui/pagination';

// ============================================================
// Admin KRS Monitoring Page (Read-Only)
// Admin can monitor KRS status but cannot approve/reject
// ============================================================

const AdminKrsMonitoringPage = () => {
  // Filter state
  const [academicSemesterId, setAcademicSemesterId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 50; // Use larger limit for grouping since we paginate enrollments

  // Semester data for filter
  const [semesters, setSemesters] = useState([]);

  // Data state
  const [monitoringData, setMonitoringData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (academicSemesterId) params.academicSemesterId = academicSemesterId;
      const res = await getKrsMonitoring(params);
      setMonitoringData(res.data || null);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data monitoring KRS');
    } finally {
      setLoading(false);
    }
  }, [academicSemesterId, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    getAllSemesters()
      .then(res => {
        // Handle both { data: [...] } and { data: { data: [...] } } patterns
        const data = res.data?.data || res.data || [];
        setSemesters(Array.isArray(data) ? data : []);
      })
      .catch(() => setSemesters([]));
  }, []);

  const enrollments = useMemo(() => monitoringData?.enrollments || [], [monitoringData]);
  const summary = monitoringData?.summary || {};
  const meta = monitoringData?._meta?.pagination;

  // Group enrollments by student
  const groupedByStudent = useMemo(() => {
    let filtered = enrollments;
    if (statusFilter !== 'all') {
      filtered = enrollments.filter(e => e.status === statusFilter);
    }

    const map = new Map();
    for (const e of filtered) {
      const sid = e.student?.id;
      if (!sid) continue;
      if (!map.has(sid)) {
        map.set(sid, {
          student: e.student,
          enrollments: [],
          totalSKS: 0,
          statuses: new Set(),
        });
      }
      const group = map.get(sid);
      group.enrollments.push(e);
      group.totalSKS += e.class?.course?.sks || 3;
      group.statuses.add(e.status);
    }
    return Array.from(map.values());
  }, [enrollments, statusFilter]);

  // Filtered by search
  const filteredGroups = useMemo(() => {
    if (!debouncedSearch.trim()) return groupedByStudent;
    const q = debouncedSearch.toLowerCase();
    return groupedByStudent.filter(
      g =>
        g.student.name?.toLowerCase().includes(q) ||
        g.student.email?.toLowerCase().includes(q)
    );
  }, [groupedByStudent, debouncedSearch]);

  // Toggle expand a student row
  const toggleExpand = (studentId) => {
    setExpandedStudent(prev => (prev === studentId ? null : studentId));
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return '-';
    return new Date(dateValue).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardJumbotron
        icon={BarChart3}
        title="Monitoring KRS"
        subtitle="Pantau status KRS seluruh mahasiswa. Persetujuan dilakukan oleh Dosen Pembimbing."
      />

      {/* Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Users size={20} className="text-slate-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{summary.total || 0}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">Total KRS</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-amber-600 truncate">{summary.pending || 0}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">Pending</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">{summary.approved || 0}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">Approved</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-red-600 truncate">{summary.rejected || 0}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">Rejected</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SemesterFilter
            semesters={semesters}
            academicSemesterId={academicSemesterId}
            onAcademicSemesterChange={(val) => {
              setAcademicSemesterId(val === 'all' ? null : val);
              setPage(1);
            }}
            className="w-full"
          />
          <div className="w-full">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="w-full">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Cari Mahasiswa</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-slate-500">Memuat data monitoring...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={fetchData} className="mt-3 text-sm text-blue-600 hover:underline">
            Coba lagi
          </button>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BarChart3 size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">
            {searchQuery
              ? 'Tidak ditemukan mahasiswa yang cocok'
              : 'Belum ada data KRS'}
          </p>
          <p className="text-sm text-slate-400 mt-1">Coba ubah filter semester atau status</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map(group => {
            const isExpanded = expandedStudent === group.student.id;

            return (
              <div
                key={group.student.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                {/* Student Row */}
                <div
                  className="flex items-center gap-4 p-4 sm:p-5 cursor-pointer hover:bg-slate-50 transition"
                  onClick={() => toggleExpand(group.student.id)}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-blue-700 font-bold text-sm">
                      {group.student.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 truncate">{group.student.name}</p>
                      <div className="flex sm:hidden gap-1">
                        {[...group.statuses].map(status => (
                          <KrsStatusBadge key={status} status={status} hideLabel className="scale-75 origin-left" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{group.student.email}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Dospem: {group.student.advisor?.name || '-'}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium uppercase tracking-tight">
                      {group.enrollments.length} MK
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 rounded-full text-[11px] font-medium uppercase tracking-tight">
                      {group.totalSKS} SKS
                    </span>
                    {[...group.statuses].map(status => (
                      <KrsStatusBadge key={status} status={status} />
                    ))}
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400 shrink-0" />
                  )}
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    <div className="overflow-x-auto">
                      <Table className="w-full min-w-[700px]">
                        <TableHeader>
                          <TableRow className="bg-slate-50/50">
                            <TableHead className="w-[50px] text-center">No</TableHead>
                            <TableHead className="min-w-[200px]">Mata Kuliah</TableHead>
                            <TableHead className="w-[70px] text-center">SKS</TableHead>
                            <TableHead className="min-w-[150px]">Dosen MK</TableHead>
                            <TableHead className="w-[140px] text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.enrollments.map((enrollment, index) => (
                            <TableRow key={enrollment.id} className="hover:bg-slate-50">
                              <TableCell className="text-center font-medium text-slate-400 pl-4">
                                {index + 1}
                              </TableCell>
                              <TableCell className="align-top pl-4">
                                <p className="font-medium text-slate-900 line-clamp-2" title={`${enrollment.class?.course?.code} - ${enrollment.class?.course?.title}`}>
                                  {enrollment.class?.course?.title}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5 truncate" title={`${enrollment.class?.course?.code} · Kelas ${enrollment.class?.section} · ${enrollment.class?.academicSemester?.academicYear} — ${enrollment.class?.academicSemester?.semesterType}`}>
                                  {enrollment.class?.course?.code} · Kelas {enrollment.class?.section} · {' '}
                                  {enrollment.class?.academicSemester?.academicYear} — {enrollment.class?.academicSemester?.semesterType}
                                </p>
                              </TableCell>
                              <TableCell className="text-center font-medium">
                                {enrollment.class?.course?.sks || 3}
                              </TableCell>
                              <TableCell className="text-sm text-slate-600 truncate" title={enrollment.class?.lecturer?.name || enrollment.class?.course?.teacher?.name || 'Belum ditetapkan'}>
                                {enrollment.class?.lecturer?.name || enrollment.class?.course?.teacher?.name || 'Belum ditetapkan'}
                              </TableCell>
                              <TableCell className="text-center pr-4 sm:pr-6">
                                <div className="inline-flex flex-col items-center gap-1">
                                  <KrsStatusBadge status={enrollment.status} />
                                  <span className="text-[11px] text-slate-500 whitespace-nowrap">
                                    {enrollment.status === 'APPROVED'
                                      ? formatDateTime(enrollment.approvedAt)
                                      : formatDateTime(enrollment.submittedAt)}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600">
                      <span>
                        Total: <strong>{group.enrollments.length}</strong> MK | <strong>{group.totalSKS}</strong> SKS
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {meta && meta.totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    aria-disabled={page === 1}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm text-slate-500 mx-4">
                    Halaman {meta.currentPage} dari {meta.totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} 
                    aria-disabled={page === meta.totalPages}
                    className={page === meta.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminKrsMonitoringPage;
