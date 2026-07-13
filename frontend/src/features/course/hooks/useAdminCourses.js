import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getAllCourses, createCourse as createCourseApi, updateCourse as updateCourseApi, deleteCourse as deleteCourseApi } from '../api/course.api';
import { getDosen } from '../../user/userService';

export const useAdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [dosenList, setDosenList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters and Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 9;

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initial fetch for dosen list
  useEffect(() => {
    getDosen().then(res => setDosenList(res.data || [])).catch(console.error);
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getAllCourses({
        page: currentPage,
        limit,
        search: searchQuery,
        semester: filterSemester
      });

      setCourses(res.data || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalItems(res.pagination.total);
      }
    } catch (err) {
      setError(err?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, filterSemester]);

  // Fetch courses with debounce for search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCourses();
    }, searchQuery ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [fetchCourses, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSemester]);

  // Modal Handlers
  const handleOpenCreate = () => {
    setEditingCourse(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (course) => {
    setEditingCourse(course);
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    if (!isSubmitting) setShowFormModal(false);
  };

  // Submit Handler (Create/Update)
  const handleSubmitForm = async (formData, onSuccess, onError) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        semester: parseInt(formData.semester),
        sks: parseInt(formData.sks),
        teacherId: formData.teacherId || null,
      };

      if (editingCourse) {
        const res = await updateCourseApi(editingCourse.id, payload);
        setCourses(prev => prev.map(c => c.id === editingCourse.id ? res.data : c));
      } else {
        const res = await createCourseApi(payload);
        setCourses(prev => [...prev, res.data]);
      }
      onSuccess?.(editingCourse ? 'Mata kuliah berhasil diperbarui!' : 'Mata kuliah baru berhasil dibuat!');
      
      setTimeout(() => {
        handleCloseFormModal();
      }, 1500);
    } catch (err) {
      onError?.(err?.response?.data?.message || err?.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteCourseApi(deleteConfirm.id);
      setCourses(prev => prev.filter(c => c.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menghapus mata kuliah');
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    // Data
    courses,
    dosenList,
    loading,
    error,
    refetch: fetchCourses,
    
    // Pagination & Filters
    searchQuery,
    setSearchQuery,
    filterSemester,
    setFilterSemester,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    
    // Modals state
    showFormModal,
    editingCourse,
    deleteConfirm,
    isSubmitting,
    isDeleting,
    
    // Actions
    handleOpenCreate,
    handleOpenEdit,
    handleCloseFormModal,
    handleSubmitForm,
    setDeleteConfirm,
    handleDelete,
  };
};
