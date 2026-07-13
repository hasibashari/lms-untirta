import {
  BookOpen,
  Plus,
  Search,
  AlertCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import CourseCard from '../components/CourseCard';
import CourseFormModal from '../components/CourseFormModal';
import DeleteCourseModal from '../components/DeleteCourseModal';
import { useAdminCourses } from '../hooks/useAdminCourses';
import { Button } from '@/shared/components/ui/button';
import PaginationComponent from '@/shared/components/data-display/Pagination';

/**
 * Courses - Kelola Mata Kuliah (Admin)
 * Refactored using Feature-Sliced Design approach
 */
const Courses = () => {
  const {
    courses,
    dosenList,
    loading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    filterSemester,
    setFilterSemester,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    showFormModal,
    editingCourse,
    deleteConfirm,
    isSubmitting,
    isDeleting,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseFormModal,
    handleSubmitForm,
    setDeleteConfirm,
    handleDelete,
  } = useAdminCourses();

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

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
            onClick={() => refetch()}
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

      {/* Extracted Modals */}
      <CourseFormModal
        isOpen={showFormModal}
        onClose={handleCloseFormModal}
        editingCourse={editingCourse}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
        dosenList={dosenList}
      />

      <DeleteCourseModal
        course={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Courses;
