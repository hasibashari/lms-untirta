import { AlertCircle } from 'lucide-react';

const DeleteCourseModal = ({ course, onClose, onConfirm, isDeleting }) => {
  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => !isDeleting && onClose()} />

      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Hapus Mata Kuliah?
          </h3>
          <p className="text-gray-500 mb-6">
            Anda yakin ingin menghapus mata kuliah <strong>{course.title}</strong>?
            Semua data terkait (materi, tugas, enrollment) juga akan dihapus.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onClose()}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              disabled={isDeleting}
            >
              Batal
            </button>
            <button
              onClick={() => onConfirm()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteCourseModal;
