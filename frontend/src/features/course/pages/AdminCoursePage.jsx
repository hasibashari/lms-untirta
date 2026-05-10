import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Plus,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Edit,
  Trash2,
} from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { getAllCourses, createCourse, updateCourse, deleteCourse } from '../courseService';
import { getDosen } from '../../user/userService';
import { Button } from '@/components/ui/button';
import PaginationComponent from '../../../components/shared/PaginationComponent';

/**
 * Courses - Kelola Mata Kuliah (Admin)
 * Admin dapat:
 * - Melihat semua mata kuliah
 * - Membuat mata kuliah baru
 * - Mengassign dosen ke mata kuliah
 * - Menentukan semester mata kuliah
 * - Menghapus mata kuliah
 */
const Courses = () => {
  // State data
  const [courses, setCourses] = useState([]);
  const [dosenList, setDosenList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 9; // Show 9 courses per page (3x3 grid)

  // State modal create/edit
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    semester: 1,
    sks: 3,
    teacherId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // State delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  // Fetch dosen list once
  useEffect(() => {
    getDosen().then(res => setDosenList(res.data || [])).catch(console.error);
  }, []);

  // Fetch courses with debounce for search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const fetchData = async () => {
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
      };

      fetchData();
    }, searchQuery ? 500 : 0);

    return () => clearTimeout(timeoutId);
  }, [currentPage, searchQuery, filterSemester]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSemester]);

  // Course count is now based on totalItems from backend

  // Open modal for create
  const handleOpenCreate = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      code: '',
      description: '',
      semester: 1,
      sks: 3,
      teacherId: '',
    });
    setSubmitError(null);
    setSubmitSuccess(null);
    setShowModal(true);
  };

  // Open modal for edit
  const handleOpenEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || '',
      code: course.code || '',
      description: course.description || '',
      semester: course.semester || 1,
      sks: course.sks || 3,
      teacherId: course.teacherId || '',
    });
    setSubmitError(null);
    setSubmitSuccess(null);
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const payload = {
        ...formData,
        semester: parseInt(formData.semester),
        sks: parseInt(formData.sks),
        teacherId: formData.teacherId || null,
      };

      if (editingCourse) {
        // Update existing course
        const res = await updateCourse(editingCourse.id, payload);
        setCourses(prev => prev.map(c => c.id === editingCourse.id ? res.data : c));
        setSubmitSuccess('Mata kuliah berhasil diperbarui!');
      } else {
        // Create new course
        const res = await createCourse(payload);
        setCourses(prev => [...prev, res.data]);
        setSubmitSuccess('Mata kuliah baru berhasil dibuat!');
      }

      // Close modal after 1.5 seconds
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

  // Handle delete
  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      await deleteCourse(deleteConfirm.id);
      setCourses(prev => prev.filter(c => c.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menghapus mata kuliah');
    } finally {
      setDeleting(false);
    }
  };

  // Get dosen name by ID

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Mata Kuliah</h1>
          <p className="text-gray-600 mt-1">
            Buat dan kelola katalog mata kuliah untuk sistem KRS
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Jadwal dan ruangan diatur saat membuat Kelas agar sesuai per semester dan section.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus size={18} />
          Tambah Mata Kuliah
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari mata kuliah, kode, atau dosen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Semester Filter */}
        <select
          value={filterSemester}
          onChange={(e) => setFilterSemester(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">Semua Semester</option>
          {semesters.map(sem => (
            <option key={sem} value={sem}>Semester {sem}</option>
          ))}
        </select>
      </div>

      {/* Course Count */}
      {!loading && !error && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BookOpen size={16} />
          <span>Menampilkan {courses.length} dari {totalItems} mata kuliah</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-red-600 hover:underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && courses.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <BookOpen size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Mata Kuliah</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-4">
            Buat mata kuliah baru untuk memulai sistem KRS
          </p>
          <Button onClick={handleOpenCreate} className="inline-flex items-center gap-2">
            <Plus size={18} />
            Tambah Mata Kuliah Pertama
          </Button>
        </div>
      )}

      {/* Course Grid */}
      {!loading && !error && courses.length > 0 && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <CourseCard
                key={course.id}
                title={course.title}
                code={course.code}
                teacher={{ name: course.teacher?.name || 'Belum ada dosen' }}
                semester={course.semester}
                sks={course.sks}
                studentsCount={course.studentsCount || 0}
                materialsCount={course.materialsCount || 0}
                schedule={course.schedule}
                description={course.description}
                showActionsOnHover={false}
                actions={[
                  {
                    icon: Edit,
                    label: 'Edit',
                    color: 'blue',
                    onClick: () => handleOpenEdit(course),
                  },
                  {
                    icon: Trash2,
                    label: 'Hapus',
                    color: 'red',
                    onClick: () => setDeleteConfirm(course),
                  },
                ]}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center pt-4">
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
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
                {editingCourse ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah Baru'}
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
              {/* Success Message */}
              {submitSuccess && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle size={20} className="text-green-600" />
                  <p className="text-green-700 font-medium">{submitSuccess}</p>
                </div>
              )}

              {/* Error Message */}
              {submitError && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={20} className="text-red-600" />
                  <p className="text-red-700">{submitError}</p>
                </div>
              )}

              {!submitSuccess && (
                <>
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Mata Kuliah <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="contoh: Pemrograman Web"
                      required
                    />
                  </div>

                  {/* Code & SKS */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kode MK <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="contoh: IF-201"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKS
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={formData.sks}
                        onChange={(e) => setFormData(prev => ({ ...prev, sks: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Semester & Dosen */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Semester <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.semester}
                        onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                      >
                        {semesters.map(sem => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dosen Pengampu
                      </label>
                      <select
                        value={formData.teacherId}
                        onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">-- Pilih Dosen --</option>
                        {dosenList.map(dosen => (
                          <option key={dosen.id} value={dosen.id}>{dosen.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      placeholder="Deskripsi singkat tentang mata kuliah ini..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
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
                      ) : editingCourse ? 'Simpan Perubahan' : 'Tambah Mata Kuliah'}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Hapus Mata Kuliah?
              </h3>
              <p className="text-gray-500 mb-6">
                Anda yakin ingin menghapus mata kuliah <strong>{deleteConfirm.title}</strong>?
                Semua data terkait (materi, tugas, enrollment) juga akan dihapus.
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

export default Courses;
