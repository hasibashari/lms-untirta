import {
  BookOpen,
  Plus,
  AlertCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useAdminClasses } from '../hooks/useAdminClasses';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/shared/components/ui/pagination';
import { Button } from '@/shared/components/ui/button';

// Components
import { ClassStats } from '../components/ClassStats';
import { ClassFilter } from '../components/ClassFilter';
import { ClassTable } from '../components/ClassTable';
import { ClassFormModal } from '../components/ClassFormModal';
import { ClassDeleteModal } from '../components/ClassDeleteModal';

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
  const {
    // Data
    classes,
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
  } = useAdminClasses();

  // filteredClasses comes from hook as `classes`
  const filteredClasses = classes;

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

      {/* Stats Cards and Warnings */}
      <ClassStats
        stats={stats}
        loading={loading}
        error={error}
        statsLoading={statsLoading}
        activeSemester={activeSemester}
        getSemesterLabel={getSemesterLabel}
        handleBulkToggle={handleBulkToggle}
        toggling={toggling}
      />

      {/* Filters */}
      <ClassFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterSemester={filterSemester}
        setFilterSemester={setFilterSemester}
        filterEnrollment={filterEnrollment}
        setFilterEnrollment={setFilterEnrollment}
        semesters={semesters}
        getSemesterLabel={getSemesterLabel}
      />

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
        <ClassTable
          filteredClasses={filteredClasses}
          page={page}
          limit={limit}
          getSemesterLabel={getSemesterLabel}
          handleToggleEnrollment={handleToggleEnrollment}
          toggling={toggling}
          handleOpenEdit={handleOpenEdit}
          setDeleteConfirm={setDeleteConfirm}
        />
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

      {/* Modals */}
      <ClassFormModal
        showModal={showModal}
        setShowModal={setShowModal}
        editingClass={editingClass}
        formData={formData}
        setFormData={setFormData}
        submitting={submitting}
        submitSuccess={submitSuccess}
        submitError={submitError}
        handleSubmit={handleSubmit}
        courses={courses}
        dosenList={dosenList}
        semesters={semesters}
        getSemesterLabel={getSemesterLabel}
      />

      <ClassDeleteModal
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        deleting={deleting}
        handleDelete={handleDelete}
      />
    </div>
  );
};

export default AdminClassesPage;
