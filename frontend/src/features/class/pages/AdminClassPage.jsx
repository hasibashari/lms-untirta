import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Users,
  Calendar,
  GraduationCap,
  Building,
  Clock,
  Layers,
} from 'lucide-react';
import {
  getAllClasses,
  createClass,
  updateClass,
  toggleClassEnrollment,
  deleteClass,
} from '../classService';
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

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterEnrollment, setFilterEnrollment] = useState('all');

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

  // Toast state
  const [toast, setToast] = useState(null);

  // Toggling state
  const [toggling, setToggling] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [classesRes, coursesRes, semestersRes, dosenRes] = await Promise.all([
        getAllClasses(),
        getAllCourses(),
        getAllSemesters(),
        getDosen(),
      ]);

      setClasses(classesRes?.data || []);
      setCourses(coursesRes?.data || []);
      setSemesters(semestersRes?.data || []);
      setDosenList(dosenRes?.data || []);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Active semester (for default selection in create form)
  const activeSemester = useMemo(() =>
    semesters.find(s => s.isActive),
    [semesters]
  );

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          cls.course?.title?.toLowerCase().includes(q) ||
          cls.course?.code?.toLowerCase().includes(q) ||
          cls.lecturer?.name?.toLowerCase().includes(q) ||
          cls.section?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Semester filter
      if (filterSemester !== 'all' && cls.academicSemesterId !== filterSemester) {
        return false;
      }

      // Enrollment filter
      if (filterEnrollment === 'open' && !cls.isEnrollmentOpen) return false;
      if (filterEnrollment === 'closed' && cls.isEnrollmentOpen) return false;

      return true;
    });
  }, [classes, searchQuery, filterSemester, filterEnrollment]);

  // Stats
  const stats = useMemo(() => {
    const total = classes.length;
    const open = classes.filter(c => c.isEnrollmentOpen).length;
    const activeSemClasses = activeSemester
      ? classes.filter(c => c.academicSemesterId === activeSemester.id).length
      : 0;
    const activeSemOpen = activeSemester
      ? classes.filter(c => c.academicSemesterId === activeSemester.id && c.isEnrollmentOpen).length
      : 0;
    return { total, open, closed: total - open, activeSemClasses, activeSemOpen };
  }, [classes, activeSemester]);

  // Open create modal
  const handleOpenCreate = () => {
    setEditingClass(null);
    setFormData({
      courseId: courses[0]?.id || '',
      lecturerId: dosenList[0]?.id || '',
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
        setSubmitSuccess('Kelas offering berhasil diperbarui!');
      } else {
        const res = await createClass(payload);
        // Re-fetch to get full data with relations
        await fetchData();
        setSubmitSuccess('Kelas offering berhasil dibuat!');
      }

      setTimeout(() => {
        setShowModal(false);
        setSubmitSuccess(null);
      }, 1500);
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err?.message || 'Terjadi kesalahan');
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
    } catch (err) {
      showToast(err?.response?.data?.message || 'Gagal mengubah status pendaftaran', 'error');
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
    } catch (err) {
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
      showToast('Kelas offering berhasil dihapus');
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
          <h1 className="text-2xl font-bold text-gray-900">Kelola Kelas Offering</h1>
          <p className="text-gray-600 mt-1">
            Buat dan kelola kelas per semester untuk pendaftaran KRS mahasiswa
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2" disabled={courses.length === 0 || semesters.length === 0}>
          <Plus size={18} />
          Tambah Kelas
        </Button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border animate-in slide-in-from-top-2 ${toast.type === 'error'
          ? 'bg-red-50 border-red-200 text-red-700'
          : toast.type === 'info'
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-green-50 border-green-200 text-green-700'
          }`}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="hover:opacity-70"><X size={18} /></button>
        </div>
      )}

      {/* Stats Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Layers size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Kelas</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <ToggleRight size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{stats.open}</p>
                <p className="text-xs text-slate-500">Pendaftaran Dibuka</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Calendar size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.activeSemClasses}</p>
                <p className="text-xs text-slate-500">Kelas Semester Aktif</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                <GraduationCap size={20} className="text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-700">{stats.activeSemOpen}</p>
                <p className="text-xs text-slate-500">KRS-Ready (Aktif+Buka)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning: No classes for active semester */}
      {!loading && activeSemester && stats.activeSemClasses === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            <strong>Semester aktif belum memiliki kelas offering.</strong>{' '}
            Semester <strong>{getSemesterLabel(activeSemester)}</strong> (status: {activeSemester.status}) tidak memiliki kelas.
            Tambahkan kelas offering agar mahasiswa dapat melakukan pendaftaran KRS.
          </div>
        </div>
      )}

      {/* Warning: Active semester has classes but none open */}
      {!loading && activeSemester && stats.activeSemClasses > 0 && stats.activeSemOpen === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            <strong>Semua kelas di semester aktif masih ditutup pendaftarannya.</strong>{' '}
            Terdapat {stats.activeSemClasses} kelas di semester {getSemesterLabel(activeSemester)}, tetapi belum ada yang dibuka untuk KRS.
            <Button
              variant="outline"
              size="sm"
              className="ml-2 border-amber-300 text-amber-700 hover:bg-amber-100"
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
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <BookOpen size={16} />
            <span>{filteredClasses.length} dari {classes.length} kelas offering</span>
          </div>
          {activeSemester && stats.activeSemClasses > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggle(true)}
                disabled={toggling === 'bulk' || stats.activeSemOpen === stats.activeSemClasses}
                className="text-green-700 border-green-200 hover:bg-green-50 text-xs"
              >
                <ToggleRight size={14} className="mr-1" />
                Buka Semua Aktif
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggle(false)}
                disabled={toggling === 'bulk' || stats.activeSemOpen === 0}
                className="text-red-700 border-red-200 hover:bg-red-50 text-xs"
              >
                <ToggleLeft size={14} className="mr-1" />
                Tutup Semua Aktif
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-12 text-center">
          <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-slate-500">Memuat data kelas offering...</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Kelas Offering</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-2">
            Kelas offering menghubungkan mata kuliah dengan semester tertentu. Buat kelas offering agar mahasiswa dapat mendaftar melalui KRS.
          </p>
          {courses.length === 0 ? (
            <p className="text-amber-600 text-sm mb-4">
              <AlertCircle size={14} className="inline mr-1" />
              Anda perlu membuat mata kuliah terlebih dahulu di menu &quot;Kelas&quot; sebelum membuat kelas offering.
            </p>
          ) : (
            <Button onClick={handleOpenCreate} className="mt-4 inline-flex items-center gap-2">
              <Plus size={18} />
              Tambah Kelas Offering
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
                    <h4 className="font-semibold text-slate-900 mb-2">{cls.course?.title}</h4>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                        {cls.course?.sks || 3} SKS
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cls.isEnrollmentOpen
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {cls.isEnrollmentOpen ? 'Buka' : 'Tutup'}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs rounded-full">
                        {getSemesterLabel(cls.academicSemester)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">Dosen: {cls.lecturer?.name || '-'}</p>
                    {cls.schedule && <p className="text-xs text-slate-500 mt-1"><Clock size={12} className="inline mr-1" />{cls.schedule}</p>}
                    <p className="text-xs text-slate-500 mt-1">
                      <Users size={12} className="inline mr-1" />
                      {cls._count?.krsEnrollments || 0}/{cls.capacity} mahasiswa
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
                <TableRow className="bg-slate-50">
                  <TableHead className="w-12 text-center">No.</TableHead>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Dosen</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Jadwal</TableHead>
                  <TableHead className="text-center">Kapasitas</TableHead>
                  <TableHead className="text-center">Pendaftaran</TableHead>
                  <TableHead className="w-28 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls, index) => (
                  <TableRow key={cls.id} className="hover:bg-slate-50">
                    <TableCell className="text-center text-slate-500">{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-semibold text-slate-900">{cls.course?.title}</span>
                        <br />
                        <span className="text-xs text-slate-500 font-mono">{cls.course?.code}</span>
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded">
                          {cls.course?.sks || 3} SKS
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                        Kelas {cls.section}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{cls.lecturer?.name || '-'}</TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{getSemesterLabel(cls.academicSemester)}</span>
                      {cls.academicSemester?.status && (
                        <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded ${cls.academicSemester.status === 'OPEN' ? 'bg-green-50 text-green-700' :
                          cls.academicSemester.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                          {cls.academicSemester.status}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">
                        {cls.schedule || '-'}
                        {cls.room && <div className="text-xs text-slate-400"><Building size={10} className="inline mr-0.5" />{cls.room}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm text-slate-600">
                        {cls._count?.krsEnrollments || 0}/{cls.capacity}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleEnrollment(cls)}
                        disabled={toggling === cls.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${cls.isEnrollmentOpen
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
                        {cls.isEnrollmentOpen ? 'Buka' : 'Tutup'}
                      </button>
                    </TableCell>
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
                      onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
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
                        Dosen Pengampu <span className="text-red-500">*</span>
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
