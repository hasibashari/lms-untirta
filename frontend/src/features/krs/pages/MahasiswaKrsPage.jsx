import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  Plus,
  X,
  ArrowDownUp,
  Printer,
  Trash2,
  UserCheck,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAvailableClasses,
  getMyKRS,
  enrollClass,
  dropClass,
  reviseEnrollment,
} from '../krsService';
import { getStudentSemesters } from '@/features/academic/academicService';
import KrsStatusBadge from '../components/KrsStatusBadge';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/ui/StatCard';
import InfoBanner from '@/components/ui/InfoBanner';
import CourseBadge from '@/components/ui/CourseBadge';
import SectionHeader from '@/components/ui/SectionHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

/**
 * KRS (Kartu Rencana Studi) — Simplified Approval Workflow
 *
 * Features:
 * - Semester selector: OPEN + CLOSED semesters visible
 * - OPEN semester: full KRS workflow (enroll, drop, revise)
 * - CLOSED semester: read-only view of enrollments, no actions
 */
const StudyPlan = () => {
  const { user } = useAuth();

  // Semester selector state
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [semestersLoading, setSemestersLoading] = useState(true);

  // Data state
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableMeta, setAvailableMeta] = useState(null);
  const [krsData, setKrsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Action states
  const [enrolling, setEnrolling] = useState(null);
  const [dropping, setDropping] = useState(null);
  const [revising, setRevising] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Course-level filter states (tingkat MK)
  const [selectedCourseSemester, setSelectedCourseSemester] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Derived data
  const enrollments = krsData?.enrollments || [];
  const summary = krsData?.summary || {};

  // Currently selected semester object
  const currentSemester = useMemo(
    () => semesters.find((s) => s.id === selectedSemesterId) || null,
    [semesters, selectedSemesterId],
  );

  // Is the current semester read-only? (CLOSED = read-only)
  const isReadOnly = currentSemester?.status === 'CLOSED';

  // ==================== SEMESTER LOADING ====================

  useEffect(() => {
    const loadSemesters = async () => {
      setSemestersLoading(true);
      try {
        const res = await getStudentSemesters();
        const list = res?.data?.data || res?.data || [];
        setSemesters(list);

        // Auto-select: prefer OPEN semester, else latest CLOSED
        if (list.length > 0) {
          const openSem = list.find((s) => s.status === 'OPEN');
          setSelectedSemesterId(openSem ? openSem.id : list[0].id);
        }
      } catch {
        setSemesters([]);
      } finally {
        setSemestersLoading(false);
      }
    };
    loadSemesters();
  }, []);

  // ==================== DATA LOADING (triggered by semester selection) ====================

  const fetchData = useCallback(async () => {
    if (!selectedSemesterId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = { academicSemesterId: selectedSemesterId };

      const [availableRes, krsRes] = await Promise.all([
        // Only fetch available classes for OPEN semesters
        currentSemester?.status === 'OPEN'
          ? getAvailableClasses(params)
          : Promise.resolve({ data: [] }),
        getMyKRS(params),
      ]);

      setAvailableClasses(Array.isArray(availableRes?.data) ? availableRes.data : []);
      setAvailableMeta(availableRes?._meta || null);
      setKrsData(krsRes?.data || null);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [selectedSemesterId, currentSemester?.status]);

  useEffect(() => {
    if (!semestersLoading) {
      fetchData();
    }
  }, [fetchData, semestersLoading]);

  // Enrolled class IDs
  const enrolledClassIds = useMemo(() => {
    return new Set(enrollments.map((e) => e.class?.id));
  }, [enrollments]);

  // Filter available classes
  const availableFiltered = useMemo(
    () =>
      availableClasses.filter((cls) => {
        if (enrolledClassIds.has(cls.id)) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matches =
            cls.course?.title?.toLowerCase().includes(q) ||
            cls.course?.code?.toLowerCase().includes(q) ||
            cls.lecturer?.name?.toLowerCase().includes(q);
          if (!matches) return false;
        }
        if (
          selectedCourseSemester !== 'all' &&
          cls.course?.semester !== parseInt(selectedCourseSemester)
        )
          return false;
        return true;
      }),
    [availableClasses, enrolledClassIds, searchQuery, selectedCourseSemester],
  );

  // Paginated available classes
  const paginatedClasses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return availableFiltered.slice(start, start + itemsPerPage);
  }, [availableFiltered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(availableFiltered.length / itemsPerPage);

  // Enrollment stats
  const enrollmentStats = useMemo(() => {
    const stats = { pending: 0, approved: 0, rejected: 0 };
    for (const e of enrollments) {
      if (e.status === 'PENDING') stats.pending++;
      else if (e.status === 'APPROVED') stats.approved++;
      else if (e.status === 'REJECTED') stats.rejected++;
    }
    return stats;
  }, [enrollments]);

  // Total SKS (exclude rejected)
  const totalSKS = useMemo(() => {
    return enrollments
      .filter((e) => e.status !== 'REJECTED')
      .reduce((sum, e) => sum + (e.class?.course?.sks || 3), 0);
  }, [enrollments]);

  // Toast helpers
  const showSuccess = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };
  const showError = (msg) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 6000);
  };

  const handlePrintKrs = () => {
    window.print();
  };

  // ===== ACTIONS (only when OPEN) =====
  const handleEnroll = async (classId) => {
    if (isReadOnly) return;
    setEnrolling(classId);
    setActionError(null);
    try {
      await enrollClass(classId);
      showSuccess('Berhasil menambahkan kelas ke KRS. Menunggu persetujuan Dosen PA.');
      await fetchData();
    } catch (err) {
      const responseData = err?.response?.data;
      if (responseData?.code === 'SKS_LIMIT_EXCEEDED') {
        const d = responseData.details;
        showError(
          `Total SKS melebihi batas! Saat ini ${d?.currentSKS || '?'} SKS, ` +
          `menambah ${d?.courseSKS || '?'} SKS melebihi batas ${d?.maxSKS || '?'} SKS.`,
        );
      } else {
        showError(responseData?.message || err?.message || 'Gagal menambahkan kelas');
      }
    } finally {
      setEnrolling(null);
    }
  };

  const handleDrop = async (classId) => {
    if (isReadOnly) return;
    setDropping(classId);
    setActionError(null);
    try {
      await dropClass(classId);
      showSuccess('Berhasil menghapus kelas dari KRS');
      await fetchData();
    } catch (err) {
      showError(err?.response?.data?.message || err?.message || 'Gagal menghapus kelas');
    } finally {
      setDropping(null);
    }
  };

  const handleRevise = async (enrollmentId) => {
    if (isReadOnly) return;
    setRevising(enrollmentId);
    setActionError(null);
    try {
      const res = await reviseEnrollment(enrollmentId);
      showSuccess(res?.data?.message || 'KRS berhasil direvisi. Menunggu persetujuan Dosen PA.');
      await fetchData();
    } catch (err) {
      showError(err?.response?.data?.message || err?.message || 'Gagal merevisi KRS');
    } finally {
      setRevising(null);
    }
  };

  // Handle semester change
  const handleSemesterChange = (newId) => {
    setSelectedSemesterId(newId);
    setSearchQuery('');
    setSelectedCourseSemester('all');
    setCurrentPage(1);
    setActionSuccess(null);
    setActionError(null);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCourseSemester]);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push('ellipsis-start');
      for (
        let i = Math.max(2, currentPage - 2);
        i <= Math.min(totalPages - 1, currentPage + 2);
        i++
      )
        pages.push(i);
      if (currentPage < totalPages - 3) pages.push('ellipsis-end');
      if (totalPages > 1) pages.push(totalPages);
    }
    return pages;
  };

  const canDrop = (status) => !isReadOnly && (status === 'PENDING' || status === 'REJECTED');
  const canRevise = (status) => !isReadOnly && status === 'REJECTED';

  // Semester label helper
  const semesterLabel = (sem) =>
    `${sem.semesterType === 'GANJIL' ? 'Ganjil' : 'Genap'} ${sem.academicYear}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
          Rencana Studi
        </h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">
          Dashboard &gt; Rencana Studi
        </p>
      </div>

      {/* ==================== SEMESTER SELECTOR ==================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700 whitespace-nowrap">
              Semester Akademik
            </label>
            {semestersLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={14} className="animate-spin" />
                Memuat semester...
              </div>
            ) : semesters.length === 0 ? (
              <span className="text-sm text-slate-500">Tidak ada semester tersedia</span>
            ) : (
              <Select value={selectedSemesterId || ''} onValueChange={handleSemesterChange}>
                <SelectTrigger className="w-70 bg-white">
                  <SelectValue placeholder="Pilih Semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((sem) => (
                    <SelectItem key={sem.id} value={sem.id}>
                      <span className="flex items-center gap-2">
                        {semesterLabel(sem)}
                        {sem.status === 'OPEN' ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                            OPEN
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                            CLOSED
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Status badge for current selection */}
          {currentSemester && (
            <div className="flex items-center gap-2">
              {currentSemester.status === 'OPEN' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Semester Aktif — KRS Terbuka
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-medium">
                  <Lock size={10} />
                  Semester Ditutup — Read-only
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CLOSED semester read-only banner */}
      {isReadOnly && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
          <Lock size={20} className="text-slate-500 mt-0.5 shrink-0" />
          <div className="text-sm text-slate-700">
            <strong>Semester sudah ditutup.</strong> Anda hanya dapat melihat data KRS semester ini.
            Pengisian dan perubahan KRS tidak tersedia.
          </div>
        </div>
      )}

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard
          value={summary.totalCourses || enrollments.length}
          label="Total Mata Kuliah"
          variant="warning"
        />
        <StatCard value={totalSKS} label="Total SKS" variant="warning" />
        <StatCard
          value={summary.maxSKS || 24}
          label="Maks SKS"
          variant={totalSKS > (summary.maxSKS || 24) ? 'danger' : 'warning'}
        />
        <StatCard value={enrollmentStats.approved} label="Disetujui" variant="warning" />
      </div>

      {/* SKS Limit Info */}
      {summary.maxSKS && !isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
          <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            Batas maksimum SKS semester ini: <strong>{summary.maxSKS} SKS</strong>. Anda telah
            mengambil <strong>{totalSKS} SKS</strong> ({summary.maxSKS - totalSKS} SKS tersisa).
          </p>
        </div>
      )}

      {/* Dosen Pembimbing Info */}
      {user?.advisor ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <UserCheck size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">Dosen Pembimbing Akademik</p>
            <p className="text-sm text-blue-700">
              {user.advisor.name} &mdash; {user.advisor.email}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            Dosen pembimbing akademik belum ditetapkan. Hubungi Admin untuk penugasan.
          </p>
        </div>
      )}

      {/* Info Banner — only for OPEN semester */}
      {!isReadOnly && currentSemester && (
        <InfoBanner variant="info">
          Masa pengambilan Rencana Studi semester {semesterLabel(currentSemester)} sedang
          berlangsung.
        </InfoBanner>
      )}

      {/* Alert Messages */}
      {actionSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <p className="text-green-700 flex-1">{actionSuccess}</p>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setActionSuccess(null)}
            className="text-green-600 hover:text-green-800 hover:bg-green-100"
          >
            <X size={18} />
          </Button>
        </div>
      )}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle size={20} className="text-red-600 shrink-0" />
          <p className="text-red-700 flex-1">{actionError}</p>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setActionError(null)}
            className="text-red-600 hover:text-red-800 hover:bg-red-100"
          >
            <X size={18} />
          </Button>
        </div>
      )}

      {/* Rejected Warning */}
      {enrollmentStats.rejected > 0 && !isReadOnly && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              {enrollmentStats.rejected} mata kuliah ditolak oleh Dosen PA
            </p>
            <p className="text-xs text-red-600">
              Klik tombol revisi untuk mengajukan ulang, atau hapus dari KRS.
            </p>
          </div>
        </div>
      )}

      {/* ============ SECTION: MATA KULIAH DITAWARKAN (only when OPEN) ============ */}
      {!isReadOnly && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <SectionHeader
            title="MATA KULIAH DITAWARKAN"
            subtitle={`${user?.name || ''} (${user?.nim || ''})`}
          />

          {/* Filter Bar */}
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 border-b border-slate-200 bg-slate-50/50">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Tingkat Mata Kuliah</label>
                <Select
                  value={selectedCourseSemester}
                  onValueChange={setSelectedCourseSemester}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Semua Tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tingkat</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        Semester {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari Mata Kuliah atau Dosen"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              />
            </div>
          </div>

          {/* Available Classes - Loading/Error/Empty */}
          {loading ? (
            <div className="p-8 sm:p-12 text-center">
              <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-slate-500">Memuat data mata kuliah...</p>
            </div>
          ) : error ? (
            <div className="p-8 sm:p-12 text-center">
              <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button variant="link" onClick={() => fetchData()} className="mt-3 text-sm text-red-600">
                Coba lagi
              </Button>
            </div>
          ) : availableFiltered.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <BookOpen size={32} className="text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">
                {searchQuery
                  ? 'Tidak ada mata kuliah yang ditemukan'
                  : availableMeta?.reason === 'NO_ACTIVE_SEMESTER'
                    ? 'Tidak ada semester aktif saat ini'
                    : availableMeta?.reason === 'SEMESTER_NOT_OPEN'
                      ? `Semester ${availableMeta.semester?.academicYear || ''} belum memasuki masa pengisian KRS (status: ${availableMeta.semester?.status || '-'})`
                      : availableMeta?.reason === 'NO_CLASSES_CREATED'
                        ? 'Belum ada kelas yang dibuka untuk semester ini. Hubungi admin untuk informasi lebih lanjut.'
                        : availableMeta?.reason === 'ALL_CLASSES_CLOSED'
                          ? `Terdapat ${availableMeta.semester?.totalClasses || 0} kelas, tetapi pendaftaran belum dibuka oleh admin.`
                          : 'Semua mata kuliah sudah diambil atau tidak tersedia'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-slate-100">
                {paginatedClasses.map((cls, index) => {
                  const isEnrollingThis = enrolling === cls.id;
                  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <div key={cls.id} className="p-4 hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-blue-600 font-medium text-sm">
                              #{rowNumber}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500 text-sm font-mono">
                              {cls.course?.code}
                            </span>
                          </div>
                          <h4 className="font-semibold text-slate-900 mb-2">
                            {cls.course?.title}
                          </h4>
                          {cls.course?.semester && (
                            <CourseBadge variant="info" className="mb-2">
                              Semester {cls.course.semester}
                            </CourseBadge>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <CourseBadge variant="indigo">
                              {cls.course?.sks || 3} SKS
                            </CourseBadge>
                            <CourseBadge variant="purple">{cls.name || 'Kelas'}</CourseBadge>
                            <CourseBadge variant="teal">
                              {cls.scheduleMode || 'Online'}
                            </CourseBadge>
                          </div>
                          {cls.lecturer && (
                            <p className="text-sm text-slate-600">Dosen: {cls.lecturer.name}</p>
                          )}
                          <p className="text-sm text-slate-500 mt-1">
                            Kapasitas: {cls.currentEnrollment || 0}/{cls.capacity || '∞'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEnroll(cls.id)}
                          disabled={isEnrollingThis}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 shrink-0"
                          title="Ambil Kelas"
                        >
                          {isEnrollingThis ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Plus size={18} />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-16 text-center">No.</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Dosen</TableHead>
                      <TableHead className="text-center">Kapasitas</TableHead>
                      <TableHead className="w-20 text-center">Opsi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClasses.map((cls, index) => {
                      const isEnrollingThis = enrolling === cls.id;
                      const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                      return (
                        <TableRow key={cls.id} className="hover:bg-slate-50">
                          <TableCell className="text-center text-blue-600 font-medium">
                            {rowNumber}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div>
                                <span className="font-semibold text-slate-900">
                                  {cls.course?.title}
                                </span>
                                <span className="text-slate-500 ml-1">({cls.course?.code})</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <CourseBadge variant="indigo">
                                  {cls.course?.sks || 3} SKS
                                </CourseBadge>
                                <CourseBadge variant="teal">
                                  {cls.scheduleMode || 'Online'}
                                </CourseBadge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <CourseBadge variant="purple">{cls.name || 'Kelas'}</CourseBadge>
                          </TableCell>
                          <TableCell>
                            {cls.course?.semester ? (
                              <CourseBadge variant="info">
                                Semester {cls.course.semester}
                              </CourseBadge>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {cls.lecturer ? (
                              <span className="text-slate-600 text-sm">{cls.lecturer.name}</span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm text-slate-600">
                            {cls.currentEnrollment || 0}/{cls.capacity || '∞'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEnroll(cls.id)}
                              disabled={isEnrollingThis}
                              className="border-blue-200 text-blue-600 hover:bg-blue-50"
                              title="Ambil Kelas"
                            >
                              {isEnrollingThis ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Plus size={18} />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="p-3 sm:p-4 border-t border-slate-200">
              {/* Mobile pagination */}
              <div className="flex sm:hidden items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Prev
                </Button>
                <span className="text-sm text-slate-600">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
              {/* Desktop pagination */}
              <div className="hidden sm:block">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {getPageNumbers().map((page, idx) => (
                      <PaginationItem key={idx}>
                        {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            isActive={currentPage === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            className={
                              currentPage === page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : ''
                            }
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={
                          currentPage === totalPages ? 'pointer-events-none opacity-50' : ''
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Separator Icon */}
      {enrollments.length > 0 && !isReadOnly && (
        <div className="flex justify-center py-2 sm:py-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-blue-50 flex items-center justify-center">
            <ArrowDownUp size={24} className="sm:hidden text-blue-600" />
            <ArrowDownUp size={28} className="hidden sm:block text-blue-600" />
          </div>
        </div>
      )}

      {/* ============ SECTION: DAFTAR RENCANA STUDI ============ */}
      {enrollments.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <SectionHeader
            title={isReadOnly ? 'RENCANA STUDI (READ-ONLY)' : 'DAFTAR RENCANA STUDI'}
            subtitle={`${user?.name || ''} (${user?.nim || ''})`}
          />

          {/* Action Bar — only for OPEN */}
          {!isReadOnly && (
            <div className="p-4 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Aksi Rencana Studi</p>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Cetak ringkasan KRS semester yang sedang dipilih.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="gap-2 border-cyan-300 text-cyan-600 hover:bg-cyan-50 w-full sm:w-auto"
                  onClick={handlePrintKrs}
                >
                  <Printer size={16} />
                  <span>Cetak KRS</span>
                </Button>
              </div>
            </div>
          )}

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-slate-100">
            {enrollments.map((enrollment, index) => {
              const classId = enrollment.class?.id || enrollment.classId;
              const isDroppingThis = dropping === classId;
              const isRevisingThis = revising === enrollment.id;
              return (
                <div key={enrollment.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-slate-500 font-medium text-sm">#{index + 1}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 text-sm font-mono">
                          {enrollment.class?.course?.code}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-2">
                        {enrollment.class?.course?.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <CourseBadge variant="indigo">
                          {enrollment.class?.course?.sks || 3} SKS
                        </CourseBadge>
                        <CourseBadge variant="purple">
                          {enrollment.class?.name || 'Kelas'}
                        </CourseBadge>
                        {enrollment.class?.course?.semester && (
                          <CourseBadge variant="info">
                            Semester {enrollment.class.course.semester}
                          </CourseBadge>
                        )}
                        <KrsStatusBadge status={enrollment.status} />
                      </div>
                      {enrollment.class?.lecturer?.name && (
                        <p className="text-sm text-slate-600">
                          Dosen: {enrollment.class.lecturer.name}
                        </p>
                      )}
                      {enrollment.status === 'REJECTED' && enrollment.note && (
                        <p className="text-xs text-red-600 mt-1">Catatan: {enrollment.note}</p>
                      )}
                    </div>
                    {!isReadOnly && (
                      <div className="flex flex-col gap-2 shrink-0">
                        {canRevise(enrollment.status) && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleRevise(enrollment.id)}
                            disabled={isRevisingThis}
                            className="border-amber-200 text-amber-600 hover:bg-amber-50"
                            title="Revisi (ajukan ulang)"
                          >
                            {isRevisingThis ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <RefreshCw size={18} />
                            )}
                          </Button>
                        )}
                        {canDrop(enrollment.status) && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDrop(classId)}
                            disabled={isDroppingThis}
                            className="border-red-200 text-red-500 hover:bg-red-50"
                            title="Hapus dari KRS"
                          >
                            {isDroppingThis ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-16 text-center">No.</TableHead>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Dosen</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  {!isReadOnly && <TableHead className="w-28 text-center">Opsi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment, index) => {
                  const classId = enrollment.class?.id || enrollment.classId;
                  const isDroppingThis = dropping === classId;
                  const isRevisingThis = revising === enrollment.id;
                  return (
                    <TableRow key={enrollment.id} className="hover:bg-slate-50">
                      <TableCell className="text-center text-slate-600 font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div>
                            <span className="font-semibold text-slate-900">
                              {enrollment.class?.course?.title}
                            </span>
                            <span className="text-slate-500 ml-1">
                              ({enrollment.class?.course?.code})
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <CourseBadge variant="indigo">
                              {enrollment.class?.course?.sks || 3} SKS
                            </CourseBadge>
                          </div>
                          {enrollment.status === 'REJECTED' && enrollment.notes && (
                            <p className="text-xs text-red-600">Catatan: {enrollment.notes}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <CourseBadge variant="purple">
                          {enrollment.class?.name || 'Kelas'}
                        </CourseBadge>
                      </TableCell>
                      <TableCell>
                        {enrollment.class?.course?.semester ? (
                          <span className="text-slate-600 text-sm">
                            Semester {enrollment.class.course.semester}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {enrollment.class?.lecturer?.name ? (
                          <span className="text-slate-600 text-sm">
                            {enrollment.class.lecturer.name}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <KrsStatusBadge status={enrollment.status} />
                        </div>
                      </TableCell>
                      {!isReadOnly && (
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            {canRevise(enrollment.status) && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleRevise(enrollment.id)}
                                disabled={isRevisingThis}
                                className="border-amber-200 text-amber-600 hover:bg-amber-50"
                                title="Revisi (ajukan ulang)"
                              >
                                {isRevisingThis ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : (
                                  <RefreshCw size={18} />
                                )}
                              </Button>
                            )}
                            {canDrop(enrollment.status) && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDrop(classId)}
                                disabled={isDroppingThis}
                                className="border-red-200 text-red-500 hover:bg-red-50"
                                title="Hapus dari KRS"
                              >
                                {isDroppingThis ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : (
                                  <Trash2 size={18} />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Footer Summary */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                <span className="text-slate-600">
                  Total: <strong className="text-slate-900">{enrollments.length}</strong> MK
                </span>
                <span className="text-slate-600">
                  SKS: <strong className="text-slate-900">{totalSKS}</strong>
                </span>
                <span className="text-slate-600">
                  Disetujui: <strong className="text-green-700">{enrollmentStats.approved}</strong>
                </span>
                {enrollmentStats.rejected > 0 && (
                  <span className="text-slate-600">
                    Ditolak: <strong className="text-red-600">{enrollmentStats.rejected}</strong>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                <Info size={14} className="inline mr-1" />
                {isReadOnly
                  ? 'Data read-only — semester sudah ditutup'
                  : enrollmentStats.pending > 0
                    ? 'Menunggu persetujuan Dosen PA'
                    : 'Tambahkan kelas untuk mengajukan KRS'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No enrollments message for CLOSED semester */}
      {enrollments.length === 0 && !loading && isReadOnly && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen size={32} className="text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Tidak ada data KRS untuk semester ini</p>
        </div>
      )}

      {/* Info Section — only for OPEN */}
      {!isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 flex gap-2 sm:gap-3">
          <Info size={18} className="sm:hidden text-blue-600 shrink-0 mt-0.5" />
          <Info size={20} className="hidden sm:block text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-blue-700">
            <p className="font-medium mb-1">Informasi Alur KRS</p>
            <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-blue-600">
              <li>Pilih kelas dari daftar dan klik (+) untuk menambahkan ke KRS</li>
              <li>Kelas yang ditambahkan langsung berstatus Menunggu persetujuan Dosen PA</li>
              <li>Dosen PA akan menyetujui atau menolak setiap mata kuliah</li>
              <li>Jika ditolak, klik revisi untuk mengajukan ulang atau hapus dari KRS</li>
              <li>Pastikan total SKS tidak melebihi jatah yang ditetapkan</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlan;
