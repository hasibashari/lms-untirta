import { useEffect, useState, useMemo } from 'react';
import {
  BookOpen,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  Plus,
  FileText,
  X,
  ArrowDownUp,
  Printer,
  Trash2,
} from 'lucide-react';
import { getAvailableCourses, enrollCourse, unenrollCourse, getMyKRS } from '../courseService';
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
 * KRS (Kartu Rencana Studi) - SIAKAD Style
 * 
 * Layout:
 * 1. Summary Stats (4 cards): Total SKS Kurikulum, Total SKS Ditempuh, IP Semester Lalu, Jatah SKS
 * 2. Info Banner: Masa pengambilan rencana studi
 * 3. Section: MATA KULIAH DITAWARKAN - dengan filter dan tabel
 * 4. Separator
 * 5. Section: DAFTAR RENCANA STUDI - kelas yang sudah diambil
 */
const StudyPlan = () => {
  // State untuk data
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk enrollment
  const [enrolling, setEnrolling] = useState(null);
  const [unenrolling, setUnenrolling] = useState(null);
  const [enrollSuccess, setEnrollSuccess] = useState(null);
  const [enrollError, setEnrollError] = useState(null);

  // Filter states
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedMode, setSelectedMode] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Mock data untuk student info (seharusnya dari context/API)
  const studentInfo = {
    name: 'MAHASISWA',
    nim: '1234567890',
  };

  // Mock data untuk stats (seharusnya dari API)
  const statsData = {
    totalSKSKurikulum: 144,
    ipSemesterLalu: 3.75,
    jatahSKS: 24,
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [availableRes, enrolledRes] = await Promise.all([
          getAvailableCourses(),
          getMyKRS()
        ]);

        setAvailableCourses(availableRes.data || []);
        setEnrolledCourses(enrolledRes.data || []);
      } catch (err) {
        setError(err?.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // IDs of enrolled courses
  const enrolledCourseIds = useMemo(() =>
    new Set(enrolledCourses.map(e => e.courseId || e.course?.id)),
    [enrolledCourses]
  );

  // Filter available courses
  const availableCoursesFiltered = useMemo(() =>
    availableCourses.filter(course => {
      // Exclude already enrolled
      if (enrolledCourseIds.has(course.id)) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          course.title?.toLowerCase().includes(query) ||
          course.code?.toLowerCase().includes(query) ||
          course.teacher?.name?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Semester filter
      if (selectedSemester !== 'all' && course.semester !== parseInt(selectedSemester)) {
        return false;
      }

      return true;
    }),
    [availableCourses, enrolledCourseIds, searchQuery, selectedSemester]
  );

  // Paginated available courses
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return availableCoursesFiltered.slice(startIndex, startIndex + itemsPerPage);
  }, [availableCoursesFiltered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(availableCoursesFiltered.length / itemsPerPage);

  // Handle enroll
  const handleEnroll = async (courseId) => {
    setEnrolling(courseId);
    setEnrollError(null);
    setEnrollSuccess(null);

    try {
      const res = await enrollCourse(courseId);
      const enrollment = res.data;

      setEnrolledCourses(prev => [...prev, enrollment]);
      setEnrollSuccess(`Berhasil menambahkan kelas ke KRS!`);

      setTimeout(() => setEnrollSuccess(null), 3000);
    } catch (err) {
      setEnrollError(err?.response?.data?.message || err?.message || 'Gagal menambahkan kelas');
      setTimeout(() => setEnrollError(null), 5000);
    } finally {
      setEnrolling(null);
    }
  };

  // Handle unenroll (drop course from KRS)
  const handleUnenroll = async (courseId) => {
    setUnenrolling(courseId);
    setEnrollError(null);
    setEnrollSuccess(null);

    try {
      await unenrollCourse(courseId);

      // Remove from enrolled courses
      setEnrolledCourses(prev => prev.filter(e => (e.courseId || e.course?.id) !== courseId));
      setEnrollSuccess(`Berhasil menghapus kelas dari KRS!`);

      setTimeout(() => setEnrollSuccess(null), 3000);
    } catch (err) {
      setEnrollError(err?.response?.data?.message || err?.message || 'Gagal menghapus kelas');
      setTimeout(() => setEnrollError(null), 5000);
    } finally {
      setUnenrolling(null);
    }
  };

  // Calculate total SKS
  const totalSKSDitempuh = useMemo(() =>
    enrolledCourses.reduce((sum, e) => sum + (e.course?.sks || 3), 0),
    [enrolledCourses]
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSemester, selectedMode, selectedType]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 10;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 4) {
        pages.push('ellipsis-start');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 3) {
        pages.push('ellipsis-end');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
          Rencana Studi Semester 2025/2026 Genap
        </h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">
          Dashboard &gt; Rencana Studi
        </p>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard
          value={statsData.totalSKSKurikulum}
          label="Total SKS Kurikulum"
          variant="warning"
        />
        <StatCard
          value={totalSKSDitempuh}
          label="Total SKS Ditempuh"
          variant="warning"
        />
        <StatCard
          value={statsData.ipSemesterLalu.toFixed(2)}
          label="IP Semester Lalu"
          variant="warning"
        />
        <StatCard
          value={statsData.jatahSKS}
          label="Jatah SKS Semester Ini"
          variant="warning"
        />
      </div>

      {/* Info Banner - Masa Pengambilan KRS */}
      <InfoBanner variant="info">
        Masa pengambilan Rencana Studi: 20 Januari 2026 pukul 15:00 sampai 09 Februari 2026 pukul 23:59
      </InfoBanner>

      {/* Alert Messages */}
      {enrollSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <p className="text-green-700 flex-1">{enrollSuccess}</p>
          <Button variant="ghost" size="icon-sm" onClick={() => setEnrollSuccess(null)} className="text-green-600 hover:text-green-800 hover:bg-green-100">
            <X size={18} />
          </Button>
        </div>
      )}

      {enrollError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle size={20} className="text-red-600 shrink-0" />
          <p className="text-red-700 flex-1">{enrollError}</p>
          <Button variant="ghost" size="icon-sm" onClick={() => setEnrollError(null)} className="text-red-600 hover:text-red-800 hover:bg-red-100">
            <X size={18} />
          </Button>
        </div>
      )}

      {/* ============ SECTION: MATA KULIAH DITAWARKAN ============ */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <SectionHeader
          title="MATA KULIAH DITAWARKAN"
          subtitle={`${studentInfo.name} (${studentInfo.nim})`}
        />

        {/* Filter Bar */}
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 border-b border-slate-200 bg-slate-50/50">
          {/* Filter Dropdowns Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Mode Jadwal</label>
              <Select value={selectedMode} onValueChange={setSelectedMode}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Semua Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Mode</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Tingkat Mata Kuliah</label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Semua Tingkat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tingkat</SelectItem>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                  <SelectItem value="3">Semester 3</SelectItem>
                  <SelectItem value="4">Semester 4</SelectItem>
                  <SelectItem value="5">Semester 5</SelectItem>
                  <SelectItem value="6">Semester 6</SelectItem>
                  <SelectItem value="7">Semester 7</SelectItem>
                  <SelectItem value="8">Semester 8</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Jenis Mata Kuliah</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="wajib">Wajib</SelectItem>
                  <SelectItem value="pilihan">Pilihan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Status Non-Pertemuan</label>
              <Select defaultValue="all">
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Lintas Prodi</label>
              <Select defaultValue="all">
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cari Mata Kuliah"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
          </div>
        </div>

        {/* Available Courses - Loading/Error/Empty States */}
        {loading ? (
          <div className="p-8 sm:p-12 text-center">
            <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-slate-500">Memuat data mata kuliah...</p>
          </div>
        ) : error ? (
          <div className="p-8 sm:p-12 text-center">
            <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
            <p className="text-red-600 font-medium">{error}</p>
            <Button
              variant="link"
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-red-600"
            >
              Coba lagi
            </Button>
          </div>
        ) : availableCoursesFiltered.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <BookOpen size={32} className="text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">
              {searchQuery ? 'Tidak ada mata kuliah yang ditemukan' : 'Semua mata kuliah sudah diambil'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {paginatedCourses.map((course, index) => {
                const isEnrollingThis = enrolling === course.id;
                const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;

                return (
                  <div key={course.id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-600 font-medium text-sm">#{rowNumber}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 text-sm font-mono">{course.code}</span>
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-2">{course.title}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <CourseBadge variant="success">{course.sks || 3} SKS</CourseBadge>
                          <CourseBadge variant="teal">Teori/Praktek</CourseBadge>
                          <CourseBadge variant="success">Online</CourseBadge>
                        </div>
                        {course.teacher && (
                          <p className="text-sm text-slate-600">Dosen: {course.teacher.name}</p>
                        )}
                        <p className="text-sm text-slate-500 mt-1">
                          {course.schedule || 'Jadwal menyusul'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEnroll(course.id)}
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
                    <TableHead>Nama Mata Kuliah</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Dosen</TableHead>
                    <TableHead className="w-20 text-center">Opsi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCourses.map((course, index) => {
                    const isEnrollingThis = enrolling === course.id;
                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;

                    return (
                      <TableRow key={course.id} className="hover:bg-slate-50">
                        <TableCell className="text-center text-blue-600 font-medium">
                          {rowNumber}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div>
                              <span className="font-semibold text-slate-900">{course.title}</span>
                              <span className="text-slate-500 ml-1">({course.code})</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <CourseBadge variant="success">{course.sks || 3} SKS</CourseBadge>
                              <CourseBadge variant="teal">Mata Kuliah Teori/Praktek</CourseBadge>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <CourseBadge variant="success">Online</CourseBadge>
                              <span className="text-slate-500 text-sm">Kelas A</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <CourseBadge variant="purple" className="whitespace-normal text-center">
                            {course.title?.toUpperCase().substring(0, 20) || 'KELAS'}
                          </CourseBadge>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {course.schedule || 'Jadwal menyusul'}
                        </TableCell>
                        <TableCell>
                          {course.teacher && (
                            <CourseBadge variant="teal">
                              1. {course.teacher.name}
                            </CourseBadge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEnroll(course.id)}
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
            {/* Mobile Pagination */}
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

            {/* Desktop Pagination */}
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
                          className={currentPage === page ? 'bg-blue-600 text-white border-blue-600' : ''}
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
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>

      {/* Separator Icon - Only show when there are enrolled courses */}
      {enrolledCourses.length > 0 && (
        <div className="flex justify-center py-2 sm:py-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-blue-50 flex items-center justify-center">
            <ArrowDownUp size={24} className="sm:hidden text-blue-600" />
            <ArrowDownUp size={28} className="hidden sm:block text-blue-600" />
          </div>
        </div>
      )}

      {/* ============ SECTION: DAFTAR RENCANA STUDI ============ */}
      {/* Only show when there are enrolled courses */}
      {enrolledCourses.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <SectionHeader
            title="DAFTAR RENCANA STUDI"
            subtitle={`${studentInfo.name} (${studentInfo.nim})`}
          />

          {/* Print Button */}
          <div className="p-4 border-b border-slate-200">
            <Button variant="secondary" className="gap-2">
              <Printer size={16} />
              <span>Cetak KRS</span>
            </Button>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-slate-100">
            {enrolledCourses.map((enrollment, index) => {
              const courseId = enrollment.course?.id || enrollment.courseId;
              const isUnenrollingThis = unenrolling === courseId;

              return (
                <div key={enrollment.id || enrollment.courseId} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-slate-500 font-medium text-sm">#{index + 1}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 text-sm font-mono">{enrollment.course?.code}</span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-2">{enrollment.course?.title}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <CourseBadge variant="success">{enrollment.course?.sks || 3} SKS</CourseBadge>
                        <CourseBadge variant="teal">Teori</CourseBadge>
                        <CourseBadge variant="success">Online</CourseBadge>
                      </div>
                      {enrollment.course?.teacher?.name && (
                        <p className="text-sm text-slate-600">Dosen: {enrollment.course.teacher.name}</p>
                      )}
                      <div className="mt-2">
                        <CourseBadge variant="warning" className="text-xs">
                          ⚠ Belum disetujui
                        </CourseBadge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleUnenroll(courseId)}
                      disabled={isUnenrollingThis}
                      className="border-red-200 text-red-500 hover:bg-red-50 shrink-0"
                      title="Hapus dari KRS"
                    >
                      {isUnenrollingThis ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
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
                  <TableHead>Nama Mata Kuliah</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Dosen</TableHead>
                  <TableHead className="w-28 text-center">Opsi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledCourses.map((enrollment, index) => {
                  const courseId = enrollment.course?.id || enrollment.courseId;
                  const isUnenrollingThis = unenrolling === courseId;

                  return (
                    <TableRow key={enrollment.id || enrollment.courseId} className="hover:bg-slate-50">
                      <TableCell className="text-center text-slate-600 font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div>
                            <span className="font-semibold text-slate-900">{enrollment.course?.title}</span>
                            <span className="text-slate-500 ml-1">({enrollment.course?.code})</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <CourseBadge variant="success">{enrollment.course?.sks || 3} SKS</CourseBadge>
                            <CourseBadge variant="teal">Mata Kuliah Teori</CourseBadge>
                            <CourseBadge variant="success">Online</CourseBadge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        -
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        -
                      </TableCell>
                      <TableCell>
                        {enrollment.course?.teacher?.name ? (
                          <span className="text-slate-600 text-sm">{enrollment.course.teacher.name}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleUnenroll(courseId)}
                            disabled={isUnenrollingThis}
                            className="border-red-200 text-red-500 hover:bg-red-50"
                            title="Hapus dari KRS"
                          >
                            {isUnenrollingThis ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </Button>
                          <CourseBadge variant="warning" className="text-[10px] whitespace-nowrap">
                            ⚠ Belum disetujui
                          </CourseBadge>
                        </div>
                      </TableCell>
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
                  Total: <strong className="text-slate-900">{enrolledCourses.length}</strong> MK
                </span>
                <span className="text-slate-600">
                  SKS: <strong className="text-slate-900">{totalSKSDitempuh}</strong>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                <Info size={14} className="inline mr-1" />
                Menunggu persetujuan Dosen PA
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 flex gap-2 sm:gap-3">
        <Info size={18} className="sm:hidden text-blue-600 shrink-0 mt-0.5" />
        <Info size={20} className="hidden sm:block text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-blue-700">
          <p className="font-medium mb-1">Informasi KRS</p>
          <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-blue-600">
            <li>Pilih mata kuliah dari tabel di atas</li>
            <li>Klik tombol (+) untuk menambahkan ke KRS</li>
            <li>KRS harus disetujui oleh Dosen PA</li>
            <li>Pastikan total SKS tidak melebihi jatah</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StudyPlan;
