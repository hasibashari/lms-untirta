import { ClipboardList, Edit3, Eye } from 'lucide-react';
import Breadcrumb from '@/shared/components/navigation/Breadcrumb';
import { useAssignCreate } from '../hooks/useAssignCreate';
import { AssignForm } from '../components/AssignForm';

/**
 * CreateAssignment - Form Buat Tugas Baru (Dosen)
 * Mendukung instruksi berbasis Markdown
 */
export default function CreateAssignment() {
  const {
    classId,
    isEditMode,
    title,
    setTitle,
    description,
    setDescription,
    dueDate,
    setDueDate,
    loading,
    fetchLoading,
    error,
    setError,
    activeTab,
    setActiveTab,
    getMinDateTime,
    handleSubmit,
    navigate,
  } = useAssignCreate();

  if (!classId || classId === 'undefined') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-slate-500">Memuat data kelas...</p>
      </div>
    );
  }

  // Loading state saat fetch data untuk edit
  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500">Memuat data tugas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/dosen/dashboard' },
          { label: 'Kelas Saya', to: '/dosen/classes' },
          { label: 'Kelas', to: `/dosen/classes/${classId}` },
          { label: 'Tugas', to: `/dosen/classes/${classId}/assignments` },
          { label: isEditMode ? 'Edit Tugas' : 'Buat Tugas' },
        ]}
      />

      {/* Page Header dengan Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <ClipboardList size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
              {isEditMode ? 'Edit Tugas' : 'Buat Tugas Baru'}
            </h1>
            <p className="text-slate-500 mt-0.5">
              {isEditMode
                ? 'Perbarui instruksi tugas'
                : 'Tulis instruksi tugas dengan jelas menggunakan Markdown'}
            </p>
          </div>
        </div>

        {/* Tab Switch Edit/Preview */}
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'edit'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 size={16} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'preview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye size={16} />
            Preview
          </button>
        </div>
      </div>

      <AssignForm
        classId={classId}
        isEditMode={isEditMode}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        dueDate={dueDate}
        setDueDate={setDueDate}
        loading={loading}
        error={error}
        setError={setError}
        activeTab={activeTab}
        getMinDateTime={getMinDateTime}
        handleSubmit={handleSubmit}
        navigate={navigate}
      />
    </div>
  );
}
