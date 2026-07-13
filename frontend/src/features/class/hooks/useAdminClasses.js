import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  getAllClasses,
  getClassStats,
  createClass,
  updateClass,
  toggleClassEnrollment,
  deleteClass,
} from '../api/class.api';
import { getAllCourses } from '../../course/api/course.api';
import { getAllSemesters } from '../../academic/academicService';
import { getDosen } from '../../user/userService';

export const useAdminClasses = () => {
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
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchMetadata = useCallback(async () => {
    try {
      const [coursesRes, semestersRes, dosenRes] = await Promise.all([
        getAllCourses({ limit: 1000 }),
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

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
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

  useEffect(() => { fetchMetadata(); }, [fetchMetadata]);
  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => {
    if (semesters.length > 0) fetchStats();
  }, [fetchStats, semesters]);

  const fetchData = useCallback(async () => {
    await Promise.all([fetchClasses(), fetchStats()]);
  }, [fetchClasses, fetchStats]);

  const activeSemester = useMemo(() =>
    semesters.find(s => s.isActive),
    [semesters]
  );

  const filteredClasses = classes;

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
      await fetchData();
    } finally {
      setToggling(null);
    }
  };

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

  return {
    // Data
    classes: filteredClasses,
    courses,
    semesters,
    dosenList,
    loading,
    error,
    stats,
    statsLoading,
    activeSemester,
    // Pagination
    page,
    setPage,
    limit,
    totalItems,
    totalPages,
    // Filter
    searchQuery,
    setSearchQuery,
    filterSemester,
    setFilterSemester,
    filterEnrollment,
    setFilterEnrollment,
    // Modal
    showModal,
    setShowModal,
    editingClass,
    formData,
    setFormData,
    submitting,
    submitError,
    submitSuccess,
    // Delete
    deleteConfirm,
    setDeleteConfirm,
    deleting,
    // Toggle
    toggling,
    // Handlers
    handleOpenCreate,
    handleOpenEdit,
    handleSubmit,
    handleToggleEnrollment,
    handleBulkToggle,
    handleDelete,
    getSemesterLabel,
    fetchData,
  };
};
