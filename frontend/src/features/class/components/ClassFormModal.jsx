import { X, CheckCircle, AlertCircle, Loader2, ToggleRight, ToggleLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export const ClassFormModal = ({
  showModal,
  setShowModal,
  editingClass,
  formData,
  setFormData,
  submitting,
  submitSuccess,
  submitError,
  handleSubmit,
  courses,
  dosenList,
  semesters,
  getSemesterLabel,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !submitting && setShowModal(false)}
      />

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
                    const selectedCourse = courses.find((c) => c.id === cid);
                    setFormData((prev) => ({
                      ...prev,
                      courseId: cid,
                      lecturerId:
                        selectedCourse?.teacherId ||
                        selectedCourse?.teacher?.id ||
                        prev.lecturerId,
                    }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  required
                >
                  <option value="">-- Pilih Mata Kuliah --</option>
                  {courses.map((c) => (
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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, academicSemesterId: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  required
                >
                  <option value="">-- Pilih Semester --</option>
                  {semesters.map((s) => (
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
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, lecturerId: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    required
                  >
                    <option value="">-- Pilih Dosen --</option>
                    {dosenList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData((prev) => ({ ...prev, section: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    required
                  >
                    {['A', 'B', 'C', 'D', 'E', 'F'].map((s) => (
                      <option key={s} value={s}>
                        Kelas {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule & Room */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jadwal</label>
                  <input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData((prev) => ({ ...prev, schedule: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Senin, 08:00-10:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ruangan</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData((prev) => ({ ...prev, room: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="A1.01"
                  />
                </div>
              </div>

              {/* Capacity & Enrollment Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formData.capacity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, capacity: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pendaftaran
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, isEnrollmentOpen: !prev.isEnrollmentOpen }))
                    }
                    className={`w-full px-4 py-2 rounded-lg border text-sm font-medium transition flex items-center justify-center gap-2 ${
                      formData.isEnrollmentOpen
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
                  ) : editingClass ? (
                    'Simpan Perubahan'
                  ) : (
                    'Tambah Kelas'
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
