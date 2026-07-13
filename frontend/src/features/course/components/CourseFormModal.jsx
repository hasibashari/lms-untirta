import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

const CourseFormModal = ({ 
  isOpen, 
  onClose, 
  editingCourse, 
  onSubmit, 
  isSubmitting, 
  dosenList 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    semester: 1,
    sks: 3,
    teacherId: '',
  });
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    if (isOpen) {
      if (editingCourse) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          title: editingCourse.title || '',
          code: editingCourse.code || '',
          description: editingCourse.description || '',
          semester: editingCourse.semester || 1,
          sks: editingCourse.sks || 3,
          teacherId: editingCourse.teacherId || '',
        });
      } else {
        setFormData({
          title: '',
          code: '',
          description: '',
          semester: 1,
          sks: 3,
          teacherId: '',
        });
      }
      setSubmitError(null);
      setSubmitSuccess(null);
    }
  }, [isOpen, editingCourse]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    
    onSubmit(
      formData, 
      (msg) => setSubmitSuccess(msg), 
      (msg) => setSubmitError(msg)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => !isSubmitting && onClose()} />

      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {editingCourse ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah Baru'}
          </h2>
          <button
            onClick={() => !isSubmitting && onClose()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={isSubmitting}
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
                  onClick={() => onClose()}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
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
  );
};

export default CourseFormModal;
