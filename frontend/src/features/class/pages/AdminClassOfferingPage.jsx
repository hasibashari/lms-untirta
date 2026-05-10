import { useEffect, useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  AlertCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Users,
  Calendar,
  GraduationCap,
  Building,
  Clock,
  Layers,
  CheckCircle,
} from 'lucide-react';
import {
  getAllClasses,
  getClassStats,
  createClass,
  updateClass,
  toggleClassEnrollment,
  deleteClass,
} from '../classService';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { getAllCourses } from '../../course/courseService';
import { getAllSemesters } from '../../academic/academicService';
import { getDosen } from '../../user/userService';
import { Button } from '@/components/ui/button';
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

/**
 * Admin Class Offerings Management
 *
 * Manages "Kelas Offering" — specific class sections offered per semester.
 * Each Class links a Course to an AcademicSemester with section, lecturer,
 * schedule, room, capacity, and enrollment open/close toggle.
 *
 * This is the critical missing piece that enables the KRS enrollment workflow.
 */
const AdminClassesPage = () => {
  // Data state
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [dosenList, setDosenList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterEnrollment, setFilterEnrollment] = useState('all');

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    activeSemClasses: 0,
    activeSemOpen: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    courseId: '',
    lecturerId: '',
    academicSemesterId: '',
    section: 'A',
    schedule: '',
    room: '',
    capacity: 40,
    isEnrollmentOpen: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toggling state
  const [toggling, setToggling] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    if (type === 'error') toast.error(message);
    else if (type === 'info') toast(message, { icon: 'ℹ️' });
    else toast.success(message);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Metadata (Courses, Semesters, Dosen) - Only once
  const fetchMetadata = useCallback(async () => {
    try {
      const [coursesRes, semestersRes, dosenRes] = await Promise.all([
        getAllCourses({ limit: 1000 }), // Get all for dropdowns
        getAllSemesters(),
        getDosen(),
      ]);
      setCourses(coursesRes?.data || []);
      setSemesters(semestersRes?.data || []);
      setDosenList(dosenRes?.data || []);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  }, []);

  // Fetch Classes (Paginated & Filtered)
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllClasses({
        page,
        limit,
        search: debouncedSearch,
        academicSemesterId: filterSemester !== 'all' ? filterSemester : '',
        isEnrollmentOpen: filterEnrollment === 'open' ? 'true' : filterEnrollment === 'closed' ? 'false' : '',
      });
      setClasses(res?.data || []);
      setTotalItems(res?.pagination?.total || 0);
      setTotalPages(res?.pagination?.totalPages || 0);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filterSemester, filterEnrollment]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // Find active semester ID
      const activeSem = semesters.find(s => s.isActive);
      const res = await getClassStats({
        academicSemesterId: activeSem?.id || '',
      });
      
      const data = res?.data || {};
      setStats({
        total: data.totalClasses || 0,
        open: data.openEnrollment || 0,
        closed: (data.totalClasses || 0) - (data.openEnrollment || 0),
        activeSemClasses: data.activeSemesterClasses || 0,
        activeSemOpen: data.activeSemesterOpen || 0,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [semesters]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (semesters.length > 0) {
      fetchStats();
    }
  }, [fetchStats, semesters]);

  const fetchData = useCallback(async () => {
    await Promise.all([fetchClasses(), fetchStats()]);
  }, [fetchClasses, fetchStats]);

  // Active semester (for default selection in create form)
  const activeSemester = useMemo(() =>
    semesters.find(s => s.isActive),
    [semesters]
  );

  // Filtered classes (Now just an alias since backend does the work)
  const filteredClasses = classes;

  // Stats (Now using state)

  // Open create modal
  const handleOpenCreate = () => {
    setEditingClass(null);
    const initialCourse = courses[0];
    setFormData({
      courseId: initialCourse?.id || '',
      lecturerId: initialCourse?.teacherId || initialCourse?.teacher?.id || dosenList[0]?.id || '',
      academicSemesterId: activeSemester?.id || semesters[0]?.id || '',
      section: 'A',
      schedule: '',
      room: '',
      capacity: 40,
      isEnrollmentOpen: true,
    });
    setSubmitError(null);
    setSubmitSuccess(null);
    setShowModal(true);
  };

  // Open edit modal
  const handleOpenEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      courseId: cls.course?.id || '',
      lecturerId: cls.lecturer?.id || '',
      academicSemesterId: cls.academicSemesterId || '',
      section: cls.section || 'A',
      schedule: cls.schedule || '',
      room: cls.room || '',
      capacity: cls.capacity || 40,
      isEnrollmentOpen: cls.isEnrollmentOpen || false,
    });
    setSubmitError(null);
    setSubmitSuccess(null);
    setShowModal(true);
  };

  // Submit create/edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity) || 40,
      };

      if (editingClass) {
        const res = await updateClass(editingClass.id, payload);
        setClasses(prev => prev.map(c => c.id === editingClass.id ? (res?.data || c) : c));
        setSubmitSuccess('Kelas berhasil diperbarui!');
      } else {
        await createClass(payload);
        // Re-fetch to get full data with relations
        await fetchData();
        setSubmitSuccess('Kelas berhasil dibuat!');
      }

      setTimeout(() => {
        setShowModal(false);
        setSubmitSuccess(null);
      }, 1500);
    } catch {
      setSubmitError('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle enrollment
  const handleToggleEnrollment = async (cls) => {
    setToggling(cls.id);
    try {
      const newState = !cls.isEnrollmentOpen;
      await toggleClassEnrollment(cls.id, newState);
      setClasses(prev =>
        prev.map(c => c.id === cls.id ? { ...c, isEnrollmentOpen: newState } : c)
      );
      showToast(
        newState
          ? `Pendaftaran ${cls.course?.code} Kelas ${cls.section} dibuka`
          : `Pendaftaran ${cls.course?.code} Kelas ${cls.section} ditutup`,
        'success'
      );
    } catch {
      showToast('Gagal mengubah status pendaftaran', 'error');
    } finally {
      setToggling(null);
    }
  };

  // Bulk toggle all classes in active semester
  const handleBulkToggle = async (openState) => {
    if (!activeSemester) return;
    const targetClasses = classes.filter(
      c => c.academicSemesterId === activeSemester.id && c.isEnrollmentOpen !== openState
    );
    if (targetClasses.length === 0) {
      showToast('Semua kelas sudah dalam status yang diminta', 'info');
      return;
    }

    setToggling('bulk');
    try {
      await Promise.all(
        targetClasses.map(c => toggleClassEnrollment(c.id, openState))
      );
      setClasses(prev =>
        prev.map(c =>
          c.academicSemesterId === activeSemester.id
            ? { ...c, isEnrollmentOpen: openState }
            : c
        )
      );
      showToast(
        `${targetClasses.length} kelas berhasil ${openState ? 'dibuka' : 'ditutup'} pendaftarannya`,
        'success'
      );
    } catch {
      showToast('Gagal mengubah status pendaftaran massal', 'error');
      await fetchData(); // Re-sync on partial failure
    } finally {
      setToggling(null);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteClass(deleteConfirm.id);
      setClasses(prev => prev.filter(c => c.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      showToast('Kelas berhasil dihapus');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal menghapus kelas', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getSemesterLabel = (s) =>
    s ? `${s.academicYear} ${s.semesterType === 'GANJIL' ? 'Ganjil' : 'Genap'}` : '-';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Kelas</h1>
          <p className="text-gray-600 mt-1">
            Buat dan kelola kelas per semester untuk pendaftaran KRS mahasiswa
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Mata kuliah dibuat di menu Mata Kuliah, sedangkan jadwal dan ruangan ditentukan di Kelas.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2" disabled={courses.length === 0 || semesters.length === 0}>
          <Plus size={18} />
          Tambah Kelas
        </Button>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <Layers size={20} className="text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500 truncate">Total Kelas</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                <ToggleRight size={20} className="text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-green-700">{stats.open}</p>
                <p className="text-xs text-slate-500 truncate">Pendaftaran Dibuka</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                <Calendar size={20} className="text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-slate-900">{stats.activeSemClasses}</p>
                <p className="text-xs text-slate-500 truncate">Kelas Semester Aktif</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                <GraduationCap size={20} className="text-teal-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-teal-700">{stats.activeSemOpen}</p>
                <p className="text-xs text-slate-500 truncate">KRS-Ready (Aktif+Buka)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning: No classes for active semester */}
      {!loading && !statsLoading && activeSemester && stats.activeSemClasses === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800 min-w-0 flex-1">
            <strong>Semester aktif belum memiliki kelas.</strong>{' '}
            Semester <strong>{getSemesterLabel(activeSemester)}</strong> (status: {activeSemester.status}) tidak memiliki kelas.
            Tambahkan kelas offering agar mahasiswa dapat melakukan pendaftaran KRS.
          </div>
        </div>
      )}

      {/* Warning: Active semester has classes but none open */}
      {!loading && activeSemester && stats.activeSemClasses > 0 && stats.activeSemOpen === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 flex-wrap sm:flex-nowrap">
          <AlertCircle size={20} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800 min-w-0 flex-1">
            <strong>Semua kelas di semester aktif masih ditutup pendaftarannya.</strong>{' '}
            Terdapat {stats.activeSemClasses} kelas di semester {getSemesterLabel(activeSemester)}, tetapi belum ada yang dibuka untuk KRS.
            <Button
              variant="outline"
              size="sm"
              className="mt-3 sm:mt-0 sm:ml-2 border-amber-300 text-amber-700 hover:bg-amber-100 whitespace-nowrap inline-flex"
              onClick={() => handleBulkToggle(true)}
              disabled={toggling === 'bulk'}
            >
              {toggling === 'bulk' ? <Loader2 size={14} className="animate-spin mr-1" /> : <ToggleRight size={14} className="mr-1" />}
              Buka Semua
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari mata kuliah, kode, dosen, atau section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <Select value={filterSemester} onValueChange={setFilterSemester}>
          <SelectTrigger className="w-full sm:w-56 bg-white">
            <SelectValue placeholder="Semua Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Semester</SelectItem>
            {semesters.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {getSemesterLabel(s)} {s.isActive ? '(Aktif)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterEnrollment} onValueChange={setFilterEnrollment}>
          <SelectTrigger className="w-full sm:w-44 bg-white">
            <SelectValue placeholder="Status Pendaftaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="open">Dibuka</SelectItem>
            <SelectItem value="closed">Ditutup</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      {!loading && !error && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-gray-500">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen size={16} className="shrink-0" />
            <span className="truncate">Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, totalItems)} dari {totalItems} kelas</span>
          </div>
          {activeSemester && stats.activeSemClasses > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggle(true)}
                disabled={toggling === 'bulk' || stats.activeSemOpen === stats.activeSemClasses}
                className="text-green-700 border-green-200 hover:bg-green-50 text-xs"
              >
                <ToggleRight size={14} className="mr-1" />
                Buka Semua
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggle(false)}
                disabled={toggling === 'bulk' || stats.activeSemOpen === 0}
                className="text-red-700 border-red-200 hover:bg-red-50 text-xs"
              >
                <ToggleLeft size={14} className="mr-1" />
                Tutup Semua
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-12 text-center">
          <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-slate-500">Memuat data kelas...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button variant="link" onClick={fetchData} className="mt-2 text-red-600">
            Coba lagi
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && classes.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <BookOpen size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Kelas</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-2">
            Kelas menghubungkan mata kuliah dengan semester tertentu. Buat kelas agar mahasiswa dapat mendaftar melalui KRS.
          </p>
          {courses.length === 0 ? (
            <p className="text-amber-600 text-sm mb-4">
              <AlertCircle size={14} className="inline mr-1" />
              Anda perlu membuat mata kuliah terlebih dahulu di menu &quot;Kelas&quot; sebelum membuat kelas offering.
            </p>
          ) : (
            <Button onClick={handleOpenCreate} className="mt-4 inline-flex items-center gap-2">
              <Plus size={18} />
              Tambah Kelas
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      {!loading && !error && filteredClasses.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-slate-100">
            {filteredClasses.map((cls) => (
              <div key={cls.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-slate-500">{cls.course?.code}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-sm font-medium text-blue-600">Kelas {cls.section}</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2 truncate">{cls.course?.title}</h4>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full shrink-0">
                        {cls.course?.sks || 3} SKS
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${cls.isEnrollmentOpen
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {cls.isEnrollmentOpen ? 'Buka' : 'Tutup'}
                      </span>
                      {cls.course?.semester && (
                        <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full shrink-0">
                          Semester {cls.course.semester}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs rounded-full shrink-0 truncate">
                        {getSemesterLabel(cls.academicSemester)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 truncate">Dosen: {cls.lecturer?.name || '-'}</p>
                    {cls.schedule && <p className="text-xs text-slate-500 mt-1 truncate"><Clock size={12} className="inline mr-1" />{cls.schedule}</p>}
                    <p className="text-xs text-slate-500 mt-1">
                      <Users size={12} className="inline mr-1" />
                      {cls.krsEnrollmentsCount || 0}/{cls.capacity} mahasiswa
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleEnrollment(cls)}
                      disabled={toggling === cls.id}
                      className={`p-2 rounded-lg transition ${cls.isEnrollmentOpen
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      title={cls.isEnrollmentOpen ? 'Tutup Pendaftaran' : 'Buka Pendaftaran'}
                    >
                      {toggling === cls.id
                        ? <Loader2 size={18} className="animate-spin" />
                        : cls.isEnrollmentOpen
                          ? <ToggleRight size={18} />
                          : <ToggleLeft size={18} />
                      }
                    </button>
                    <button onClick={() => handleOpenEdit(cls)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => setDeleteConfirm(cls)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 whitespace-nowrap">
                  <TableHead className="w-12 text-center">No.</TableHead>
                  <TableHead>Mata Kuliah & Kelas</TableHead>
                  <TableHead>Dosen & Jadwal</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead className="text-center">Status & Kapasitas</TableHead>
                  <TableHead className="w-24 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls, index) => (
                  <TableRow key={cls.id} className="hover:bg-slate-50">
                    <TableCell className="text-center text-slate-500">{(page - 1) * limit + index + 1}</TableCell>

                    {/* Collapsed: Mata Kuliah & Kelas */}
                    <TableCell>
                      <div className="min-w-0 max-w-45 sm:max-w-xs xl:max-w-sm">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 truncate" title={cls.course?.title}>{cls.course?.title}</span>
                          <span className="shrink-0 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                            Kelas {cls.section}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-500 font-mono truncate">{cls.course?.code}</span>
                          <span className="shrink-0 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded">
                            {cls.course?.sks || 3} SKS
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Collapsed: Dosen & Jadwal */}
                    <TableCell>
                      <div className="min-w-0 max-w-35 sm:max-w-50">
                        <div className="text-sm font-medium text-slate-700 truncate" title={cls.lecturer?.name || '-'}>
                          {cls.lecturer?.name || '-'}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 truncate" title={`${cls.schedule} • ${cls.room}`}>
                          {cls.schedule || '-'}
                          {cls.room && <span className="ml-2 whitespace-nowrap"><Building size={10} className="inline mr-0.5 mb-0.5" />{cls.room}</span>}
                        </div>
                      </div>
                    </TableCell>

                    {/* Semester */}
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start min-w-0 max-w-32.5">
                        <span className="text-sm text-slate-600 truncate w-full" title={getSemesterLabel(cls.academicSemester)}>
                          {getSemesterLabel(cls.academicSemester)}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {cls.course?.semester && (
                            <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 text-[10px] font-medium rounded">
                              Sem {cls.course.semester}
                            </span>
                          )}
                          {cls.academicSemester?.status && (
                            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${cls.academicSemester.status === 'OPEN' ? 'bg-green-50 text-green-700' :
                              cls.academicSemester.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' :
                                'bg-blue-50 text-blue-600'
                              }`}>
                              {cls.academicSemester.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Collapsed: Pendaftaran & Kapasitas */}
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <button
                          onClick={() => handleToggleEnrollment(cls)}
                          disabled={toggling === cls.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${cls.isEnrollmentOpen
                            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            }`}
                        >
                          {toggling === cls.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : cls.isEnrollmentOpen ? (
                            <ToggleRight size={14} />
                          ) : (
                            <ToggleLeft size={14} />
                          )}
                          <span className="truncate">{cls.isEnrollmentOpen ? 'Buka' : 'Tutup'}</span>
                        </button>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {cls.krsEnrollmentsCount || 0} / {cls.capacity} Kuota
                        </span>
                      </div>
                    </TableCell>

                    {/* Aksi */}
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(cls)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(cls)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center py-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={page === pageNum}
                        onClick={() => setPage(pageNum)}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                if (
                  (pageNum === 2 && page > 3) || 
                  (pageNum === totalPages - 1 && page < totalPages - 2)
                ) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !submitting && setShowModal(false)} />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingClass ? 'Edit Kelas Offering' : 'Tambah Kelas Offering'}
              </h2>
              <button
                onClick={() => !submitting && setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                disabled={submitting}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {submitSuccess && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle size={20} className="text-green-600" />
                  <p className="text-green-700 font-medium">{submitSuccess}</p>
                </div>
              )}

              {submitError && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={20} className="text-red-600" />
                  <p className="text-red-700">{submitError}</p>
                </div>
              )}

              {!submitSuccess && (
                <>
                  {/* Mata Kuliah */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mata Kuliah <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        const selectedCourse = courses.find(c => c.id === cid);
                        setFormData(prev => ({
                          ...prev,
                          courseId: cid,
                          lecturerId: selectedCourse?.teacherId || selectedCourse?.teacher?.id || prev.lecturerId
                        }));
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      required
                    >
                      <option value="">-- Pilih Mata Kuliah --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.title} ({c.sks || 3} SKS)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Semester Akademik */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester Akademik <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.academicSemesterId}
                      onChange={(e) => setFormData(prev => ({ ...prev, academicSemesterId: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      required
                    >
                      <option value="">-- Pilih Semester --</option>
                      {semesters.map(s => (
                        <option key={s.id} value={s.id}>
                          {getSemesterLabel(s)} ({s.status}){s.isActive ? ' ★ Aktif' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dosen & Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dosen Pengampu <span className="text-blue-600 text-[10px] font-normal ml-1">(Otomatis terisi)</span>
                      </label>
                      <select
                        value={formData.lecturerId}
                        onChange={(e) => setFormData(prev => ({ ...prev, lecturerId: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                        required
                      >
                        <option value="">-- Pilih Dosen --</option>
                        {dosenList.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Section <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.section}
                        onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                        required
                      >
                        {['A', 'B', 'C', 'D', 'E', 'F'].map(s => (
                          <option key={s} value={s}>Kelas {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Schedule & Room */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jadwal
                      </label>
                      <input
                        type="text"
                        value={formData.schedule}
                        onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Senin, 08:00-10:00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ruangan
                      </label>
                      <input
                        type="text"
                        value={formData.room}
                        onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="A1.01"
                      />
                    </div>
                  </div>

                  {/* Capacity & Enrollment Toggle */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kapasitas
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pendaftaran
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, isEnrollmentOpen: !prev.isEnrollmentOpen }))}
                        className={`w-full px-4 py-2 rounded-lg border text-sm font-medium transition flex items-center justify-center gap-2 ${formData.isEnrollmentOpen
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-red-50 border-red-300 text-red-600'
                          }`}
                      >
                        {formData.isEnrollmentOpen ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        {formData.isEnrollmentOpen ? 'Dibuka' : 'Ditutup'}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm"
                      disabled={submitting}
                    >
                      Batal
                    </button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin mr-2" />
                          Menyimpan...
                        </>
                      ) : editingClass ? 'Simpan Perubahan' : 'Tambah Kelas'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !deleting && setDeleteConfirm(null)} />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Kelas Offering?</h3>
              <p className="text-gray-500 mb-6">
                Anda yakin ingin menghapus <strong>{deleteConfirm.course?.code} Kelas {deleteConfirm.section}</strong>?
                Semua data KRS enrollment terkait juga akan dihapus.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  disabled={deleting}
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  disabled={deleting}
                >
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClassesPage;
